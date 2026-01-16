import functions from 'firebase-functions';
import express from 'express';
import admin from '../api/server/config/firebase-config.js';
import notificationRoutes from '../api/server/routes/notificationRoutes.js';
import NotificationService from '../api/server/services/notificationService.js';

// Minimal Express app for Cloud Functions HTTP endpoint
const app = express();
app.use(express.json());
app.use('/api', notificationRoutes);

export const api = functions.https.onRequest(app);

// Example Firestore trigger → adjust collection and payload to your schema
export const notifyOnNewMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const newMessage = snap.data();
    const customerId = newMessage?.customerId;
    if (!customerId) {
      console.error('Missing customerId on new message');
      return null;
    }

    try {
      await NotificationService.sendNotification(
        customerId,
        'New Message',
        newMessage?.content || 'You have a new message',
        { sender: newMessage?.sender || '' }
      );
    } catch (error) {
      console.error('Firestore trigger error:', error);
    }
    return null;
  });


