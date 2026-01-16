// ===================================================
// PAYMENTS CONTROLLER (FULL UPDATED FILE)
// ===================================================
// All new code is marked with:  // *** NEW ***
// ===================================================

import Stripe from 'stripe';
import database from '../models/index.js';
import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import { sendPackagePaymentSuccessEmail } from "../services/EmailService.js";
import NotificationService from '../services/notificationService.js';
import { sendAdminNotification } from '../utils/adminNotifier.js';

function formatDate(d) {
  if (!d) return "";
  const dateObj = new Date(d);

  const options = { day: "2-digit", month: "short", year: "numeric" };
  return dateObj.toLocaleDateString("en-GB", options); 
  // Example: "08 Dec 2025"
}


const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Stripe secret key not configured. Please set STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecretKey);

// ======================================================
// 1. CREATE PAYMENT INTENT
// ======================================================
async function createPaymentIntent(req, res) {
  try {
    const { bookingId, amount, currency } = req.body;
    const userId = req.user.id;

    if (!bookingId || !amount || !currency) {
      return res.status(httpStatus.BAD_REQUEST).json(
        new APIResponse({}, 'bookingId, amount and currency is required', httpStatus.BAD_REQUEST)
      );
    }

    const booking = await database.PackageBooking.findOne({
      where: {
        id: bookingId,
        customer_id: userId,
        booking_status: 0,
      },
      attributes: ['id', 'total_price', 'customer_id'],
    });

    if (!booking) {
      return res.status(httpStatus.NOT_FOUND).json(
        new APIResponse({}, 'Booking not found or not payable', httpStatus.NOT_FOUND)
      );
    }

    // Get / create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(userId);

    // === Create Stripe intent ===
    const intent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency,
        customer: stripeCustomerId, // *** NEW ***
        payment_method_types: ['card'],
        setup_future_usage: 'off_session', // *** NEW ***
        metadata: {
          bookingId: booking.id.toString(),
          userId: userId.toString(),
        },
      },
      {
        idempotencyKey: `booking_${booking.id}_${Date.now()}`,
      }
    );

    await booking.update({
      stripe_payment_intent_id: intent.id,
    });

    return res.status(httpStatus.OK).json(
      new APIResponse(
        {
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
        },
        'Payment intent created',
        httpStatus.OK
      )
    );
  } catch (error) {
    console.error('createPaymentIntent error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      new APIResponse({}, 'Failed to create payment intent', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
}

// ======================================================
// 2. STRIPE WEBHOOK
// ======================================================
async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret missing. Set STRIPE_WEBHOOK_SECRET');
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      new APIResponse({}, 'Stripe webhook secret not configured', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }

  if (!sig) {
    return res.status(httpStatus.BAD_REQUEST).send('Missing Stripe signature header');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('stripeWebhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const pi = event.data.object;

  if (event.type === 'payment_intent.succeeded') {
    await handlePaymentSuccess(pi);
  }

  if (event.type === 'payment_intent.payment_failed') {
    await handlePaymentFailed(pi);
  }
  if (event.type === 'setup_intent.succeeded') {
    await handleSetupIntentSuccess(event.data.object); // *** NEW ***
  }

  if (event.type === 'setup_intent.failed') {
    await handleSetupIntentFailed(event.data.object); // *** NEW ***
  }

  return res.json({ received: true });
}

// ======================================================
// 3. HANDLE SUCCESS (Save the token + card)
// ======================================================
// ======================================================
// 3. HANDLE SUCCESS (Save the token + card)
// ======================================================
async function handlePaymentSuccess(pi) {
  try {
    // Find booking linked to payment intent
    const booking = await database.PackageBooking.findOne({
      where: { stripe_payment_intent_id: pi.id },
    });

    if (!booking) return;

    // ---------------------------------------------------
    // UPDATE BOOKING STATUS
    // ---------------------------------------------------
    if (booking.booking_status === 0) {
      await booking.update({
        booking_status: 0,
        payment_status: 1,
        payment_method: pi.payment_method_types?.[0] || 'card',
        payment_id: pi.id,
        paid_at: new Date(),
      });
    }

    // ---------------------------------------------------
    // EXTRACT CARD DETAILS
    // ---------------------------------------------------
    const charge = pi.charges?.data?.[0];
    const card = charge?.payment_method_details?.card;

    // Save Payment history
    await database.Payment.create({
      user_id: booking.customer_id,
      stripe_payment_intent_id: pi.id,
      amount: pi.amount / 100,
      currency: pi.currency,
      status: 'completed',

      // Save reusable Stripe token
      payment_method: pi.payment_method,

      booking_id: booking.id,
      booking_type: 'package',
      receipt_url: charge?.receipt_url,

      // Card information
      card_brand: card?.brand || null,
      card_last4: card?.last4 || null,
      card_exp_month: card?.exp_month || null,
      card_exp_year: card?.exp_year || null,

      metadata: JSON.stringify(pi.metadata),
    });


    // ==================== Admin Notification =====================
    const cust = await database.Customer.findByPk(booking.customer_id);

    const customerPhone = customer
      ? `${customer.mobile_country_code || ""}${customer.mobile_no || ""}`
      : null;

    sendAdminNotification({
      type: "package_booking_success",
      title: "Package Booking Successful",
      body: `Package booking #${booking.id} payment completed for package ${booking.package_name}`,
      metadata: {
        bookingId: booking.id,

        // Package
        packageId: booking.package_id,
        packageName: booking.package_name || "Health Package",

        // Date & Slot
        bookedDate: booking.booked_date,
        formattedDate: formatDate(booking.booked_date),
        slot: booking.slot,

        // Pricing
        packagePrice: booking.package_price,
        addonsPrice: booking.addons_price,
        totalPrice: booking.total_price,

        // Collection type
        homeCollection: booking.home_collection === 1,

        // Customer
        customerId: booking.customer_id,
        customerName: cust
          ? `${cust.first_name || ""} ${cust.last_name || ""}`.trim()
          : null,
        customerPhone,

        // Address snapshot (for ops team)
        address: booking.customer_address_snapshot || null
      }
    });


    // ---------------------------------------------------
    // ⭐ NEW PART — SEND PAYMENT SUCCESS NOTIFICATION
    // ---------------------------------------------------

    try {
      const notPre = await db.NotificationPreference.findOne({
        where: { customer_id: booking.customer_id }
      })

      if (
          notPre &&
          notPre.appointment_confirmations === false &&
          notPre.payment_confirmations === false
        ) {
        console.log("⏭ Skipping notification: appointment_confirmations OFF");
      } else {
        const customer = await database.Customer.findByPk(booking.customer_id);

        const customerName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
        const packageName = booking.package_name || "Health Package";
        const amountPaid = pi.amount / 100;
        const booked_date = formatDate(booking.booked_date)
        const slot = booking.slot

        // SAVE NOTIFICATION IN DB
        await database.Notification.create({
          customer_id: customer.id,
          category: "appointments",
          type: "packageBooking",
          resource_type: "package_booking",
          resource_id: booking.id,

          title: "Payment Successful",
          body: `${packageName} booking on ${slot} at ${booked_date} is confirmed`,

          metadata: {
            id: String(booking.id),
            packageId: String(booking.package_id),
            packageName,
            customerName,
            booked_date,
            slot,
          },

          isRead: false,
          status: "pending"
        });

        // PUSH NOTIFICATION
        await NotificationService.sendNotification(
          customer.id,
          "Payment Successful",
          `${packageName} booking confirmed`,
          {
            type: "paymentSuccess",
            bookingId: String(booking.id),
            packageName,
            amount: String(amountPaid)
          }
        );
      }

    } catch (notifyErr) {
      console.error("Payment success notification failed:", notifyErr);
    }

    // ---------------------------------------------------
    // ⭐ NEW PART — SEND PAYMENT SUCCESS EMAIL
    // ---------------------------------------------------
    const customer = await database.Customer.findByPk(booking.customer_id);

    await sendPackagePaymentSuccessEmail({
      customerEmail: customer.email,
      customerName: `${customer.first_name} ${customer.last_name}`,
      packageName: booking.package_name || "Health Package",
      amount: pi.amount / 100,
      bookingId: booking.id,
    });

    console.log("⭐ Payment success email sent");

  } catch (err) {
    console.error("handlePaymentSuccess error:", err);
  }
}


// ======================================================
// 4. HANDLE FAILED PAYMENT
// ======================================================
async function handlePaymentFailed(pi) {
  const booking = await database.PackageBooking.findOne({
    where: { stripe_payment_intent_id: pi.id },
  });

  if (booking) {
    await booking.update({
      booking_status: 3,
      payment_status: 0,  // unpaid
    });
  }

  await database.Payment.create({
    user_id: booking?.customer_id || null,
    stripe_payment_intent_id: pi.id,
    amount: pi.amount / 100,
    currency: pi.currency,
    status: 'failed',
    payment_method: pi.payment_method || null,
    booking_id: booking?.id,
    failure_reason: pi.last_payment_error?.message || null,
    metadata: JSON.stringify(pi.metadata),
  });
}

// ======================================================
// 6. GET PAYMENT HISTORY
// ======================================================
async function getPaymentHistory(req, res) {
  try {
    const userId = req.user.id;

    const history = await database.Payment.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });

    return res.status(httpStatus.OK).json(
      new APIResponse(history, 'History fetched', httpStatus.OK)
    );
  } catch (error) {
    console.error('getPaymentHistory error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      new APIResponse({}, 'Failed to fetch history', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
}

// ======================================================
// (HELPER) Get or create Stripe Customer for our Customer
// ======================================================
async function getOrCreateStripeCustomer(userId) {
  const customer = await database.Customer.findByPk(userId);

  if (!customer) throw new Error('Customer not found');

  // Already has Stripe customer
  if (customer.stripe_customer_id) return customer.stripe_customer_id;

  // Create new Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email: customer.email,
    name: `${customer.first_name} ${customer.last_name}`,
  });

  // Save in DB
  await customer.update({
    stripe_customer_id: stripeCustomer.id, // *** NEW ***
  });

  return stripeCustomer.id;
}



async function getSavedCards(req, res) {
  try {
    const userId = req.user.id;

    // 1. Get customer from DB
    const user = await database.Customer.findByPk(userId);

    if (!user || !user.stripe_customer_id) {
      return res.status(httpStatus.OK).json(
        new APIResponse({ cards: [] }, 'No saved cards found', httpStatus.OK)
      );
    }

    // 2. Fetch live payment methods from STRIPE
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: 'card',
    });

    // 3. Format response
    const cards = paymentMethods.data.map(pm => ({
      payment_method_id: pm.id,
      card_brand: pm.card.brand,
      card_last4: pm.card.last4,
      card_exp_month: pm.card.exp_month,
      card_exp_year: pm.card.exp_year,
    }));

    return res.status(httpStatus.OK).json(
      new APIResponse({ cards }, 'Saved cards fetched from Stripe', httpStatus.OK)
    );

  } catch (error) {
    console.error('getSavedCards error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      new APIResponse({}, 'Failed to fetch cards', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
}




async function createSetupIntent(req, res) {
  try {
    const userId = req.user.id;

    // 🔥 Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(userId);

    // 🔥 Create Setup Intent
    const setupIntent = await stripe.setupIntents.create(
      {
        customer: stripeCustomerId,      // *** NEW ***
        payment_method_types: ['card'],  // *** NEW ***
        usage: 'off_session',            // *** NEW ***
      },
      {
        idempotencyKey: `setup_${userId}_${Date.now()}`,
      }
    );

    return res.status(httpStatus.OK).json(
      new APIResponse(
        {
          clientSecret: setupIntent.client_secret, // send to frontend
          setupIntentId: setupIntent.id,
        },
        'Setup intent created',
        httpStatus.OK
      )
    );
  } catch (error) {
    console.error('createSetupIntent error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      new APIResponse({}, 'Failed to create setup intent', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
}

// ======================================================
//  HANDLE SETUP INTENT SUCCESS  (SAVE CARD ONLY)
// ======================================================
async function handleSetupIntentSuccess(setupIntent) {
  const stripeCustomerId = setupIntent.customer;
  const paymentMethodId = setupIntent.payment_method;

  // Get user from DB using stripe_customer_id
  const user = await database.Customer.findOne({
    where: { stripe_customer_id: stripeCustomerId },
  });

  if (!user) return;

  // 🔥 Retrieve card details from Stripe
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

  // 🔥 Save card in DB
  await database.SavedCard.create({
    user_id: user.id,
    stripe_payment_method_id: paymentMethodId,

    card_brand: pm.card.brand,
    card_last4: pm.card.last4,
    card_exp_month: pm.card.exp_month,
    card_exp_year: pm.card.exp_year,
  });

  console.log("Card saved successfully:", paymentMethodId);
}
async function handleSetupIntentFailed(setupIntent) {
  console.log("Setup Intent Failed:", setupIntent.last_setup_error?.message);
}

// ======================================================
// 5. DELETE CARD (PCI-COMPLIANT - Uses Payment Methods API)
// ======================================================
async function deleteCard(req, res) {
  try {
    const userId = req.user.id;
    const { paymentMethodId } = req.body;  // paymentMethodId = Stripe PaymentMethod ID (pm_xxx)

    if (!paymentMethodId) {
      return res.status(httpStatus.BAD_REQUEST).json(
        new APIResponse({}, 'paymentMethodId is required', httpStatus.BAD_REQUEST)
      );
    }

    // 1. Verify the payment method belongs to the user's customer
    const user = await database.Customer.findByPk(userId);

    if (!user || !user.stripe_customer_id) {
      return res.status(httpStatus.BAD_REQUEST).json(
        new APIResponse({}, 'No Stripe customer found', httpStatus.BAD_REQUEST)
      );
    }

    // 2. Retrieve the payment method to verify ownership
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== user.stripe_customer_id) {
      return res.status(httpStatus.FORBIDDEN).json(
        new APIResponse({}, 'Payment method does not belong to this customer', httpStatus.FORBIDDEN)
      );
    }

    // 3. Detach payment method from customer (PCI-compliant way)
    const detached = await stripe.paymentMethods.detach(paymentMethodId);

    // 4. Optionally delete from local DB if you store SavedCard records
    if (database.SavedCard) {
      await database.SavedCard.destroy({
        where: {
          user_id: userId,
          stripe_payment_method_id: paymentMethodId,
        },
      });
    }

    return res.status(httpStatus.OK).json(
      new APIResponse(
        {
          payment_method_id: detached.id,
          detached: detached.id ? true : false,
        },
        'Card deleted successfully',
        httpStatus.OK
      )
    );

  } catch (error) {
    console.error('deleteCard error:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(httpStatus.BAD_REQUEST).json(
        new APIResponse({}, error.message || 'Invalid payment method', httpStatus.BAD_REQUEST)
      );
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      new APIResponse({}, 'Failed to delete card', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
}

// ======================================================
// 7. PAY WITH SAVED CARD (ON-SESSION - Requires CVV)
// ======================================================
async function payWithSavedCard(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId, paymentMethodId, amount } = req.body;

    if (!bookingId || !paymentMethodId) {
      return res.status(400).json(
        new APIResponse({}, "bookingId and paymentMethodId required", 400)
      );
    }

    if (!amount) {
      return res.status(400).json(
        new APIResponse({}, "amount is required", 400)
      );
    }


    // Validate booking
    const booking = await database.PackageBooking.findOne({
      where: { id: bookingId, customer_id: userId, booking_status: 0 }
    });

    if (!booking) {
      return res.status(404).json(
        new APIResponse({}, "Booking not found or already paid", 404)
      );
    }

    // Get stripe customer
    const user = await database.Customer.findByPk(userId);
    const stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      return res.status(400).json(
        new APIResponse({}, "Stripe customer missing", 400)
      );
    }

    const amountToCharge = parseFloat(amount);

    // Create Payment Intent using saved card (ON-SESSION - no off_session flag)
    // Frontend will confirm with CVV - this avoids mandate requirement for Indian cards
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountToCharge * 100),
      currency: "aed",
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      // REMOVED: off_session: true - makes it ON-SESSION
      // REMOVED: confirm: true - frontend will confirm with CVV
      metadata: {
        bookingId: booking.id.toString(),
        userId: userId.toString(),
      },
    });

    // Save PI id in DB
    await booking.update({ stripe_payment_intent_id: intent.id });

    // Return client_secret for frontend to confirm with Stripe Elements
    return res.status(200).json(
      new APIResponse(
        {
          paymentIntentId: intent.id,
          clientSecret: intent.client_secret,  // Frontend will use this to confirm
          status: intent.status,
          requiresAction: true  // Frontend should show Stripe UI for CVV
        },
        "Payment intent created - please confirm with CVV",
        200
      )
    );

  } catch (error) {
    console.error("payWithSavedCard error:", error);

    return res.status(500).json(
      new APIResponse({}, error.message || "Failed to create payment intent", 500)
    );
  }
}

// ======================================================
// EXPORT
// ======================================================
export default {
  createPaymentIntent,
  createSetupIntent,
  stripeWebhook,
  getSavedCards,
  getPaymentHistory,
  deleteCard,
  payWithSavedCard,

  // addCard removed - PCI violation. Use createSetupIntent() + webhook instead.
};
