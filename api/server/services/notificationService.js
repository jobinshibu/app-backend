import admin from '../config/firebase-config.js';
import db from '../models/index.js';

class NotificationService {
    /**
     * FCM requires every data value to be a string.
     * Convert anything we send in the data payload accordingly.
     */
    static sanitizeFcmData(data = {}) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (value === null || value === undefined) continue;
            sanitized[key] = String(value);
        }
        return sanitized;
    }

    static async sendNotification(customerId, title, body, data = {}) {
        try {
            const customer = await db.Customer.findByPk(customerId);
            if (!customer) {
                throw new Error('Customer not found');
            }

            // Convert to array (multi-device support)
            let tokens = Array.isArray(customer.device_token)
                ? customer.device_token
                : customer.device_token
                ? [customer.device_token]
                : [];

            if (tokens.length === 0) {
                throw new Error('No device tokens found');
            }

            const sanitizedData = this.sanitizeFcmData({
                customerId: String(customerId),
                ...data
            });

            // FCM payload with sane defaults for Android/iOS
            const payload = {
                notification: { title, body },
                data: sanitizedData,
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'default',
                        sound: 'default',
                        priority: 'high',
                        visibility: 'public'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                            contentAvailable: true
                        }
                    }
                },
                tokens, // MULTICAST
            };

            console.log(`[NotificationService] Sending test notification → tokens: ${tokens.length}`);
            console.log(`[NotificationService] Payload data:`, sanitizedData);

            // Send to multiple tokens
            const response = await admin.messaging().sendEachForMulticast(payload);

            console.log(
                `[NotificationService] Sent at ${new Date().toISOString()} | Success: ${response.successCount}, Failed: ${response.failureCount}`
            );

            // Remove invalid tokens
            const failedTokens = [];
            response.responses.forEach((res, index) => {
                if (!res.success) {
                    const errorCode = res.error.code;
                    console.log("FCM Error:", res.error.code, res.error.message);

                    if (
                        errorCode === "messaging/invalid-registration-token" ||
                        errorCode === "messaging/registration-token-not-registered"
                    ) {
                        failedTokens.push(tokens[index]);
                    }
                }
            });


            if (failedTokens.length > 0) {
                console.log('Removing invalid tokens:', failedTokens);

                tokens = tokens.filter(t => !failedTokens.includes(t));

                await db.Customer.update(
                    { device_token: tokens },
                    { where: { id: customerId } }
                );
            }

            // Log notification
            // await db.Notification.create({
            //     customer_id: customerId,
            //     title,
            //     body,
            //     status: 'sent',
            //     sentAt: new Date(),
            // });

            return {
                success: true,
                successCount: response.successCount,
                failCount: response.failureCount,
            };
        } catch (error) {
            console.error('[NotificationService] Error:', error);

            // await db.Notification.create({
            //     customer_id: customerId,
            //     title,
            //     body,
            //     status: 'pending',
            // });

            throw error;
        }
    }
}

export default NotificationService;
