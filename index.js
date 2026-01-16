import express from './express.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import httpStatus from 'http-status';
import http from 'http';
import enums from './api/server/utils/utils.js';
import APIResponse from './api/server/utils/APIResponse.js';
import cron from 'node-cron'; // Use import for ESM
import { Op } from 'sequelize';
import db from './api/server/models/index.js';
// import { Server } from 'socket.io';
// import socket from './api/server/socket/index.js';

import notificationRoutes from './api/server/routes/notificationRoutes.js';
import { processBookingReminders } from './api/server/controllers/BookingController.js';
import { processPackageBookingReminders } from './api/server/controllers/ServiceController.js';
import NotificationService from './api/server/services/notificationService.js';

const app = await express();


app.use(cors({
  origin: 'https://healine-836d0.web.app',
  credentials: true,
}));


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://healine-836d0.web.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// app.use(express.json());
app.use('/api', notificationRoutes);

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    console.log("hhhhhhhhhhhhhhhhhhhhhhhh");
    console.log(err);
    return res
      .status(httpStatus.OK)
      .json(
        new APIResponse(
          {},
          enums.TOKEN_ERROR.TOKEN_NOT_VALID,
          httpStatus.CONFLICT
        )
      );
  } else {
    next(err);
  }
});

cron.schedule('* * * * *', async () => {
  try {
    const tenMinutesAgo = new Date(new Date() - 10 * 60 * 1000);
    console.log('Checking for expired OTPs at', new Date(), 'before', tenMinutesAgo);
    const destroyedCount = await db.Otp.destroy({
      where: {
        created_at: { [Op.lt]: tenMinutesAgo }
      }
    });
    console.log(`Deleted ${destroyedCount} expired OTPs at`, new Date());
  } catch (error) {
    console.log('Error deleting expired OTPs', error);
  }
});

// ===============================
//  BOOKING REMINDER CRON JOB
// ===============================
cron.schedule('0 * * * *', async () => {
  console.log(`[CRON] Running booking reminder task at`, new Date());

  try {
    await processBookingReminders();
  } catch (error) {
    console.error('[CRON] Booking reminder error:', error);
  }
});



cron.schedule('0 0 * * *', async () => {
  try {
    // 1. Expire Bundles
    await database.BundlePurchase.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          expiration_date: { [Op.lt]: new Date() }
        }
      }
    );

    // 2. Expire B2B Coupons (Based on Subscription Expiry)
    // Find expired subscriptions
    const expiredSubscriptions = await database.B2BBundleSubscription.findAll({
      where: {
        valid_until: { [Op.lt]: new Date() }
      },
      attributes: ['id']
    });

    if (expiredSubscriptions.length > 0) {
      const expiredSubIds = expiredSubscriptions.map(s => s.id);

      await database.B2BEmployeeCoupon.update(
        { status: 'expired' },
        {
          where: {
            subscription_id: { [Op.in]: expiredSubIds },
            status: 'available' // Only expire available ones
          }
        }
      );
    }

    console.log("Daily expiry check completed (Bundles & B2B Coupons)");
  } catch (err) {
    console.error("Expiry cron error:", err);
  }
});


cron.schedule("0 * * * *", async () => {
  await processPackageBookingReminders();
});

// ===============================
//  SEND PENDING PUSH NOTIFICATIONS
// ===============================
cron.schedule("* * * * *", async () => {
  console.log(`[CRON] Checking pending push notifications at`, new Date());

  try {
    const pendingNotifications = await db.Notification.findAll({
      where: {
        status: "pending",
        type: "welcome"
      }
    });

    if (pendingNotifications.length === 0) {
      console.log("[CRON] No pending notifications");
      return;
    }

    console.log(`[CRON] Found ${pendingNotifications.length} pending notifications`);

    for (const note of pendingNotifications) {
      try {
        const customer = await db.Customer.findByPk(note.customer_id);

        if (!customer) {
          console.log(`[CRON] Customer ${note.customer_id} not found → skipping`);
          await note.update({ status: "failed" });
          continue;
        }

        const tokens = Array.isArray(customer.device_token)
          ? customer.device_token
          : typeof customer.device_token === "string"
            ? [customer.device_token]
            : [];

        if (tokens.length === 0) {
          console.log(`[CRON] No device tokens for customer ${note.customer_id} → keep pending`);
          continue; // Do not mark as failed. It may be delivered later.
        }

        // Send push notification
        await NotificationService.sendNotification(
          note.customer_id,
          note.title,
          note.body,
          note.metadata
        );

        // Mark as sent
        await note.update({ status: "sent" });

        console.log(`[CRON] Sent notification → id: ${note.id}`);

      } catch (singleErr) {
        console.error("[CRON] Error sending one notification:", singleErr);
      }
    }

  } catch (err) {
    console.error("[CRON] Pending notification CRON error:", err);
  }
});


console.log('process.env.PORT : ', process.env.PORT);
const port = process.env.PORT || 8000;
// const port = 8000;

const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });
// socket(io);

server.listen(port, () => {
  console.log(`Server is now running on http://localhost:${port}`);
  console.log(`Websocket is now running on ws://localhost:${port} `);
});

export default app;
