import { StatusCodes } from 'http-status-codes';
import { ProviderConfig } from '../models/ProviderConfig.js';
import { Conversation } from '../models/Conversation.js';
import { ApiError } from '../utils/ApiError.js';
import { executeProviderSearch } from './provider.service.js';

export const sendChatbotMessage = async ({ user, conversationId, message }) => {
  const provider = await ProviderConfig.findOne({
    type: 'chatbot',
    enabled: true
  }).lean();

  if (!provider) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Chatbot provider is not configured', {
      code: 'CHATBOT_NOT_CONFIGURED'
    });
  }

  const conversation =
    (conversationId
      ? await Conversation.findOne({
          _id: conversationId,
          user: user?._id ?? undefined
        })
      : null) ||
    (await Conversation.create({
      user: user?._id,
      sessionKey: user?._id ? '' : `guest-${Date.now()}`,
      messages: []
    }));

  conversation.messages.push({
    role: 'user',
    content: message
  });

  const providerResponse = await executeProviderSearch({
    provider,
    toolId: 'chatbot',
    action: 'message',
    query: message,
    payload: {
      conversation: conversation.messages.map((item) => ({
        role: item.role,
        content: item.content
      }))
    }
  });

  const reply =
    providerResponse.data?.reply ??
    providerResponse.data?.message ??
    providerResponse.data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, 'Chatbot provider returned an empty response');
  }

  conversation.messages.push({
    role: 'assistant',
    content: reply
  });

  await conversation.save();

  return {
    conversation,
    reply
  };
};
