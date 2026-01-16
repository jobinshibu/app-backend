'use strict';

import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import process from 'process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url); // construct the require method
import { createRequire } from 'module';

const config = require('../config/config.json');
const __filename = fileURLToPath(import.meta.url);
const basename = path.basename(__filename);
const __dirname = dirname(__filename);
const env = process.env.NODE_ENV || 'development';
let envConfig = config[env];

const db = {};

let sequelize;
if (process.env.DB_NAME) {
  console.log('Using environment variables for DB connection');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS || process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DIALECT || 'mysql',
      logging: false,
    }
  );
} else if (envConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[envConfig.use_env_variable], envConfig);
} else {
  sequelize = new Sequelize(
    envConfig.database,
    envConfig.username,
    envConfig.password,
    envConfig
  );
}

sequelize.authenticate()
  .then(() => console.log('✅ DB connected'))
  .catch(err => console.error('❌ DB connection failed:', err));

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-4) === '.cjs'
    );
  })
  .forEach(async (file) => {
    const require = createRequire(import.meta.url); // construct the require method
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// ... existing code ...

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Sync database tables in development mode
// if (process.env.NODE_ENV === 'development') {
//   sequelize.sync({ alter: true })
//     .then(() => {
//       console.log('✅ Database tables synchronized');
//     })
//     .catch(err => {
//       console.error('❌ Database sync failed:', err);
//     });
// }

export default db;
