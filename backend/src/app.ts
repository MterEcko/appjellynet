import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { logger } from './utils/logger.util';

const app: Application = express();

// Security middleware - Configure helmet to allow video loading
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with CORS headers
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('public/uploads'));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
