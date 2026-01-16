import NotificationService from '../services/notificationService.js';
import db from '../models/index.js';

class NotificationController {
    static async sendTestNotification(req, res) {
        const { title, body } = req.body;
        const customerId = req.body.customerId ?? req.body.customer_id;
        if (!customerId || !title || !body) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        try {
            const result = await NotificationService.sendNotification(customerId, title, body, { type: 'test' });
            res.status(200).json({
                message: 'Notification sent successfully',
                timestamp: new Date().toISOString(),
                result: {
                    success: result.success,
                    successCount: result.successCount,
                    failCount: result.failCount
                }
            });
        } catch (error) {
            console.error('[NotificationController] Test notification error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async checkCustomerTokens(req, res) {
        const customerId = req.params.customerId ?? req.query.customerId;
        if (!customerId) {
            return res.status(400).json({ error: 'Missing customerId parameter' });
        }

        try {
            const customer = await db.Customer.findByPk(customerId);
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            const deviceTokens = Array.isArray(customer.device_token)
                ? customer.device_token
                : customer.device_token
                    ? [customer.device_token]
                    : [];

            return res.status(200).json({
                customerId: customer.id,
                hasTokens: deviceTokens.length > 0,
                tokenCount: deviceTokens.length,
                tokens: deviceTokens.map(token => ({
                    length: token?.length || 0,
                    preview: token ? token.substring(0, 20) + '...' : 'null',
                    isValid: token && token.length > 0
                }))
            });
        } catch (error) {
            console.error('[NotificationController] Check tokens error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    static async saveFcmToken(req, res) {
        const device_token = req.body.device_token;
        const customerId = req.body.customerId ?? req.body.customer_id;
        if (!customerId || !device_token) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        let transaction;
        try {
            transaction = await db.sequelize.transaction();

            const customer = await db.Customer.findByPk(customerId, { transaction });
            if (!customer) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Customer not found' });
            }

            console.log(`[saveFcmToken] Customer ID: ${customerId}, Input token: ${device_token}, Current device_token:`, JSON.stringify(customer.device_token));

            let deviceTokens = Array.isArray(customer.device_token)
                ? [...customer.device_token]
                : typeof customer.device_token === 'string'
                    ? [customer.device_token]
                    : [];

            if (deviceTokens.includes(device_token)) {
                console.log(`[saveFcmToken] Token ${device_token} already exists, skipping`);
                await transaction.commit();
                return res.status(200).json({
                    message: 'Token already exists, skipped saving',
                    timestamp: new Date().toISOString(),
                    deviceTokens
                });
            }

            deviceTokens.push(device_token);
            customer.device_token = deviceTokens;

            await customer.save({ transaction });

            console.log(`[saveFcmToken] Saved device_token:`, JSON.stringify(customer.device_token));

            await transaction.commit();

            return res.status(200).json({
                message: 'Token saved successfully',
                timestamp: new Date().toISOString(),
                deviceTokens: customer.device_token
            });
        } catch (error) {
            console.error('[saveFcmToken] Error:', error);
            if (transaction) {
                await transaction.rollback();
            }
            return res.status(500).json({ error: error.message });
        }
    }

    static async markAsRead(req, res) {
        try {
            const { id } = req.params;

            const notif = await db.Notification.findByPk(id);
            if (!notif) {
            return res.status(404).json({ message: "Notification not found" });
            }

            await notif.update({
            isRead: true,
            });

            return res.status(200).json({
            message: "Notification marked as read",
            id,
            isRead: true
            });

        } catch (error) {
            console.error("markAsRead error:", error);
            return res.status(500).json({ message: "Failed to update notification" });
        }
        }

    static async getNotificationsByCustomerId(req, res) {
        const customerId = req.params.customerId ?? req.query.customerId;

        if (!customerId) {
            return res.status(400).json({ error: 'Missing customerId' });
        }

        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);
            const offset = (page - 1) * limit;

            // *** NEW *** Fetch notifications
            const { rows: notifications, count: total } = await db.Notification.findAndCountAll({
                where: { customer_id: customerId },
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            // *** NEW *** Count unread notifications
            const unreadCount = await db.Notification.count({
                where: { customer_id: customerId, isRead: false }
            });

            return res.status(200).json({
                customerId,
                total,
                unreadCount,
                page,
                limit,
                notifications
            });

        } catch (error) {
            console.error('[NotificationController] getNotifications error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    static async saveOrUpdatePreferences(req, res) {
    try {
        const customerId = req.body.customerId ?? req.body.customer_id;
        if (!customerId) {
            return res.status(400).json({ error: "customer_id is required" });
        }

        // Copy request body safely
        let updates = { ...req.body };
        delete updates.customerId;
        delete updates.customer_id;

        // -------------------------
        // HANDLE "ENABLE ALL"
        // -------------------------
        if ("enable_all" in updates) {
            const enableAll = updates.enable_all === true;
            delete updates.enable_all;

            // Build all-true/all-false object
            const allValues = {};
            const fields = Object.keys(db.NotificationPreference.rawAttributes)
                .filter(f => !["id", "customer_id", "created_at", "updated_at", "deleted_at"].includes(f));

            fields.forEach(field => {
                allValues[field] = enableAll; // true or false
            });

            updates = allValues;
        }

        // -------------------------
        // UPSERT PREFERENCES
        // -------------------------
        let pref = await db.NotificationPreference.findOne({
            where: { customer_id: customerId }
        });

        if (!pref) {
            pref = await db.NotificationPreference.create({
                customer_id: customerId,
                ...updates
            });
        } else {
            await pref.update(updates);
        }

        // Fetch full fresh record
        const finalPref = await db.NotificationPreference.findOne({
            where: { customer_id: customerId }
        });

        // -------------------------
        // CALCULATE ENABLE ALL IN RESPONSE
        // -------------------------
        const values = finalPref.get({ plain: true });

        const fields = Object.keys(values)
                .filter(f => !["id", "customer_id", "created_at", "updated_at", "deleted_at"].includes(f));

        const enable_all = fields.every(f => values[f] === true);

        return res.status(200).json({
            message: "Preferences updated successfully",
            enable_all,
            preferences: values
        });

    } catch (error) {
        console.error("saveOrUpdatePreferences error:", error);
        return res.status(500).json({ error: error.message });
    }
    }


    static async getPreferences(req, res) {
        try {
            const customerId = req.params.customerId ?? req.query.customerId;

            if (!customerId) {
                return res.status(400).json({ error: "Missing customerId" });
            }

            let pref = await db.NotificationPreference.findOne({
                where: { customer_id: customerId }
            });

            // If not found → create default
            if (!pref) {
                pref = await db.NotificationPreference.create({ customer_id: customerId });
            }

            const json = pref.toJSON();

            // AUTO-CALCULATE enable_all
            const fields = Object.keys(json).filter(
                k => !["id", "customer_id", "created_at", "updated_at", "deleted_at"].includes(k)
            );

            const allEnabled = fields.every(k => json[k] === true);

            return res.status(200).json({
                customer_id: customerId,
                enable_all: allEnabled,
                preferences: json
            });

        } catch (error) {
            console.error("getPreferences error:", error);
            return res.status(500).json({ error: error.message });
        }
    }


}

export default NotificationController;