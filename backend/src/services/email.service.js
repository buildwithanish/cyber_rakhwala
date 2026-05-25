import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!env.smtp.host) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user
      ? {
          user: env.smtp.user,
          pass: env.smtp.pass
        }
      : undefined
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const instance = getTransporter();

  if (!instance) {
    logger.warn({ to, subject }, 'SMTP not configured; email not sent');
    return {
      queued: false,
      skipped: true
    };
  }

  const info = await instance.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.fromAddress}>`,
    to,
    subject,
    html,
    text
  });

  return {
    queued: true,
    messageId: info.messageId
  };
};

export const sendVerificationEmail = async ({ user, token, urlBase }) =>
  sendEmail({
    to: user.email,
    subject: 'Verify your Cyber Rakhwala account',
    html: `<p>Hello ${user.name},</p><p>Verify your email by opening <a href="${urlBase}/verify-email?token=${token}">this link</a>.</p>`,
    text: `Hello ${user.name}, verify your email: ${urlBase}/verify-email?token=${token}`
  });

export const sendPasswordResetEmail = async ({ user, token, urlBase }) =>
  sendEmail({
    to: user.email,
    subject: 'Reset your Cyber Rakhwala password',
    html: `<p>Hello ${user.name},</p><p>Reset your password by opening <a href="${urlBase}/reset-password?token=${token}">this link</a>.</p>`,
    text: `Hello ${user.name}, reset your password: ${urlBase}/reset-password?token=${token}`
  });

export const sendOtpEmail = async ({ email, code, purpose }) =>
  sendEmail({
    to: email,
    subject: `Your Cyber Rakhwala ${purpose} OTP`,
    html: `<p>Your OTP is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    text: `Your OTP is ${code}. It expires in 10 minutes.`
  });
