import 'dotenv/config';
import Sequelize from 'sequelize';

const dbConfig = {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DIALECT || 'mysql',
    logging: console.log,
};

console.log('Testing connection with:', {
    ...dbConfig,
    password: '****'
});

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
);

async function test() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        // Try a simple query
        const [results] = await sequelize.query('SELECT 1+1 AS result');
        console.log('✅ Query successful:', results);

        process.exit(0);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        if (error.original) {
            console.error('Original Error:', error.original);
        }
        process.exit(1);
    }
}

test();
