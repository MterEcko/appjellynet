import nodemailer, { Transporter } from 'nodemailer';
import env from '../config/env';
import { logger } from '../utils/logger.util';
import path from 'path';
import fs from 'fs/promises';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface WelcomeEmailData {
  name: string;
  email: string;
  temporaryPassword?: string;
  loginUrl: string;
}

interface PasswordResetEmailData {
  name: string;
  resetToken: string;
  resetUrl: string;
  expiresIn: string;
}

interface AccountSuspendedEmailData {
  name: string;
  reason: string;
  contactEmail: string;
}

interface DemoExpiringEmailData {
  name: string;
  expiresAt: Date;
  upgradeUrl: string;
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  /**
   * Send email
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
    } catch (error: any) {
      logger.error(`Error sending email to ${options.to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load email template
   */
  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      logger.warn(`Template ${templateName} not found, using fallback`);
      return '';
    }
  }

  /**
   * Replace template variables
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void> {
    logger.info(`Sending welcome email to ${to}`);

    const template = await this.loadTemplate('welcome');
    const html = template
      ? this.replaceVariables(template, {
          name: data.name,
          email: data.email,
          temporaryPassword: data.temporaryPassword || 'N/A',
          loginUrl: data.loginUrl,
          year: new Date().getFullYear().toString(),
        })
      : this.getDefaultWelcomeEmail(data);

    await this.sendEmail({
      to,
      subject: '¡Bienvenido a QbitStream!',
      html,
      text: `Bienvenido a QbitStream, ${data.name}!\n\nTu cuenta ha sido creada exitosamente.\n\nInicia sesión en: ${data.loginUrl}`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, data: PasswordResetEmailData): Promise<void> {
    logger.info(`Sending password reset email to ${to}`);

    const template = await this.loadTemplate('password-reset');
    const html = template
      ? this.replaceVariables(template, {
          name: data.name,
          resetUrl: data.resetUrl,
          expiresIn: data.expiresIn,
          year: new Date().getFullYear().toString(),
        })
      : this.getDefaultPasswordResetEmail(data);

    await this.sendEmail({
      to,
      subject: 'Restablecer tu contraseña de QbitStream',
      html,
      text: `Hola ${data.name},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nHaz clic aquí: ${data.resetUrl}\n\nEste enlace expira en ${data.expiresIn}.`,
    });
  }

  /**
   * Send account suspended email
   */
  async sendAccountSuspendedEmail(to: string, data: AccountSuspendedEmailData): Promise<void> {
    logger.info(`Sending account suspended email to ${to}`);

    const template = await this.loadTemplate('account-suspended');
    const html = template
      ? this.replaceVariables(template, {
          name: data.name,
          reason: data.reason,
          contactEmail: data.contactEmail,
          year: new Date().getFullYear().toString(),
        })
      : this.getDefaultAccountSuspendedEmail(data);

    await this.sendEmail({
      to,
      subject: 'Tu cuenta de QbitStream ha sido suspendida',
      html,
      text: `Hola ${data.name},\n\nTu cuenta ha sido suspendida.\n\nMotivo: ${data.reason}\n\nContacta a ${data.contactEmail} para más información.`,
    });
  }

  /**
   * Send demo expiring email
   */
  async sendDemoExpiringEmail(to: string, data: DemoExpiringEmailData): Promise<void> {
    logger.info(`Sending demo expiring email to ${to}`);

    const daysLeft = Math.ceil(
      (data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const template = await this.loadTemplate('demo-expiring');
    const html = template
      ? this.replaceVariables(template, {
          name: data.name,
          daysLeft: daysLeft.toString(),
          expiresAt: data.expiresAt.toLocaleDateString('es-ES'),
          upgradeUrl: data.upgradeUrl,
          year: new Date().getFullYear().toString(),
        })
      : this.getDefaultDemoExpiringEmail(data, daysLeft);

    await this.sendEmail({
      to,
      subject: `Tu demo de QbitStream expira en ${daysLeft} días`,
      html,
      text: `Hola ${data.name},\n\nTu cuenta demo expira en ${daysLeft} días (${data.expiresAt.toLocaleDateString('es-ES')}).\n\nActualiza tu cuenta: ${data.upgradeUrl}`,
    });
  }

  /**
   * Send account reactivated email
   */
  async sendAccountReactivatedEmail(to: string, name: string, loginUrl: string): Promise<void> {
    logger.info(`Sending account reactivated email to ${to}`);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cuenta Reactivada</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">QbitStream</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>¡Cuenta Reactivada!</h2>
            <p>Hola <strong>${name}</strong>,</p>
            <p>Tu cuenta ha sido reactivada exitosamente. Ya puedes acceder nuevamente a QbitStream.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Iniciar Sesión</a>
            </div>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} QbitStream. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: 'Tu cuenta de QbitStream ha sido reactivada',
      html,
      text: `Hola ${name},\n\nTu cuenta ha sido reactivada exitosamente.\n\nInicia sesión en: ${loginUrl}`,
    });
  }

  /**
   * Default welcome email template
   */
  private getDefaultWelcomeEmail(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido a QbitStream</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">¡Bienvenido a QbitStream!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hola <strong>${data.name}</strong>,</p>
            <p>¡Gracias por unirte a QbitStream! Tu cuenta ha sido creada exitosamente.</p>
            ${
              data.temporaryPassword
                ? `
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Contraseña temporal:</strong> ${data.temporaryPassword}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Por favor, cambia tu contraseña después de iniciar sesión.</p>
            </div>
            `
                : ''
            }
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Iniciar Sesión</a>
            </div>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Disfruta de tu experiencia en QbitStream!</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} QbitStream. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Default password reset email template
   */
  private getDefaultPasswordResetEmail(data: PasswordResetEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restablecer Contraseña</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Restablecer Contraseña</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hola <strong>${data.name}</strong>,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de QbitStream.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer Contraseña</a>
            </div>
            <p><strong>Este enlace expira en ${data.expiresIn}.</strong></p>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} QbitStream. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Default account suspended email template
   */
  private getDefaultAccountSuspendedEmail(data: AccountSuspendedEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cuenta Suspendida</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f44336; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Cuenta Suspendida</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hola <strong>${data.name}</strong>,</p>
            <p>Lamentamos informarte que tu cuenta de QbitStream ha sido suspendida.</p>
            <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Motivo:</strong> ${data.reason}</p>
            </div>
            <p>Si crees que esto es un error o deseas más información, por favor contacta a:</p>
            <p style="text-align: center;"><strong>${data.contactEmail}</strong></p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} QbitStream. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Default demo expiring email template
   */
  private getDefaultDemoExpiringEmail(data: DemoExpiringEmailData, daysLeft: number): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Demo Expirando</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Tu Demo Está Por Expirar</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hola <strong>${data.name}</strong>,</p>
            <p>Tu cuenta demo de QbitStream expira en <strong>${daysLeft} días</strong> (${data.expiresAt.toLocaleDateString('es-ES')}).</p>
            <p>Para continuar disfrutando de QbitStream sin interrupciones, actualiza tu cuenta a un plan completo.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.upgradeUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Actualizar Cuenta</a>
            </div>
            <p>¡No pierdas acceso a todo tu contenido favorito!</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} QbitStream. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Verify email connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
      return true;
    } catch (error: any) {
      logger.error(`Email service connection failed: ${error.message}`);
      return false;
    }
  }
}

export default new EmailService();
