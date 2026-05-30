import axios from 'axios';
import { Conversation } from '../models/Conversation.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { env } from '../config/env.js';
import { createNumberSequence } from '../utils/helpers.js';
import { createActivity } from './activity.service.js';
import { createAuditLog } from './audit.service.js';
import { sendContactAcknowledgementEmail, sendSupportTicketEmail } from './email.service.js';
import { getSettingsByGroup } from './settings.service.js';

export const createSupportEntry = async ({ payload, type, user, req }) => {
  const ticket = await SupportTicket.create({
    ticketNumber: createNumberSequence('TKT', (await SupportTicket.countDocuments()) + 1),
    user: user?._id,
    type,
    subject: payload.subject || `${type} submission`,
    email: payload.email || user?.email,
    page: payload.page || '',
    category: payload.category || type,
    rating: payload.rating,
    messages: [
      {
        senderType: 'user',
        senderName: payload.name || user?.name || 'Anonymous',
        message: payload.message
      }
    ],
    metadata: payload.metadata || {}
  });

  if (user) {
    await Promise.all([
      createActivity({
        user,
        actorName: user.name,
        action: `${type} submitted`,
        type: 'action',
        targetType: 'ticket',
        targetId: String(ticket._id)
      }),
      createAuditLog({
        actor: user,
        actorRole: user.role,
        action: `${type}.create`,
        resourceType: 'SupportTicket',
        resourceId: String(ticket._id),
        req
      })
    ]);
  }

  const supportAddress =
    (await getSettingsByGroup('public', { isPublic: true }))
      ?.support_email || 'support@cyberrakhwala.com';

  await sendSupportTicketEmail({
    to: supportAddress,
    title: `${type.toUpperCase()} request received`,
    name: payload.name || user?.name || 'Anonymous',
    body: payload.message
  });

  if (payload.email) {
    await sendContactAcknowledgementEmail({
      to: payload.email,
      name: payload.name || user?.name || 'Anonymous',
      title: type
    });
  }

  return ticket;
};

export const getConversationHistory = async ({ conversationId, user }) =>
  Conversation.findOne({
    _id: conversationId,
    ...(user ? { user: user._id } : {})
  }).lean();

export const clearConversationHistory = async ({ conversationId, user }) =>
  Conversation.findOneAndDelete({
    _id: conversationId,
    ...(user ? { user: user._id } : {})
  });

export const getHomepageContent = async () => {
  const blocks = await ContentBlock.find({
    isPublished: true
  })
    .sort({ section: 1, createdAt: 1 })
    .lean();

  return blocks.reduce((acc, block) => {
    acc[block.key] = block.body;
    return acc;
  }, {});
};

export const getPublicBootstrap = async () => ({
  settings: await getSettingsByGroup('public', { isPublic: true }),
  homepage: await getHomepageContent()
});

const verifyRecaptcha = async (token) => {
  if (!env.captcha.recaptchaSecret) {
    return { success: false, skipped: true };
  }

  const body = new URLSearchParams({
    secret: env.captcha.recaptchaSecret,
    response: token
  });

  const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
};

const verifyTurnstile = async (token) => {
  if (!env.captcha.turnstileSecret) {
    return { success: false, skipped: true };
  }

  const body = new URLSearchParams({
    secret: env.captcha.turnstileSecret,
    response: token
  });

  const response = await axios.post(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    body.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data;
};

export const verifyCaptchaToken = async ({ token, provider = 'turnstile' }) => {
  if (provider === 'turnstile') {
    return verifyTurnstile(token);
  }
  return verifyRecaptcha(token);
};
