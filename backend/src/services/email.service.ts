import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.util';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      };

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('SMTP credentials not configured. Emails will not be sent.');
        return;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.warn(`Email not sent (no transporter): ${options.subject}`);
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"StreamQbit" <noreply@streamqbit.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendAccountSuspendedEmail(email: string, reason: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Tu cuenta ha sido suspendida',
      html: `<h1>Cuenta Suspendida</h1><p>Razón: ${reason}</p>`,
      text: `Tu cuenta ha sido suspendida. Razón: ${reason}`,
    });
  }

  async sendPasswordChangedEmail(email: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Tu contraseña ha sido cambiada',
      html: '<h1>Contraseña Actualizada</h1><p>Tu contraseña ha sido cambiada.</p>',
    });
  }

  async sendEmailChangedNotification(oldEmail: string, newEmail: string): Promise<boolean> {
    await this.sendEmail({
      to: oldEmail,
      subject: 'Tu email ha sido cambiado',
      html: `<h1>Email Actualizado</h1><p>Nuevo email: ${newEmail}</p>`,
    });

    return this.sendEmail({
      to: newEmail,
      subject: 'Email confirmado',
      html: '<h1>Email Confirmado</h1><p>Email confirmado correctamente.</p>',
    });
  }
}

export default new EmailService();
