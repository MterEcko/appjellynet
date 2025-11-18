import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { logger } from './utils/logger.util';

const app: Application = express();

// Security middleware
app.use(helmet());

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

// Serve static files
app.use('/uploads', express.static('public/uploads'));

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
