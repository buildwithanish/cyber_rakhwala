import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  CheckCircle,
  Copy,
  FileQuestion,
  HelpCircle,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Shield,
  Sparkles,
  Trash2,
  User,
  X,
  Zap
} from 'lucide-react';
import publicService from '../../services/publicService';

const QUICK_ACTIONS = [
  { id: 'help', label: 'How to use tools?', icon: HelpCircle },
  { id: 'credits', label: 'About credits', icon: Zap },
  { id: 'security', label: 'Security tips', icon: Shield },
  { id: 'faq', label: 'FAQs', icon: FileQuestion }
];

const CHAT_STORAGE_KEY = 'cyberRakhwala_chatbotConversation';

const toMessageViewModel = (message, fallbackId) => ({
  id: message.id || `${message.role || 'message'}-${fallbackId}`,
  role: message.role === 'assistant' ? 'assistant' : 'user',
  content: message.content || '',
  timestamp: message.createdAt ? new Date(message.createdAt) : new Date(),
  suggestions: message.suggestions || []
});

const buildSuggestions = (input) => {
  const normalized = input.toLowerCase();

  if (normalized.includes('credit') || normalized.includes('recharge')) {
    return ['How do I recharge credits?', 'Which plans are available?'];
  }

  if (normalized.includes('tool') || normalized.includes('investigation')) {
    return ['Open the tools dashboard', 'How do I save results to a case?'];
  }

  return ['How do credits work?', 'How do I create a case?'];
};

const ChatbotBubble = ({ userName = 'User', position = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello${userName ? `, ${userName}` : ''}! I'm your Cyber Rakhwala assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const positionClasses = position === 'left' ? 'bottom-6 left-6' : 'bottom-6 right-6';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const storedConversationId = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!storedConversationId) {
      return;
    }

    let mounted = true;

    publicService
      .getChatHistory(storedConversationId)
      .then((conversation) => {
        if (!mounted || !conversation?.messages?.length) {
          return;
        }

        setConversationId(conversation._id || storedConversationId);
        setMessages((current) => [
          current[0],
          ...conversation.messages.map((message, index) => toMessageViewModel(message, index))
        ]);
      })
      .catch(() => {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim() || isTyping) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages((current) => [...current, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await publicService.sendChatMessage({
        message: messageText.trim(),
        conversationId
      });
      const nextConversationId = response?.conversationId || conversationId;

      if (nextConversationId) {
        setConversationId(nextConversationId);
        localStorage.setItem(CHAT_STORAGE_KEY, nextConversationId);
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response?.reply || 'I could not generate a response for that request.',
          timestamp: new Date(),
          suggestions: buildSuggestions(messageText.trim())
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: error.message || 'Sorry, I encountered an error. Please try again later.',
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    const queries = {
      help: 'How do I use the investigation tools?',
      credits: 'How do credits work?',
      security: 'What are the security best practices?',
      faq: 'Help me get started'
    };

    handleSendMessage(queries[action.id] || action.label);
  };

  const handleClearChat = async () => {
    if (conversationId) {
      try {
        await publicService.clearChatHistory(conversationId);
      } catch (error) {
        console.error('[ChatbotBubble] Failed to clear conversation:', error);
      }
    }

    localStorage.removeItem(CHAT_STORAGE_KEY);
    setConversationId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hello${userName ? `, ${userName}` : ''}! How can I help you today?`,
        timestamp: new Date()
      }
    ]);
  };

  const handleCopyMessage = async (messageId, content) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 transition-transform hover:scale-110 ${isOpen ? 'hidden' : ''}`}
        title="Chat with Assistant"
      >
        <Bot className="h-7 w-7 text-white" />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0a1520] bg-green-400" />
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed ${positionClasses} z-[100] flex w-[380px] flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#0a1520] shadow-2xl shadow-cyan-500/20`}
          >
            <div className="flex-shrink-0 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="rounded-xl bg-cyan-500/20 p-2">
                      <Bot className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a1520] bg-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Rakhwala Assistant</h3>
                    <p className="text-[10px] text-cyan-400">Always here to help</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClearChat}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    title="Clear chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsMinimized((current) => !current)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    title={isMinimized ? 'Expand' : 'Minimize'}
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized ? (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                          message.role === 'user'
                            ? 'bg-violet-500/20'
                            : message.isError
                              ? 'bg-red-500/20'
                              : 'bg-cyan-500/20'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-violet-400" />
                        ) : (
                          <Bot className={`h-4 w-4 ${message.isError ? 'text-red-400' : 'text-cyan-400'}`} />
                        )}
                      </div>

                      <div className={`group max-w-[75%] ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div
                          className={`rounded-xl px-3 py-2 text-sm ${
                            message.role === 'user'
                              ? 'rounded-tr-none bg-violet-500/20 text-white'
                              : message.isError
                                ? 'rounded-tl-none bg-red-500/10 text-red-300'
                                : 'rounded-tl-none bg-white/5 text-gray-200'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>

                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 opacity-0 transition-opacity hover:text-gray-300 group-hover:opacity-100"
                        >
                          {copiedId === message.id ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              <span className="text-green-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {message.suggestions?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {message.suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => handleSendMessage(suggestion)}
                                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-400 transition-colors hover:bg-cyan-500/20"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}

                  {isTyping ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
                        <Bot className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="rounded-xl rounded-tl-none bg-white/5 px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>

                {messages.length <= 1 ? (
                  <div className="px-4 pb-2">
                    <p className="mb-2 text-[10px] text-gray-500">Quick actions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-300 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                        >
                          <action.icon className="h-3 w-3" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex-shrink-0 border-t border-cyan-500/20 bg-[#040810]/50 p-3">
                  <div className="flex items-end gap-2">
                    <div className="relative flex-1">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-12 text-sm text-white outline-none transition-all placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isTyping}
                        className="absolute bottom-2 right-2 rounded-lg bg-cyan-500/20 p-2 text-cyan-400 transition-all hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[9px] text-gray-500">
                    <Sparkles className="mr-1 inline h-3 w-3" />
                    AI-powered assistant | Press Enter to send
                  </p>
                </div>
              </>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default ChatbotBubble;
