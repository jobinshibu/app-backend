import 'dotenv/config';
import db from './api/server/models/index.js';

async function sync() {
    try {
        console.log('Starting database synchronization from app-backend...');
        console.log('Environment:', process.env.NODE_ENV);

        // Wait for DB authentication (already initiated in models/index.js)
        await db.sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Disable foreign key checks to avoid ordering issues during sync
        console.log('Disabling foreign key checks...');
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Using alter: true to update existing tables without dropping them
        // and create missing ones.
        console.log('Syncing models with alter: true...');
        await db.sequelize.sync({ alter: true });

        // Re-enable foreign key checks
        console.log('Re-enabling foreign key checks...');
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Database synchronization completed successfully.');
        process.exit(0);
    } catch (error) {
        // Attempt to re-enable foreign key checks if something goes wrong
        try {
            await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            // ignore
        }

        console.error('❌ An error occurred during database synchronization:');
        if (error.sql) console.error('SQL:', error.sql);
        console.error(error);
        process.exit(1);
    }
}

sync();
