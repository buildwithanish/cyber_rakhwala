import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, MessageSquarePlus, Send, Star, X } from 'lucide-react';
import publicService from '../../services/publicService';

const FEEDBACK_TYPES = [
  {
    id: 'bug',
    label: 'Bug Report',
    badge: 'BUG',
    activeClass: 'bg-red-500/20 border-red-500/50 ring-2 ring-red-500/30'
  },
  {
    id: 'feature',
    label: 'Feature Request',
    badge: 'NEW',
    activeClass: 'bg-amber-500/20 border-amber-500/50 ring-2 ring-amber-500/30'
  },
  {
    id: 'improvement',
    label: 'Improvement',
    badge: 'UX',
    activeClass: 'bg-cyan-500/20 border-cyan-500/50 ring-2 ring-cyan-500/30'
  },
  {
    id: 'other',
    label: 'Other',
    badge: 'NOTE',
    activeClass: 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30'
  }
];

const FeedbackBubble = ({
  userId,
  userEmail,
  currentPage = window.location.pathname,
  position = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [ticketId, setTicketId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const positionClasses = position === 'left' ? 'bottom-24 left-6' : 'bottom-24 right-6';

  const resetForm = () => {
    setFeedbackType('');
    setRating(0);
    setHoverRating(0);
    setMessage('');
    setSubmitStatus(null);
    setTicketId('');
    setErrorMessage('');
    setValidationMessage('');
  };

  const handleClose = () => {
    setIsOpen(false);
    window.setTimeout(resetForm, 250);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedMessage = message.trim();

    if (!feedbackType || !rating || !normalizedMessage) {
      setValidationMessage('Please choose a type, rating, and feedback message.');
      return;
    }

    if (normalizedMessage.length < 5) {
      setValidationMessage('Feedback message must be at least 5 characters long.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');
    setValidationMessage('');

    try {
      const response = await publicService.submitFeedback({
        type: feedbackType,
        rating,
        message: normalizedMessage,
        email: email.trim() || undefined,
        page: currentPage,
        metadata: {
          page: currentPage,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          userId: userId || 'anonymous',
          screenResolution: `${window.innerWidth}x${window.innerHeight}`
        }
      });

      setTicketId(response?.ticketNumber || '');
      setSubmitStatus('success');
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(
        error?.data?.details?.fieldErrors?.body?.[0] ||
          error.message ||
          'Something went wrong while sending your feedback.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30 transition-transform hover:scale-110 group`}
        title="Send Feedback"
      >
        <MessageSquarePlus className="h-6 w-6 text-white" />
        <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-amber-400" />
        <div
          className={`pointer-events-none absolute ${position === 'left' ? 'left-full ml-3' : 'right-full mr-3'} whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100`}
        >
          Send Feedback
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className={`fixed ${positionClasses} z-[101] max-h-[80vh] w-[380px] overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0a1520] shadow-2xl shadow-purple-500/20`}
            >
              <div className="border-b border-purple-500/20 bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-purple-500/20 p-2">
                      <MessageSquarePlus className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Send Feedback</h3>
                      <p className="text-xs text-gray-400">Help us improve Cyber Rakhwala</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4">
                {submitStatus === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-8 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">Feedback submitted</h4>
                    <p className="mt-2 text-sm text-gray-400">
                      Thanks for sharing this with the team.
                    </p>
                    {ticketId ? (
                      <div className="mt-4 inline-block rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2">
                        <p className="text-xs text-gray-400">Ticket ID</p>
                        <p className="font-mono text-sm text-purple-300">{ticketId}</p>
                      </div>
                    ) : null}
                    <button
                      onClick={handleClose}
                      className="mt-6 rounded-lg bg-purple-500/20 px-6 py-2 text-purple-300 transition-colors hover:bg-purple-500/30"
                    >
                      Close
                    </button>
                  </motion.div>
                ) : submitStatus === 'error' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-8 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">Submission failed</h4>
                    <p className="mt-2 text-sm text-gray-400">{errorMessage}</p>
                    <button
                      onClick={() => setSubmitStatus(null)}
                      className="mt-6 rounded-lg bg-red-500/20 px-6 py-2 text-red-300 transition-colors hover:bg-red-500/30"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        What type of feedback?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {FEEDBACK_TYPES.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setFeedbackType(type.id)}
                            className={`rounded-xl border p-3 text-left transition-all ${
                              feedbackType === type.id
                                ? type.activeClass
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <span className="inline-flex rounded-full border border-white/10 bg-slate-950/60 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-300">
                              {type.badge}
                            </span>
                            <p className={`mt-2 text-xs ${feedbackType === type.id ? 'text-white' : 'text-gray-400'}`}>
                              {type.label}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        How would you rate your experience?
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-7 w-7 ${
                                star <= (hoverRating || rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          </button>
                        ))}
                        {rating ? (
                          <span className="ml-2 text-sm text-gray-400">
                            {rating === 1
                              ? 'Poor'
                              : rating === 2
                                ? 'Fair'
                                : rating === 3
                                  ? 'Good'
                                  : rating === 4
                                    ? 'Great'
                                    : 'Excellent'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Tell us more <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(event) => {
                          setMessage(event.target.value);
                          if (validationMessage) {
                            setValidationMessage('');
                          }
                        }}
                        placeholder="Describe your feedback in detail..."
                        rows={4}
                        required
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      />
                      {validationMessage ? (
                        <p className="mt-2 text-xs text-amber-300">{validationMessage}</p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Email <span className="text-xs text-gray-500">(optional, for follow-up)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !feedbackType || !rating || !message.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default FeedbackBubble;
