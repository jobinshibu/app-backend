import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import pg from 'pg';
import path from 'path';
console.log('process.env.SECRET_KEY : ', process.env.SECRET_KEY);
const env = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.SECRET_KEY;
const passwordKey = '454456'
const configPath = path.resolve('api/server/config', 'config.json');
const configs = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const dbConfig = configs[env];


console.log('DB Config:', dbConfig);
// let poolConfig = {
//   database: dbConfig.database,
//   user: dbConfig.username,
//   password: dbConfig.password,
//   host: dbConfig.host,
//   port: dbConfig.port,
//   dialect: dbConfig.dialect
// };
let poolConfig = {
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DIALECT
};
console.log(' process.env.NODE_ENV : ', process.env.NODE_ENV);


console.log('poolConfig : ', poolConfig);
const pool = new pg.Pool(poolConfig);

async function query(query, params) {
  console.log(query);
  const { rows } = await pool.query(query, params);

  return rows;
}

export default {
  query,
  poolConfig,
  jwtSecret,
  passwordKey
};
