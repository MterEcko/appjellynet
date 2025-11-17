import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Env {
  // Server
  NODE_ENV: string;
  PORT: number;

  // Database
  DATABASE_URL: string;

  // Redis
  REDIS_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // CORS
  CORS_ORIGIN: string;

  // Email
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // MercadoPago
  MERCADOPAGO_ACCESS_TOKEN?: string;
  MERCADOPAGO_PUBLIC_KEY?: string;

  // Jellyfin
  JELLYFIN_SERVER_LOCAL: string;
  JELLYFIN_SERVER_WISP: string;
  JELLYFIN_SERVER_ISP: string;
  JELLYFIN_SERVER_PUBLIC: string;
  JELLYFIN_API_KEY: string;

  // Cloudflare
  CLOUDFLARE_TUNNEL_TOKEN?: string;
}

const env: Env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'StreamQbit <noreply@serviciosqbit.net>',

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_PUBLIC_KEY: process.env.MERCADOPAGO_PUBLIC_KEY,

  JELLYFIN_SERVER_LOCAL: process.env.JELLYFIN_SERVER_LOCAL || 'http://10.10.0.111:8096',
  JELLYFIN_SERVER_WISP: process.env.JELLYFIN_SERVER_WISP || 'http://172.16.8.23:8096',
  JELLYFIN_SERVER_ISP: process.env.JELLYFIN_SERVER_ISP || 'http://100.10.0.15:8096',
  JELLYFIN_SERVER_PUBLIC: process.env.JELLYFIN_SERVER_PUBLIC || 'https://stream.serviciosqbit.net',
  JELLYFIN_API_KEY: process.env.JELLYFIN_API_KEY || '',

  CLOUDFLARE_TUNNEL_TOKEN: process.env.CLOUDFLARE_TUNNEL_TOKEN,
};

export default env;
