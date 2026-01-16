// ===========================================
// services/EmailService.js
// ===========================================
import { sendMail } from "../utils/Mailer.js";

// -------------------------------------------
// Email Templates
// -------------------------------------------

const BOOKINGS_BCC = process.env.EMAIL_BCC_BOOKINGS || null;

function bookingTemplate({ title, customerName, doctorName, hospitalName, date, time }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
      <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <h2 style="text-align: center; color: #004aad;">${title}</h2>
        
        <p style="font-size: 16px;">Dear <strong>${customerName}</strong>,</p>
        
        <p style="font-size: 16px;">We are pleased to confirm your appointment details below:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #e6f0ff;">
            <td style="padding: 10px; font-weight: bold; color: #004aad;">Doctor</td>
            <td style="padding: 10px;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #004aad;">Hospital</td>
            <td style="padding: 10px;">${hospitalName}</td>
          </tr>
          <tr style="background-color: #e6f0ff;">
            <td style="padding: 10px; font-weight: bold; color: #004aad;">Date</td>
            <td style="padding: 10px;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #004aad;">Time</td>
            <td style="padding: 10px;">${time}</td>
          </tr>
        </table>
        
        <p style="font-size: 16px;">If you need to reschedule or have any other inquiries, please don't hesitate to contact us.</p>
        
        <p style="font-size: 16px;">Thank you for choosing Healine! We look forward to seeing you soon.</p>
        
        <p style="font-size: 16px; text-align: center; color: #999;">Healine Team</p>
      </div>
    </div>
  `;
}

// -------------------------------------------
// Send 3 Emails
// -------------------------------------------
export async function sendBookingEmails({
  eventType,
  customerEmail, customerName,
  doctorEmail, doctorName,
  hospitalEmail, hospitalName,
  date, time
}) {

  const subjectMap = {
    created: "Appointment Confirmed",
    updated: "Appointment Rescheduled",
    cancelled: "Appointment Cancelled"
  };

  const titleMap = {
    created: "Your Appointment is Confirmed",
    updated: "Your Appointment is Rescheduled",
    cancelled: "Your Appointment is Cancelled"
  };

  const subject = subjectMap[eventType];
  const title = titleMap[eventType];

  // CUSTOMER EMAIL
  await sendMail({
    to: customerEmail,
    bcc: BOOKINGS_BCC, // ⭐ ENV-BASED

    subject,
    html: bookingTemplate({
      title,
      customerName,
      doctorName,
      hospitalName,
      date,
      time
    })
  });

  // DOCTOR EMAIL
  if (doctorEmail) {
    await sendMail({
      to: doctorEmail,
      bcc: BOOKINGS_BCC, // ⭐ ENV-BASED

      subject: `Patient Booking - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h2 style="text-align: center; color: #004aad;">${subject}</h2>
            <p style="font-size: 16px;">Dear <strong>Dr. ${doctorName}</strong>,</p>
            <p style="font-size: 16px;">You have an updated appointment booking:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background-color: #e6f0ff;">
                <td style="padding: 10px; font-weight: bold; color: #004aad;">Date</td>
                <td style="padding: 10px;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #004aad;">Time</td>
                <td style="padding: 10px;">${time}</td>
              </tr>
            </table>
            <p style="font-size: 16px;">Please confirm your availability or contact us if you need to reschedule.</p>
            <p style="font-size: 16px; text-align: center; color: #999;">Healine Team</p>
          </div>
        </div>
      `
    });
  }

  // HOSPITAL EMAIL
  if (hospitalEmail) {
    await sendMail({
      to: hospitalEmail,
      subject: `Hospital Appointment Update - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h2 style="text-align: center; color: #004aad;">${subject}</h2>
            <p style="font-size: 16px;">Dear ${hospitalName} Team,</p>
            <p style="font-size: 16px;">There has been an update to a patient's appointment:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background-color: #e6f0ff;">
                <td style="padding: 10px; font-weight: bold; color: #004aad;">Date</td>
                <td style="padding: 10px;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #004aad;">Time</td>
                <td style="padding: 10px;">${time}</td>
              </tr>
            </table>
            <p style="font-size: 16px;">Please review and confirm the appointment scheduling.</p>
            <p style="font-size: 16px; text-align: center; color: #999;">Healine Team</p>
          </div>
        </div>
      `
    });
  }
}


// ⭐ NEW CODE
// ========================================================
// PACKAGE PAYMENT SUCCESS EMAIL
// ========================================================
export async function sendPackagePaymentSuccessEmail({
  customerEmail,
  customerName,
  packageName,

  amount,
  bookingId,
}) {
  await sendMail({
    to: customerEmail,
    bcc: BOOKINGS_BCC,

    subject: "Payment Successful - Healine",
    html: `
      <div style="font-family: Arial; background:#f9f9f9; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:25px; border-radius:8px;">
          <h2 style="text-align:center; color:#004aad;">Payment Successful</h2>

          <p>Hello <strong>${customerName}</strong>,</p>

          <p>Your payment for the package <strong>${packageName}</strong> is successful.</p>

          <table style="width:100%; margin-top:20px;">
            <tr>
              <td><strong>Booking ID</strong></td>
              <td>${bookingId}</td>
            </tr>
            <tr>
              <td><strong>Amount Paid</strong></td>
              <td>AED ${amount}</td>
            </tr>
          </table>

          <p style="margin-top:20px;">Thank you for choosing Healine!</p>

        </div>
      </div>
    `
  });

  console.log("Payment success email sent");
}
