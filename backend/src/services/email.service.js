import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter;
const EMAIL_SEND_TIMEOUT_MS = 8000;

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

  const mailPromise = instance.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.user || env.smtp.fromAddress}>`,
    to,
    subject,
    html,
    text
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Email send timed out')), EMAIL_SEND_TIMEOUT_MS);
  });

  let info;
  try {
    info = await Promise.race([mailPromise, timeoutPromise]);
  } catch (error) {
    logger.warn({ to, subject, error: error.message }, 'Email send failed');
    return {
      queued: false,
      skipped: true,
      error: error.message
    };
  }

  return {
    queued: true,
    messageId: info.messageId
  };
};

export const sendVerificationEmail = async ({ user, token, code, urlBase }) =>
  sendEmail({
    to: user.email,
    subject: 'Action required: verify your Cyber Rakhwala account',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b1220;color:#e5eef9;padding:24px;border-radius:16px">
        <h2 style="margin:0 0 12px 0;color:#ffffff">Welcome to Cyber Rakhwala</h2>
        <p style="line-height:1.6">Hello ${user.name}, your account request has been created successfully. Please verify your email address to continue the approval workflow.</p>
        ${code ? `<p style="line-height:1.6">Your 6-digit verification code is:</p><div style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#22d3ee;margin:18px 0">${code}</div>` : ''}
        <p style="line-height:1.6">Verification link:</p>
        <p><a href="${urlBase}/verify-email?token=${token}" style="color:#22d3ee">Verify my email</a></p>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px">If you did not create this request, you can safely ignore this message.</p>
      </div>
    `,
    text: `Hello ${user.name}, your account request has been created successfully. ${code ? `Your verification code is ${code}. ` : ''}Verify your email here: ${urlBase}/verify-email?token=${token}`
  });

export const sendPasswordResetEmail = async ({ user, token, urlBase }) =>
  sendEmail({
    to: user.email,
    subject: 'Cyber Rakhwala password reset request',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b1220;color:#e5eef9;padding:24px;border-radius:16px">
        <h2 style="margin:0 0 12px 0;color:#ffffff">Password reset request</h2>
        <p style="line-height:1.6">Hello ${user.name}, we received a request to reset your password.</p>
        <p><a href="${urlBase}/reset-password?token=${token}" style="color:#22d3ee">Reset password</a></p>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px">This link expires automatically for your security.</p>
      </div>
    `,
    text: `Hello ${user.name}, reset your password here: ${urlBase}/reset-password?token=${token}`
  });

export const sendOtpEmail = async ({ email, code, purpose }) =>
  sendEmail({
    to: email,
    subject: `Cyber Rakhwala verification code for ${purpose}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b1220;color:#e5eef9;padding:24px;border-radius:16px">
        <h2 style="margin:0 0 12px 0;color:#ffffff">Your one-time verification code</h2>
        <p style="line-height:1.6">Use the code below to continue your ${purpose} flow.</p>
        <div style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#22d3ee;margin:18px 0">${code}</div>
        <p style="color:#94a3b8;font-size:12px">This code expires in 10 minutes and can be used only once.</p>
      </div>
    `,
    text: `Your Cyber Rakhwala verification code for ${purpose} is ${code}. It expires in 10 minutes.`
  });

export const sendApprovalEmail = async ({ user, approved, notes = '', urlBase }) =>
  sendEmail({
    to: user.email,
    subject: approved
      ? 'Your Cyber Rakhwala account has been approved'
      : 'Your Cyber Rakhwala account review result',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b1220;color:#e5eef9;padding:24px;border-radius:16px">
        <h2 style="margin:0 0 12px 0;color:#ffffff">${approved ? 'Account approved' : 'Account review completed'}</h2>
        <p style="line-height:1.6">Hello ${user.name}, your Cyber Rakhwala account has been ${approved ? 'approved' : 'reviewed'} by the support team.</p>
        ${notes ? `<p style="line-height:1.6">Reviewer note: ${notes}</p>` : ''}
        ${approved ? `<p><a href="${urlBase}/login" style="color:#22d3ee">Sign in to your workspace</a></p>` : '<p style="color:#fca5a5">If you believe this was a mistake, please contact support.</p>'}
      </div>
    `,
    text: `Hello ${user.name}, your Cyber Rakhwala account has been ${approved ? 'approved' : 'reviewed'}. ${notes ? `Note: ${notes}` : ''}`
  });

export const sendSupportTicketEmail = async ({ to, title, name, body }) =>
  sendEmail({
    to,
    subject: `Cyber Rakhwala support request: ${title}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b1220;color:#e5eef9;padding:24px;border-radius:16px">
        <h2 style="margin:0 0 12px 0;color:#ffffff">${title}</h2>
        <p style="line-height:1.6">Submitted by <strong>${name}</strong></p>
        <p style="white-space:pre-line;line-height:1.6">${body}</p>
      </div>
    `,
    text: `${title}\nSubmitted by ${name}\n\n${body}`
  });

export const sendContactAcknowledgementEmail = async ({ to, name, title }) =>
  sendEmail({
    to,
    subject: 'Cyber Rakhwala support request received',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b1220;color:#e5eef9;padding:24px;border-radius:16px">
        <h2 style="margin:0 0 12px 0;color:#ffffff">We received your message</h2>
        <p style="line-height:1.6">Hello ${name}, our support team has received your ${title} request and will review it shortly.</p>
        <p style="line-height:1.6">For urgent matters, please reply to this email with any additional context you want us to review.</p>
      </div>
    `,
    text: `Hello ${name}, our support team has received your ${title} request and will review it shortly.`
  });
