import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  Gift,
  Percent,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  X,
  Zap
} from 'lucide-react';
import { useCredits } from '../../../context/CreditContext';
import paymentService from '../../../services/paymentService';

const fallbackPlans = [
  { id: 'starter', slug: 'starter', name: 'Starter', credits: 100, price: 99, isPopular: false },
  { id: 'basic', slug: 'basic', name: 'Basic', credits: 250, price: 199, isPopular: false },
  { id: 'pro', slug: 'pro', name: 'Pro', credits: 500, price: 349, isPopular: true },
  { id: 'enterprise', slug: 'enterprise', name: 'Enterprise', credits: 1000, price: 599, isPopular: false }
];

const planColors = {
  starter: 'from-slate-500 to-zinc-600',
  basic: 'from-cyan-500 to-blue-600',
  pro: 'from-amber-500 to-orange-600',
  enterprise: 'from-violet-500 to-purple-600'
};

const formatCurrency = (amount, fractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(Number(amount || 0));

const RechargeCredits = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { credits, refreshCredits } = useCredits();

  const [plans, setPlans] = useState(fallbackPlans);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentStep, setCurrentStep] = useState('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [purchasedPlan, setPurchasedPlan] = useState(null);

  useEffect(() => {
    paymentService
      .getPlans({ category: 'credits' })
      .then((payload) => {
        if (!Array.isArray(payload) || payload.length === 0) return;

        setPlans(
          payload.map((plan) => ({
            ...plan,
            slug: plan.slug || plan.id,
            isPopular: Boolean(plan.isPopular)
          }))
        );
      })
      .catch((error) => {
        console.error('[RechargeCredits] Failed to load plans:', error);
      });
  }, []);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      refreshCredits?.().catch(() => {});
      setCurrentStep('success');
    }
  }, [refreshCredits, searchParams]);

  const selectedPlanData = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan || plan.slug === selectedPlan) || null,
    [plans, selectedPlan]
  );

  const calculateFinalPrice = () => {
    if (!selectedPlanData) return 0;
    if (appliedDiscount?.finalAmount !== undefined) return appliedDiscount.finalAmount;
    if (!appliedDiscount) return selectedPlanData.price;

    if (appliedDiscount.type === 'percentage') {
      return Math.round(selectedPlanData.price * (1 - appliedDiscount.value / 100));
    }

    return Math.max(0, selectedPlanData.price - appliedDiscount.value);
  };

  const handleApplyRedeemCode = async () => {
    if (!redeemCode.trim() || !selectedPlanData) return;

    setIsValidatingCode(true);
    setCodeError('');
    try {
      const response = await paymentService.validateRedeemCode(
        redeemCode.trim().toUpperCase(),
        selectedPlanData.slug || selectedPlanData.id
      );

      if (!response?.valid) {
        setAppliedDiscount(null);
        setCodeError('Invalid or expired code');
        return;
      }

      setAppliedDiscount({
        code: redeemCode.trim().toUpperCase(),
        type: response.discountType === 'fixed' ? 'fixed' : 'percentage',
        value: response.discountValue,
        amount: response.discountAmount,
        finalAmount: response.finalAmount
      });
    } catch (error) {
      console.error('[RechargeCredits] Coupon validation failed:', error);
      setAppliedDiscount(null);
      setCodeError(error.message || 'Failed to validate code');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setRedeemCode('');
    setCodeError('');
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlanData) return;

    setIsProcessing(true);
    setPaymentError('');

    try {
      const provider = window.Razorpay ? 'razorpay' : 'internal';
      const orderData = await paymentService.createOrder({
        planId: selectedPlanData.slug || selectedPlanData.id,
        provider,
        currency: 'INR',
        amount: calculateFinalPrice(),
        redeemCode: appliedDiscount?.code || undefined
      });

      if (provider === 'razorpay' && orderData.gateway?.orderId && window.Razorpay) {
        await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: orderData.gateway.keyId,
            amount: Math.round(orderData.finalAmount * 100),
            currency: orderData.currency,
            order_id: orderData.gateway.orderId,
            name: 'Cyber Rakhwala',
            description: `${selectedPlanData.name} Credits`,
            handler: async (response) => {
              try {
                await paymentService.verifyOrder({
                  orderId: orderData.orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature
                });
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled'))
            },
            theme: {
              color: '#f59e0b'
            }
          });

          razorpay.open();
        });
      } else if (orderData.checkoutUrl) {
        window.location.assign(orderData.checkoutUrl);
        return;
      } else {
        await paymentService.verifyOrder({
          orderId: orderData.orderId,
          paymentId: orderData.providerReference || orderData.orderId
        });
      }

      await refreshCredits?.();
      setPurchasedPlan(selectedPlanData);
      setCurrentStep('success');
    } catch (error) {
      console.error('[RechargeCredits] Payment failed:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (currentStep === 'checkout') {
                setCurrentStep('select');
              } else {
                navigate('/dashboard/user');
              }
            }}
            className="rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </motion.button>
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <Zap className="h-6 w-6 text-white" />
              </div>
              {currentStep === 'select' && 'Recharge Credits'}
              {currentStep === 'checkout' && 'Checkout'}
              {currentStep === 'success' && 'Payment Complete'}
            </h1>
            <p className="mt-1 text-gray-400">
              {currentStep === 'select' && 'Choose a plan that fits your investigation workload'}
              {currentStep === 'checkout' && 'Review your order and complete payment securely'}
              {currentStep === 'success' && 'Your credits have been applied to the account'}
            </p>
          </div>
        </div>

        {currentStep !== 'success' && (
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${currentStep === 'select' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-sm font-bold">1</span>
              <span className="text-sm font-medium">Select Plan</span>
            </div>
            <div className="h-px w-8 bg-white/20" />
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${currentStep === 'checkout' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-sm font-bold">2</span>
              <span className="text-sm font-medium">Checkout</span>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20">
                <Zap className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-4xl font-bold text-amber-300">{credits}</p>
                <p className="text-xs text-gray-500">credits available</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Clock className="mx-auto mb-1 h-5 w-5 text-cyan-400" />
                <p className="text-xs text-gray-500">Never Expires</p>
              </div>
              <div className="text-center">
                <Shield className="mx-auto mb-1 h-5 w-5 text-green-400" />
                <p className="text-xs text-gray-500">Secure Payment</p>
              </div>
              <div className="text-center">
                <TrendingUp className="mx-auto mb-1 h-5 w-5 text-violet-400" />
                <p className="text-xs text-gray-500">Instant Credit</p>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.slug || plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => setSelectedPlan(plan.slug || plan.id)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                      selectedPlan === (plan.slug || plan.id)
                        ? 'border-amber-500 bg-amber-500/10 shadow-xl shadow-amber-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-bold text-white">
                        <Star className="h-3 w-3" />
                        Most Popular
                      </div>
                    )}

                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${planColors[plan.slug] || 'from-cyan-500 to-blue-600'}`}>
                      <Zap className="h-7 w-7 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">{formatCurrency(plan.price)}</span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-amber-400">{plan.credits} Credits</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(plan.price / plan.credits, 2)} per credit
                    </p>

                    {selectedPlan === (plan.slug || plan.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500"
                      >
                        <CheckCircle className="h-5 w-5 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: selectedPlan ? 1.02 : 1 }}
                  whileTap={{ scale: selectedPlan ? 0.98 : 1 }}
                  onClick={() => selectedPlan && setCurrentStep('checkout')}
                  disabled={!selectedPlan}
                  className={`flex items-center gap-3 rounded-xl px-10 py-4 text-lg font-bold transition-all ${
                    selectedPlan
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400'
                      : 'cursor-not-allowed bg-gray-700 text-gray-400'
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentStep === 'checkout' && selectedPlanData && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mx-auto max-w-2xl"
            >
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <ShoppingCart className="h-5 w-5 text-amber-400" />
                  Order Summary
                </h2>

                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${planColors[selectedPlanData.slug] || 'from-cyan-500 to-blue-600'}`}>
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{selectedPlanData.name} Pack</h3>
                      <p className="font-semibold text-amber-400">{selectedPlanData.credits} Credits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{formatCurrency(selectedPlanData.price)}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(selectedPlanData.price / selectedPlanData.credits, 2)}/credit
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-violet-400" />
                    <h3 className="font-semibold text-white">Have a Redeem Code?</h3>
                  </div>

                  {!appliedDiscount ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={redeemCode}
                          onChange={(event) => {
                            setRedeemCode(event.target.value.toUpperCase());
                            setCodeError('');
                          }}
                          placeholder="Enter code"
                          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-gray-500 transition-all focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleApplyRedeemCode}
                        disabled={!redeemCode.trim() || isValidatingCode}
                        className="flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isValidatingCode ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                          />
                        ) : (
                          'Apply'
                        )}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-emerald-400" />
                        <span className="font-semibold text-emerald-400">{appliedDiscount.code}</span>
                        <span className="text-gray-400">
                          ({appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}% off` : `${formatCurrency(appliedDiscount.value)} off`})
                        </span>
                      </div>
                      <button onClick={handleRemoveDiscount} className="rounded-lg p-1 transition-colors hover:bg-white/10">
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  )}

                  {codeError && <p className="mt-2 text-sm text-red-400">{codeError}</p>}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedPlanData.price)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>-{formatCurrency(appliedDiscount.amount ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold text-white">
                    <span>Total</span>
                    <span className="text-amber-400">{formatCurrency(calculateFinalPrice())}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Balance after purchase</span>
                  <span className="flex items-center gap-2 text-xl font-bold text-cyan-400">
                    <Zap className="h-5 w-5" />
                    {credits + selectedPlanData.credits} credits
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProceedToPayment}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-lg font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                    />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Proceed to Payment Gateway
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>

              {paymentError && <p className="mt-4 text-center text-sm text-red-400">{paymentError}</p>}

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-gray-500">
                <Shield className="h-4 w-4 text-green-400" />
                Secured by 256-bit SSL encryption
              </p>
            </motion.div>
          )}

          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20"
              >
                <CheckCircle className="h-12 w-12 text-emerald-400" />
              </motion.div>
              <h2 className="mb-2 text-3xl font-bold text-white">Payment Successful!</h2>
              <p className="mb-6 text-gray-400">
                {purchasedPlan?.credits ? `${purchasedPlan.credits} credits have been added to your account` : 'Your payment has been confirmed'}
              </p>
              <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <p className="text-sm text-gray-400">New Balance</p>
                <p className="flex items-center justify-center gap-2 text-4xl font-bold text-emerald-400">
                  <Zap className="h-8 w-8" />
                  {credits} credits
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/user')}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 font-semibold text-white"
              >
                Back to Dashboard
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {currentStep !== 'success' && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p className="flex flex-wrap items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-400" />
                SSL Secured
              </span>
              <span>|</span>
              <span>UPI, Cards, Net Banking accepted</span>
              <span>|</span>
              <span>Instant credit delivery</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RechargeCredits;
