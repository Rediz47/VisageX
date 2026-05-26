import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  Shield,
  Star,
  X,
  Zap
} from 'lucide-react';
import { initializePaddle, type Environments, type Paddle } from '@paddle/paddle-js';
import { usePostHog } from '@posthog/react';
import { cn } from '../lib/utils';
import { fireConfetti } from '../lib/confetti';

interface Plan {
  id: 'price_single' | 'price_basic' | 'price_pro' | 'price_elite';
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
  },
  {
    id: 'price_elite',
    name: 'Elite',
    price: '$29.99',
    credits: 50,
    savings: 'Save 60%',
    description: 'Creator & Coach Pack for bulk tracking.',
    features: [
      '50 Full Face Analyses',
      'Full progress history & trends',
      'AI Glow-Up Coach access',
      'Exclusive VIP support'
    ]
  }
];

const PADDLE_PRICE_IDS: Record<string, string | undefined> = {
  price_single: import.meta.env.VITE_PADDLE_PRICE_SINGLE,
  price_basic: import.meta.env.VITE_PADDLE_PRICE_BASIC,
  price_pro: import.meta.env.VITE_PADDLE_PRICE_PRO,
  price_elite: import.meta.env.VITE_PADDLE_PRICE_ELITE
};

let paddlePromise: Promise<Paddle | undefined> | null = null;

interface PricingProps {
  isDarkMode: boolean;
  userId: string;
  userEmail: string;
  onClose: () => void;
  overallScore?: number;
}

export function Pricing({ isDarkMode, userId, userEmail, onClose }: PricingProps) {
  const posthog = usePostHog();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkoutContainer, setCheckoutContainer] = useState<HTMLDivElement | null>(null);
  const openedInlinePlanRef = useRef<string | null>(null);

  const bg = isDarkMode ? 'bg-black' : 'bg-white';
  const border = isDarkMode ? 'border-white/10' : 'border-zinc-200';
  const borderSub = isDarkMode ? 'border-white/5' : 'border-zinc-100';
  const text = isDarkMode ? 'text-white' : 'text-zinc-900';
  const textSub = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const textMuted = isDarkMode ? 'text-zinc-600' : 'text-zinc-400';
  const hoverBg = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-100';
  const iconBg = isDarkMode ? 'bg-white/5' : 'bg-zinc-100';
  const overlay = isDarkMode ? 'bg-black/90' : 'bg-zinc-900/70';
  const bgSub = isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50';

  const getPaddle = useCallback(async () => {
    const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
    const environment = (import.meta.env.VITE_PADDLE_ENV || 'sandbox') as Environments;

    if (!token) {
      throw new Error('Paddle is not configured. Missing VITE_PADDLE_CLIENT_TOKEN.');
    }

    if (!paddlePromise) {
      paddlePromise = initializePaddle({
        token,
        environment,
        eventCallback: (event) => {
          if (event.name === 'checkout.completed') {
            posthog.capture('checkout_completed', { provider: 'paddle' });
            fireConfetti();
            setCheckoutComplete(true);
          }
        }
      });
    }

    const paddle = await paddlePromise;
    if (!paddle) {
      throw new Error('Unable to initialize Paddle checkout.');
    }
    return paddle;
  }, [posthog]);

  const handleSelectPlan = useCallback(
    async (plan: Plan) => {
      setPaymentError(null);
      setLoadingPlanId(plan.id);
      posthog.capture('plan_selected', { planId: plan.id, provider: 'paddle' });

      try {
        const priceId = PADDLE_PRICE_IDS[plan.id];
        if (!priceId) {
          throw new Error(
            `Missing Paddle price ID for ${plan.name}. Add ${plan.id === 'price_single' ? 'VITE_PADDLE_PRICE_SINGLE' : plan.id === 'price_basic' ? 'VITE_PADDLE_PRICE_BASIC' : 'VITE_PADDLE_PRICE_PRO'} to .env.`
          );
        }

        setSelectedPlan(plan);
      } catch (error: any) {
        setPaymentError(error?.message || 'Unable to start Paddle checkout. Please try again.');
      } finally {
        setLoadingPlanId(null);
      }
    },
    [posthog]
  );

  useEffect(() => {
    if (!selectedPlan || checkoutComplete) return;
    if (!checkoutContainer) return;
    if (openedInlinePlanRef.current === selectedPlan.id) return;

    let cancelled = false;

    async function openInlineCheckout() {
      setPaymentError(null);
      setLoadingPlanId(selectedPlan.id);

      try {
        const priceId = PADDLE_PRICE_IDS[selectedPlan.id];
        if (!priceId) {
          throw new Error(`Missing Paddle price ID for ${selectedPlan.name}.`);
        }

        const paddle = await getPaddle();
        if (cancelled) return;

        openedInlinePlanRef.current = selectedPlan.id;
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: userEmail ? { email: userEmail } : undefined,
          customData: { userId, planId: selectedPlan.id },
          settings: {
            displayMode: 'inline',
            theme: isDarkMode ? 'dark' : 'light',
            frameTarget: 'paddle-inline-checkout',
            frameInitialHeight: 520,
            frameStyle:
              'width: 100%; min-width: 312px; background-color: transparent; border: none;',
            successUrl: `${window.location.origin}/?checkout=success`,
            showAddTaxId: false
          }
        });
      } catch (error: any) {
        openedInlinePlanRef.current = null;
        setPaymentError(error?.message || 'Unable to start Paddle checkout. Please try again.');
      } finally {
        setLoadingPlanId(null);
      }
    }

    openInlineCheckout();

    return () => {
      cancelled = true;
    };
  }, [checkoutComplete, checkoutContainer, getPaddle, isDarkMode, selectedPlan, userEmail, userId]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md',
        overlay
      )}
    >
      <AnimatePresence mode="wait">
        {checkoutComplete ? (
          <motion.div
            key="success"
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
            <h2 className={cn('text-4xl font-black mb-4 tracking-tight', text)}>You're all set.</h2>
            <p className={cn('text-base mb-10', textSub)}>
              Credits will be added as soon as Paddle confirms the transaction.
            </p>
            <button
              onClick={onClose}
              className="w-full py-5 rounded-full bg-indigo-500 text-white font-black uppercase tracking-widest text-sm hover:bg-indigo-600 transition-colors shadow-xl shadow-indigo-500/20"
            >
              Continue ↗
            </button>
          </motion.div>
        ) : selectedPlan ? (
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
            <div className="absolute top-6 left-6 z-20">
              <button
                onClick={() => {
                  openedInlinePlanRef.current = null;
                  setSelectedPlan(null);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs font-black uppercase tracking-widest transition-all',
                  borderSub,
                  textSub,
                  hoverBg
                )}
              >
                ← Back
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

            <div
              className={cn(
                'flex-[1.1] p-8 pt-20 md:p-14 md:pt-24 flex flex-col gap-6',
                isDarkMode ? 'border-r border-white/5' : 'border-r border-zinc-100'
              )}
            >
              <div>
                <p
                  className={cn('text-[10px] uppercase font-black tracking-widest mb-3', textMuted)}
                >
                  Paddle Secure Checkout
                </p>
                <h2 className={cn('text-3xl font-black tracking-tight', text)}>
                  Complete your order
                </h2>
                <p className={cn('text-sm mt-3 leading-relaxed', textSub)}>
                  Finish payment securely without leaving the VisageX checkout.
                </p>
              </div>

              {paymentError && (
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-3 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-rose-400">{paymentError}</p>
                </div>
              )}

              <div
                className={cn(
                  'rounded-[1.5rem] border overflow-hidden',
                  borderSub,
                  isDarkMode ? 'bg-white/[0.02]' : 'bg-white'
                )}
              >
                {loadingPlanId === selectedPlan.id && (
                  <div className="p-8 flex items-center justify-center gap-3 text-sm font-bold text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Paddle checkout…
                  </div>
                )}
                <div ref={setCheckoutContainer} className="paddle-inline-checkout min-h-[520px]" />
              </div>
            </div>

            <div className={cn('flex-1 flex flex-col p-8 pt-20 md:p-14 md:pt-24 gap-8', bgSub)}>
              <div className="mb-4">
                <p className={cn('text-xs uppercase font-black tracking-[0.2em] mb-3', textMuted)}>
                  Your Plan
                </p>
                <h3 className={cn('text-2xl md:text-3xl font-black mb-1.5', text)}>
                  {selectedPlan.name}
                </h3>
                <p className={cn('text-sm', textSub)}>{selectedPlan.description}</p>
              </div>

              <div>
                <p
                  className={cn('text-[10px] uppercase font-black tracking-widest mb-4', textMuted)}
                >
                  What's included
                </p>
                <ul className="space-y-3.5">
                  {selectedPlan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-3 h-3 text-indigo-500" />
                      </div>
                      <span className={textSub}>{feature}</span>
                    </li>
                  ))}
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
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    Paddle Secure Checkout
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
                  <strong className={text}>Top 1%</strong> — and fix it step-by-step.
                </p>
              </div>
            </div>

            <div className="p-8 md:p-14">
              {paymentError && (
                <div className="mb-6 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-3 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-rose-400">{paymentError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <p className={cn('text-sm mt-2 leading-snug', textSub)}>{plan.description}</p>
                    </div>

                    <ul className="space-y-2 mb-5 flex-grow">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
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
                          <span className={cn('transition-colors', textSub)}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={loadingPlanId === plan.id}
                      className={cn(
                        'w-full py-3 rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-wait',
                        plan.popular
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25'
                          : isDarkMode
                            ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                            : 'bg-zinc-900 text-white hover:bg-zinc-700'
                      )}
                    >
                      {loadingPlanId === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Pay with Paddle'
                      )}
                      {loadingPlanId !== plan.id && (
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              <div
                className={cn(
                  'mt-6 pt-6 border-t flex flex-col md:flex-row items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[.2em]',
                  borderSub,
                  textMuted
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-indigo-400" /> Paddle Secure Checkout
                </span>
                <span className="hidden md:block opacity-30">·</span>
                <span className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-indigo-400" /> Cards Accepted
                </span>
                <span className="hidden md:block opacity-30">·</span>
                <span className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-indigo-400" /> Instant Credit Delivery
                </span>
              </div>

              <div className={cn('mt-4 text-center text-[9px] uppercase font-bold tracking-widest', textMuted)}>
                Need custom or enterprise pricing?{' '}
                <a href="mailto:support@visagex.online" className="text-indigo-500 hover:text-indigo-400 transition-colors underline">
                  Contact support
                </a>{' '}
                to request our downloadable custom enterprise sheet.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
