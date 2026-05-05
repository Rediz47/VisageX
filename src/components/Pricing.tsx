import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Shield,
  CreditCard,
  Lock,
  X,
  ChevronLeft,
  Zap,
  ArrowRight,
  Star,
  Sparkles as SparklesIcon
} from 'lucide-react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer
} from '@paypal/react-paypal-js';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { usePostHog } from '@posthog/react';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { fireConfetti } from '../lib/confetti';

// ─── PayPal button wrapper ────────────────────────────────────────────────────
const PayPalBtn = ({ planId, createOrder, onApprove }: any) => {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  if (isRejected)
    return (
      <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-center gap-2 text-xs text-rose-400">
        <AlertCircle className="w-4 h-4 flex-shrink-0" /> PayPal failed to load.
      </div>
    );
  return (
    <div className="relative min-h-[110px] w-full">
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      )}
      <PayPalButtons
        style={{ layout: 'vertical', color: 'black', shape: 'pill', height: 50 }}
        createOrder={() => createOrder(planId)}
        onApprove={onApprove}
      />
    </div>
  );
};

// ─── Plan Data ────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  price: string;
  credits: number;
  savings?: string;
  popular?: boolean;
  description: string;
  features: string[];
}
const PLANS: Plan[] = [
  {
    id: 'price_single',
    name: 'Trial',
    price: '$1.49',
    credits: 1,
    description: 'One analysis. See what the AI uncovers.',
    features: ['1 Full Face Analysis', 'Strongest feature breakdown', 'Instant AI-generated report']
  },
  {
    id: 'price_basic',
    name: 'Explorer',
    price: '$4.99',
    credits: 5,
    popular: true,
    savings: 'Save 30%',
    description: 'Track improvement and build your roadmap.',
    features: [
      '5 Full Face Analyses',
      'Step-by-step improvement path',
      'Progress tracking across scans',
      'Priority processing'
    ]
  },
  {
    id: 'price_pro',
    name: 'Serious',
    price: '$12.99',
    credits: 15,
    savings: 'Save 40%',
    description: 'Deep optimization across 15 detailed reports.',
    features: [
      '15 Full Face Analyses',
      'High-res strength/weakness map',
      'Priority processing',
      'Full progress history'
    ]
  }
];

interface PricingProps {
  isDarkMode: boolean;
  userId: string;
  userEmail: string;
  onClose: () => void;
  overallScore?: number;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Pricing({ isDarkMode, userId, onClose, overallScore = 8.6 }: PricingProps) {
  const posthog = usePostHog();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState<'capturing' | 'success' | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const selectedPlanRef = React.useRef<string | null>(null);

  // Shorthand theme helpers
  const bg = isDarkMode ? 'bg-black' : 'bg-white';
  const bgSub = isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50';
  const bgCard = isDarkMode ? 'bg-zinc-900/60' : 'bg-zinc-100/70';
  const border = isDarkMode ? 'border-white/10' : 'border-zinc-200';
  const borderSub = isDarkMode ? 'border-white/5' : 'border-zinc-100';
  const text = isDarkMode ? 'text-white' : 'text-zinc-900';
  const textSub = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const textMuted = isDarkMode ? 'text-zinc-600' : 'text-zinc-400';
  const hoverBg = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-100';
  const iconBg = isDarkMode ? 'bg-white/5' : 'bg-zinc-100';
  const inputBg = isDarkMode ? 'bg-white/[0.025] border-white/8' : 'bg-zinc-50 border-zinc-200';

  const handleSelectPlan = (plan: Plan) => {
    setPaymentError(null);
    setSelectedPlan(plan);
    posthog.capture('plan_selected', { planId: plan.id });
  };

  const createOrder = useCallback(
    async (planId: string) => {
      setPaymentError(null);
      selectedPlanRef.current = planId;
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planId, userId })
      });
      const details = await res.json().catch(() => null);
      if (!res.ok || !details?.id) {
        const message = details?.error || 'Unable to start checkout. Please try again.';
        setPaymentError(message);
        throw new Error(message);
      }
      return details.id;
    },
    [userId]
  );

  const onApprove = useCallback(
    async (data: any) => {
      setLoading('capturing');
      setPaymentError(null);
      const token = await auth.currentUser?.getIdToken();
      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ orderID: data.orderID, userId, planId: selectedPlanRef.current })
        });
        const details = await res.json().catch(() => null);
        if (res.ok && (details?.status === 'COMPLETED' || details?.status === 'APPROVED')) {
          posthog.capture('checkout_completed', { planId: selectedPlanRef.current });
          fireConfetti();
          setLoading('success');
        } else {
          setPaymentError(details?.error || 'Payment could not be confirmed. Please try again.');
          setLoading(null);
        }
      } catch {
        setPaymentError('Payment confirmation failed. Please check your connection and try again.');
        setLoading(null);
      }
    },
    [userId, posthog]
  );

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  const overlay = isDarkMode ? 'bg-black/90' : 'bg-zinc-900/70';

  if (!paypalClientId) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md',
          overlay
        )}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn(
            'w-full max-w-md p-8 rounded-[2rem] border shadow-2xl text-center',
            bg,
            border
          )}
        >
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className={cn('text-2xl font-black mb-3 tracking-tight', text)}>
            Checkout unavailable
          </h2>
          <p className={cn('text-sm leading-relaxed mb-7', textSub)}>
            Payments are not configured yet. Please try again later or contact support.
          </p>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-full bg-indigo-500 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-colors"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ 'client-id': paypalClientId, 'enable-funding': 'card' }}>
      <div
        className={cn(
          'fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md',
          overlay
        )}
      >
        <AnimatePresence mode="wait">
          {/* ─── SUCCESS ──────────────────────────────────────────────── */}
          {loading === 'success' ? (
            <motion.div
              key="su"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'w-full max-w-lg p-14 rounded-[2.5rem] border shadow-2xl text-center',
                bg,
                border
              )}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-10"
              >
                <Check className="w-12 h-12 text-emerald-500" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={cn('text-4xl font-black mb-4 tracking-tight', text)}
              >
                You're all set.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className={cn('text-base mb-10', textSub)}
              >
                Credits added. Your full analysis is now unlocked.
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-5 rounded-full bg-indigo-500 text-white font-black uppercase tracking-widest text-sm hover:bg-indigo-600 transition-colors shadow-xl shadow-indigo-500/20"
              >
                View My Analysis ↗
              </motion.button>
            </motion.div>
          ) : /* ─── VERIFYING ───────────────────────────────────────────── */
          loading === 'capturing' ? (
            <motion.div
              key="ca"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'w-full max-w-sm p-14 rounded-[2.5rem] border shadow-2xl text-center',
                bg,
                border
              )}
            >
              <div className="relative w-16 h-16 mx-auto mb-8">
                <div
                  className={cn(
                    'w-16 h-16 rounded-full border-4 animate-spin',
                    isDarkMode
                      ? 'border-white/5 border-t-white'
                      : 'border-zinc-200 border-t-zinc-700'
                  )}
                />
                <Shield className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className={cn('text-xl font-black mb-2', text)}>Verifying Transaction</h3>
              <p className={cn('text-sm', textMuted)}>Confirming with PayPal…</p>
            </motion.div>
          ) : /* ─── CHECKOUT (2-COLUMN PREMIUM) ─────────────────────────── */
          selectedPlan ? (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              data-lenis-prevent="true"
              className={cn(
                'relative w-full max-w-5xl max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row border',
                bg,
                border
              )}
            >
              {/* Nav buttons */}
              <div className="absolute top-6 left-6 z-20">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs font-black uppercase tracking-widest transition-all',
                    borderSub,
                    textSub,
                    hoverBg
                  )}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  'absolute top-6 right-6 z-20 p-2.5 rounded-full border transition-all',
                  borderSub,
                  textSub,
                  hoverBg
                )}
              >
                <X className="w-5 h-5" />
              </button>

              {/* LEFT — Payment */}
              <div
                className={cn(
                  'flex-[1.1] p-8 pt-20 md:p-14 md:pt-24 flex flex-col gap-8',
                  isDarkMode ? 'border-r border-white/5' : 'border-r border-zinc-100'
                )}
              >
                <div>
                  <p
                    className={cn(
                      'text-[10px] uppercase font-black tracking-widest mb-3',
                      textMuted
                    )}
                  >
                    Secure Checkout
                  </p>
                  <h2 className={cn('text-3xl font-black tracking-tight', text)}>
                    Configure your plan
                  </h2>
                </div>

                <div>
                  <p
                    className={cn(
                      'text-[10px] uppercase font-black tracking-widest mb-4',
                      textMuted
                    )}
                  >
                    Payment method
                  </p>
                  <div
                    className={cn(
                      'p-5 rounded-2xl border flex items-center justify-between mb-5',
                      inputBg
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center',
                          isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'
                        )}
                      >
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className={cn('text-sm font-bold', text)}>
                        PayPal · Credit &amp; Debit Card
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-30">
                      <svg
                        viewBox="0 0 50 16"
                        className="h-4 w-auto"
                        fill={isDarkMode ? 'white' : '#111'}
                      >
                        <text y="13" fontSize="14" fontWeight="bold" letterSpacing="1">
                          VISA
                        </text>
                      </svg>
                      <svg viewBox="0 0 34 24" className="h-5 w-auto">
                        <circle cx="12" cy="12" r="12" fill="#EB5757" />
                        <circle cx="22" cy="12" r="12" fill="#F4A12A" fillOpacity=".85" />
                      </svg>
                    </div>
                  </div>
                  <PayPalBtn
                    planId={selectedPlan.id}
                    createOrder={createOrder}
                    onApprove={onApprove}
                  />
                  {paymentError && (
                    <div className="mt-4 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-3 text-left">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed text-rose-400">{paymentError}</p>
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'flex items-center justify-center gap-6 text-[9px] uppercase font-black tracking-widest',
                    textMuted,
                    'opacity-60'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Secure
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> SSL
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Instant
                  </span>
                </div>

                <p className={cn('text-[9px] leading-relaxed', textMuted)}>
                  By completing this purchase you agree to our Terms of Service. Credits are added
                  instantly to your account.
                </p>
              </div>

              {/* RIGHT — Summary */}
              <div className={cn('flex-1 flex flex-col p-8 pt-20 md:p-14 md:pt-24 gap-8', bgSub)}>
                <div className="mb-8">
                  <p
                    className={cn('text-xs uppercase font-black tracking-[0.2em] mb-3', textMuted)}
                  >
                    Your Plan
                  </p>
                  <h3 className={cn('text-2xl md:text-3xl font-black mb-1.5', text)}>
                    {selectedPlan.name}
                  </h3>
                  <p className={cn('text-sm', textSub)}>{selectedPlan.description}</p>
                </div>

                <div>
                  <p
                    className={cn(
                      'text-[10px] uppercase font-black tracking-widest mb-4',
                      textMuted
                    )}
                  >
                    What's included
                  </p>
                  <ul className="space-y-3.5">
                    {selectedPlan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-3 h-3 text-indigo-500" />
                        </div>
                        <span className={textSub}>{f}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className={textSub}>Full comparison report</span>
                    </li>
                  </ul>
                </div>

                <div className={cn('mt-auto border-t pt-8 space-y-3', borderSub)}>
                  <div className={cn('flex justify-between text-sm', textSub)}>
                    <span>
                      {selectedPlan.name} ({selectedPlan.credits} credit
                      {selectedPlan.credits > 1 ? 's' : ''})
                    </span>
                    <span>{selectedPlan.price}</span>
                  </div>
                  {selectedPlan.savings && (
                    <div className="flex justify-between text-sm text-emerald-500 font-bold">
                      <span>Discount</span>
                      <span>{selectedPlan.savings}</span>
                    </div>
                  )}
                  <div className={cn('flex justify-between text-sm', textSub)}>
                    <span>Processing fee</span>
                    <span className={cn('italic', textMuted)}>Included</span>
                  </div>
                  <div
                    className={cn(
                      'flex justify-between font-black text-xl pt-2 border-t',
                      text,
                      borderSub
                    )}
                  >
                    <span>Due today</span>
                    <span>{selectedPlan.price}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ─── PLAN SELECTION ────────────────────────────────────────── */
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              data-lenis-prevent="true"
              className={cn(
                'w-full max-w-7xl max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border',
                bg,
                border
              )}
            >
              {/* Header */}
              <div className={cn('relative px-8 md:px-12 pt-8 pb-7 border-b', borderSub)}>
                <button
                  onClick={onClose}
                  className={cn(
                    'absolute top-8 right-8 p-2.5 rounded-full border transition-all',
                    borderSub,
                    textSub,
                    hoverBg
                  )}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="max-w-3xl space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                      ✦ AI Face Analysis
                    </span>
                  </div>

                  <h1
                    className={cn(
                      'text-3xl md:text-4xl font-black tracking-tighter leading-none',
                      text
                    )}
                  >
                    Reveal Your
                    <br />
                    <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                      True Potential.
                    </span>
                  </h1>

                  <p className={cn('text-sm md:text-base max-w-xl leading-relaxed', textSub)}>
                    Discover exactly what's holding you back from{' '}
                    <span className="whitespace-nowrap">
                      <strong className={text}>Top 1%</strong>
                    </span>{' '}
                    — and fix it step-by-step.
                  </p>
                </div>
              </div>

              {/* Plan Cards */}
              <div className="p-8 md:p-14">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLANS.map((plan, i) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        'group relative flex flex-col rounded-[1.5rem] border p-6 transition-all duration-500 cursor-pointer',
                        plan.popular
                          ? isDarkMode
                            ? 'bg-[#0d0d1a] border-indigo-500/30 ring-1 ring-indigo-500/15 scale-[1.025] shadow-[0_0_60px_rgba(99,102,241,0.07)]'
                            : 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-200 scale-[1.025] shadow-xl shadow-indigo-500/10'
                          : isDarkMode
                            ? 'bg-zinc-950 border-white/8 hover:border-white/15 hover:bg-zinc-900/80'
                            : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                      )}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                          <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/25 whitespace-nowrap">
                            <Star className="w-3 h-3 fill-white" /> Most Popular
                          </span>
                        </div>
                      )}

                      <div className="mb-4 mt-1">
                        <p
                          className={cn(
                            'text-[10px] font-black uppercase tracking-[0.25em] mb-3',
                            textMuted
                          )}
                        >
                          {plan.name}
                        </p>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span
                            className={cn(
                              'text-[2.5rem] font-black tracking-tighter leading-none',
                              text
                            )}
                          >
                            {plan.price}
                          </span>
                          <span className={cn('text-sm font-bold', textMuted)}>
                            / {plan.credits} scan{plan.credits > 1 ? 's' : ''}
                          </span>
                        </div>
                        {plan.savings && (
                          <span className="inline-block text-xs font-black text-emerald-500">
                            {plan.savings}
                          </span>
                        )}
                        <p className={cn('text-sm mt-2 leading-snug', textSub)}>
                          {plan.description}
                        </p>
                      </div>

                      <ul className="space-y-2 mb-5 flex-grow">
                        {plan.features.map((f, fi) => (
                          <li key={fi} className="flex items-center gap-3 text-sm">
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                                plan.popular ? 'bg-indigo-500/15' : iconBg
                              )}
                            >
                              <Zap
                                className={cn(
                                  'w-3 h-3',
                                  plan.popular ? 'text-indigo-500' : textMuted
                                )}
                              />
                            </div>
                            <span className={cn('transition-colors', textSub)}>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        className={cn(
                          'w-full py-3 rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300',
                          plan.popular
                            ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25'
                            : isDarkMode
                              ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                              : 'bg-zinc-900 text-white hover:bg-zinc-700'
                        )}
                      >
                        Select Plan
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Trust footer */}
                <div
                  className={cn(
                    'mt-6 pt-6 border-t flex flex-col md:flex-row items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[.2em]',
                    borderSub,
                    textMuted
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-indigo-400" /> 256-bit SSL Encrypted
                  </span>
                  <span className="hidden md:block opacity-30">·</span>
                  <span className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-indigo-400" /> All Major Cards Accepted
                  </span>
                  <span className="hidden md:block opacity-30">·</span>
                  <span className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-indigo-400" /> Instant Credit Delivery
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PayPalScriptProvider>
  );
}
