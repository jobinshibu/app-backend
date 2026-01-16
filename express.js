import express from 'express';
import cors from 'cors';
import compression from 'compression';
import bodyParser from 'body-parser';
import allRoutes from './api/server/routes/index.js';
import PaymentController from './api/server/controllers/PaymentController.js';
// import { Server } from 'socket.io';

export default async () => {
  const app = express();

  app.post(
    '/api/v1/user/webhook',
    express.raw({ type: 'application/json' }),
    PaymentController.stripeWebhook
  );

  app.use(express.json());
  app.use(cors());
  app.use(compression({ level: 6 }));
  app.use(express.static("upload"));

  app.use(bodyParser.urlencoded({ extended: false, limit: '512mb' }));
  app.use(bodyParser.text({ limit: '512mb' }));
  app.use(bodyParser.json({ limit: '512mb' }));

  // Ensure JSON UTF-8 responses
  app.use((req, res, next) => {
    res.set('Content-Type', 'application/json; charset=utf-8');
    next();
  });

  
  async function setupRoutes() {
  
    await allRoutes(app);
  }
  await setupRoutes();

  // Global JSON error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ data: {}, message: 'Something went wrong.', status: 500 });
  });
  return app;
};
