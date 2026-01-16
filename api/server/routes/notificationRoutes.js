import express from 'express';
import NotificationController from '../controllers/NotificationController.js';

const router = express.Router();

router.post('/notifications/test', NotificationController.sendTestNotification);
router.post('/notifications/token', NotificationController.saveFcmToken);
router.get('/notifications/check-tokens/:customerId', NotificationController.checkCustomerTokens);
router.get('/notifications/check-tokens', NotificationController.checkCustomerTokens);

router.put("/notifications/:id/read", NotificationController.markAsRead);

router.get('/notifications/customer/:customerId', NotificationController.getNotificationsByCustomerId);

router.post("/preferences", NotificationController.saveOrUpdatePreferences);
router.get("/preferences/:customerId", NotificationController.getPreferences);

export default router;