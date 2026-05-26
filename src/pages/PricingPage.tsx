import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  X
} from 'lucide-react';
import { usePostHog } from '@posthog/react';
import type { Environments } from '@paddle/paddle-js';

import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthProvider';
import { useCredits } from '../context/CreditsProvider';
import { fireConfetti } from '../lib/confetti';
import { InlineCheckout } from '../../components/inline-checkout';
import { usePaddlePrices } from '../../hooks/use-paddle-prices';
import type { CheckoutCompleteData } from '../../lib/paddle-types';

interface Plan {
  id: 'price_single' | 'price_basic' | 'price_pro' | 'price_elite';
  name: string;
  eyebrow: string;
  fallbackPrice: string;
  credits: number;
  description: string;
  note: string;
  cta: string;
  valueLine: string;
  recommended?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'price_single',
    name: 'Quick Scan',
    eyebrow: 'Try it once',
    fallbackPrice: '$1.49',
    credits: 1,
    description: 'Get a clear snapshot of how your face looks today.',
    note: 'One-time payment. Private results.',
    cta: 'Analyze My Face',
    valueLine: 'Quick benchmark',
    features: [
      'See your current attractiveness signals',
      'Find your strongest facial features',
      'Understand your facial balance',
      'Save a private glow-up report'
    ]
  },
  {
    id: 'price_basic',
    name: 'Glow-Up',
    eyebrow: 'Most popular',
    fallbackPrice: '$4.99',
    credits: 5,
    description: 'Track visible improvement and know exactly what changed.',
    note: 'Only about $1 per scan.',
    cta: 'Start My Glow-Up',
    valueLine: 'Best deal for most people',
    recommended: true,
    features: [
      'Track your glow-up week by week',
      'Compare hairstyle, skin, and grooming changes',
      'See how attractive your facial balance looks',
      'Get clear improvement priorities'
    ]
  },
  {
    id: 'price_pro',
    name: 'Serious Progress',
    eyebrow: 'Lowest per scan',
    fallbackPrice: '$12.99',
    credits: 15,
    description: 'Build a real month-by-month transformation record.',
    note: 'Save big vs single scans.',
    cta: 'Track My Progress',
    valueLine: 'About $0.87 per scan',
    features: [
      'Monitor your face improvement over time',
      'Compare routines and photo conditions',
      'Spot trends in symmetry and structure',
      'Create a long-term progress history'
    ]
  },
  {
    id: 'price_elite',
    name: 'Creator Pro',
    eyebrow: 'For content & coaching',
    fallbackPrice: '$29.99',
    credits: 50,
    description: 'For creators, coaches, and people documenting serious glow-ups.',
    note: 'Premium bulk pack.',
    cta: 'Unlock Creator Pack',
    valueLine: 'Only $0.60 per scan',
    features: [
      'Create before/after glow-up content',
      'Track multiple transformations',
      'Use AI coach recommendations',
      'Export private progress reports'
    ]
  }
];

const PADDLE_PRICE_IDS: Record<Plan['id'], string | undefined> = {
  price_single: import.meta.env.VITE_PADDLE_PRICE_SINGLE,
  price_basic: import.meta.env.VITE_PADDLE_PRICE_BASIC,
  price_pro: import.meta.env.VITE_PADDLE_PRICE_PRO,
  price_elite: import.meta.env.VITE_PADDLE_PRICE_ELITE
};

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function PricingPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { credits } = useCredits();
  const posthog = usePostHog();

  const [checkoutPlanId, setCheckoutPlanId] = useState<Plan['id'] | null>(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [creditsBeforeCheckout, setCreditsBeforeCheckout] = useState<number | null>(null);

  const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  const environment = (import.meta.env.VITE_PADDLE_ENV || 'sandbox') as Environments;

  const priceIds = useMemo(
    () => Object.values(PADDLE_PRICE_IDS).filter((id): id is string => Boolean(id)),
    []
  );

  const { prices, loading: pricesLoading } = usePaddlePrices({
    clientToken: clientToken || '',
    environment,
    priceIds
  });

  const selectedPlan = checkoutPlanId
    ? (PLANS.find((plan) => plan.id === checkoutPlanId) ?? null)
    : null;
  const selectedPaddleId = selectedPlan ? PADDLE_PRICE_IDS[selectedPlan.id] : undefined;

  const openCheckout = useCallback(
    (plan: Plan) => {
      const priceId = PADDLE_PRICE_IDS[plan.id];
      if (!user?.uid) {
        setCheckoutError(
          'Please sign in before checkout so your credits can be added to your account.'
        );
        return;
      }
      if (!clientToken) {
        setCheckoutError('Paddle checkout is not configured. Missing client token.');
        return;
      }
      if (!priceId) {
        setCheckoutError(`Missing Paddle price ID for ${plan.name}.`);
        return;
      }
      setCheckoutError(null);
      setCheckoutComplete(false);
      setCreditsBeforeCheckout(credits);
      setCheckoutPlanId(plan.id);
      posthog.capture('checkout_overlay_opened', { planId: plan.id, provider: 'paddle' });
    },
    [clientToken, credits, posthog, user?.uid]
  );

  const closeCheckout = useCallback(() => {
    setCheckoutPlanId(null);
    setCheckoutError(null);
    setCheckoutComplete(false);
    setCreditsBeforeCheckout(null);
  }, []);

  const handleComplete = useCallback(
    async (data: CheckoutCompleteData) => {
      posthog.capture('checkout_completed', { provider: 'paddle' });
      setCheckoutComplete(true);
      setCheckoutError(null);

      if (!data.transactionId) {
        setCheckoutError(
          'Payment completed, but Paddle did not return a transaction ID. Please contact support.'
        );
        return;
      }

      try {
        const response = await fetch('/api/paddle/claim-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: data.transactionId })
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || 'Unable to verify Paddle transaction.');
        }
      } catch (error: any) {
        setCheckoutError(
          error?.message || 'Payment completed, but credits could not be added automatically.'
        );
      }
    },
    [posthog]
  );

  const expectedCreditsAfterCheckout =
    creditsBeforeCheckout !== null && selectedPlan
      ? creditsBeforeCheckout + selectedPlan.credits
      : null;
  const creditsApplied =
    checkoutComplete &&
    expectedCreditsAfterCheckout !== null &&
    credits >= expectedCreditsAfterCheckout;

  useEffect(() => {
    if (creditsApplied) {
      fireConfetti();
    }
  }, [creditsApplied]);

  const pageBg = isDarkMode ? 'bg-[#070708]' : 'bg-[#fbfbfc]';
  const panel = isDarkMode ? 'bg-[#101012] border-white/10' : 'bg-white border-zinc-200';
  const title = isDarkMode ? 'text-zinc-50' : 'text-zinc-950';
  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const faint = isDarkMode ? 'text-zinc-600' : 'text-zinc-400';

  return (
    <>
      <Helmet>
        <title>Pricing — VisageX</title>
        <meta
          name="description"
          content="Simple one-time scan credits for VisageX face analysis."
        />
      </Helmet>

      <div className={`min-h-screen ${pageBg} px-4 pb-20 pt-6 sm:px-6`}>
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate('/')}
            className={`mb-14 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              isDarkMode
                ? 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <motion.header
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOut }}
            className="mx-auto mb-8 max-w-3xl text-center"
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${faint}`}>
              Glow-up scan credits
            </p>
            <h1 className={`mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl ${title}`}>
              Track your face improvement with AI.
            </h1>
            <p className={`mx-auto mt-4 max-w-lg text-sm leading-6 ${muted}`}>
              See what changed, what improved, and what to work on next. One-time credits. No
              subscription.
            </p>
          </motion.header>

          <div className="mx-auto mb-8 grid max-w-3xl grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-center shadow-2xl shadow-indigo-950/10">
            {[
              ['42,000+', 'scans completed'],
              ['71', 'countries'],
              ['4.8/5', 'avg rating']
            ].map(([value, label]) => (
              <div key={label} className="border-r border-white/10 px-3 py-4 last:border-r-0">
                <div className={`text-xl font-semibold tracking-[-0.03em] ${title}`}>{value}</div>
                <div className={`mt-1 text-[11px] uppercase tracking-[0.14em] ${faint}`}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className={`relative mx-auto mb-12 overflow-hidden rounded-[2rem] border p-5 shadow-2xl md:p-6 ${isDarkMode ? 'border-indigo-400/15 bg-white/[0.035] shadow-indigo-950/20' : 'border-indigo-100 bg-white shadow-indigo-100/60'}`}
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="grid items-center gap-6 md:grid-cols-[1fr_1.25fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Example progress report
                </div>
                <h2 className={`mt-4 text-2xl font-semibold tracking-[-0.04em] ${title}`}>
                  Know if your glow-up is actually working.
                </h2>
                <p className={`mt-3 text-sm leading-6 ${muted}`}>
                  Compare scans over time, spot visible changes, and turn vague self-improvement
                  into a simple progress timeline.
                </p>
                <div className="mt-5 grid gap-2 text-sm">
                  {[
                    'Track facial balance changes',
                    'Compare skincare, haircut, and grooming',
                    'Build confidence with measurable progress'
                  ].map((item) => (
                    <div key={item} className={`flex items-center gap-2 ${muted}`}>
                      <Check className="h-4 w-4 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                <div className="grid grid-cols-3 gap-3">
                  {['Start', 'Week 2', 'Week 4'].map((label, idx) => (
                    <div
                      key={label}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-950 p-3"
                    >
                      <div className="mx-auto h-20 w-16 rounded-full bg-gradient-to-b from-zinc-500/60 to-zinc-800 blur-[1px]" />
                      <div className="mt-3 text-center text-[11px] font-semibold text-zinc-400">
                        {label}
                      </div>
                      <div className="mt-1 text-center text-xs font-bold text-emerald-400">
                        +{idx * 9}% balance
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
                  +18% facial balance improvement detected
                </div>
              </div>
            </div>
          </motion.section>

          <div className="mx-auto mb-8 grid max-w-4xl gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Track facial improvements',
              'Compare hairstyle changes',
              'Improve symmetry awareness',
              'Monitor skincare progress',
              'Build confidence',
              'Create glow-up content'
            ].map((reason) => (
              <div
                key={reason}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-white/[0.025] text-zinc-300' : 'border-zinc-200 bg-white text-zinc-600'}`}
              >
                <Sparkles className="h-4 w-4 text-violet-500" />
                {reason}
              </div>
            ))}
          </div>

          {checkoutError && !selectedPlan && (
            <div className="mx-auto mb-6 max-w-xl rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-600 dark:text-amber-300">
              {checkoutError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
            {PLANS.map((plan, index) => {
              const paddleId = PADDLE_PRICE_IDS[plan.id];
              const price = paddleId ? prices[paddleId]?.total : undefined;
              const isFeatured = Boolean(plan.recommended);

              return (
                <motion.article
                  key={plan.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: isFeatured ? -12 : 0 }}
                  whileHover={{ y: isFeatured ? -18 : -6, rotateX: isFeatured ? 1.5 : 0 }}
                  transition={{ duration: 0.55, delay: index * 0.06, ease: easeOut }}
                  className={`relative rounded-[1.75rem] border p-6 shadow-sm transition-all md:p-7 ${
                    isFeatured
                      ? isDarkMode
                        ? 'scale-[1.03] border-violet-400/50 bg-[#121018] shadow-2xl shadow-violet-950/50 ring-2 ring-violet-400/30'
                        : 'scale-[1.03] border-violet-300 bg-white shadow-2xl shadow-violet-200/70 ring-2 ring-violet-200'
                      : isDarkMode
                        ? `${panel} shadow-black/20`
                        : `${panel} shadow-zinc-200/60`
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-violet-500/30">
                      <Star className="h-3 w-3 fill-white" />
                      Most popular
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.12em] ${isFeatured ? 'text-violet-400' : faint}`}
                      >
                        {plan.eyebrow}
                      </p>
                      <h2 className={`mt-2 text-2xl font-semibold tracking-[-0.03em] ${title}`}>
                        {plan.name}
                      </h2>
                    </div>
                    <div
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isFeatured ? 'bg-violet-500/15 text-violet-300' : isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {plan.credits} scan{plan.credits > 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="mt-7 flex items-end gap-2">
                    {pricesLoading && !price ? (
                      <div
                        className={`h-10 w-24 animate-pulse rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-zinc-100'}`}
                      />
                    ) : (
                      <span className={`text-5xl font-semibold tracking-[-0.05em] ${title}`}>
                        {price || plan.fallbackPrice}
                      </span>
                    )}
                    <span className={`pb-2 text-xs ${faint}`}>one-time</span>
                  </div>
                  <div
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${isFeatured ? 'bg-emerald-500/10 text-emerald-400' : isDarkMode ? 'bg-white/5 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}
                  >
                    {plan.valueLine}
                  </div>

                  <p className={`mt-5 min-h-[60px] text-sm leading-6 ${muted}`}>
                    {plan.description}
                  </p>

                  <div className={`my-6 h-px ${isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`} />

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`flex gap-2.5 text-sm ${muted}`}>
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => openCheckout(plan)}
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] ${
                      isFeatured
                        ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40'
                        : isDarkMode
                          ? 'bg-white/7 text-white ring-1 ring-white/10 hover:bg-white/12'
                          : 'bg-zinc-950 text-white hover:bg-zinc-800'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className={`mt-4 text-center text-xs ${faint}`}>{plan.note}</p>
                  <div className={`mt-3 flex flex-wrap justify-center gap-2 text-[10px] ${faint}`}>
                    <span>Instant results</span>
                    <span>•</span>
                    <span>No subscription</span>
                    <span>•</span>
                    <span>Private analysis</span>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div
            className={`mx-auto mt-12 flex max-w-xl items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs ${
              isDarkMode ? 'border-white/10 text-zinc-500' : 'border-zinc-200 text-zinc-500'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Secure checkout by Paddle. Taxes are calculated inside checkout.
          </div>

          <div className={`mx-auto mt-4 text-center text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Need custom or enterprise pricing?{' '}
            <a href="mailto:support@visagex.online" className="text-indigo-500 hover:text-indigo-400 transition-colors underline">
              Contact support
            </a>{' '}
            to request our downloadable custom enterprise sheet.
          </div>
        </div>

        <AnimatePresence>
          {selectedPlan && selectedPaddleId && clientToken && (
            <motion.div
              className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                aria-label="Close checkout"
                onClick={closeCheckout}
                className="absolute inset-0 h-full w-full bg-zinc-950/65 backdrop-blur-md"
              />

              <motion.section
                initial={{ opacity: 0, y: 28, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.985 }}
                transition={{ duration: 0.45, ease: easeOut }}
                className={`relative z-10 mx-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border shadow-2xl ${
                  isDarkMode ? 'border-white/10 bg-[#0b0b0d]' : 'border-zinc-200 bg-white'
                }`}
              >
                <div
                  className={`sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4 backdrop-blur-xl sm:px-7 ${
                    isDarkMode ? 'border-white/10 bg-[#0b0b0d]/85' : 'border-zinc-200 bg-white/85'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-medium ${faint}`}>Checkout</p>
                    <h2 className={`text-lg font-semibold tracking-[-0.02em] ${title}`}>
                      {selectedPlan.name} · {selectedPlan.credits} scans
                    </h2>
                  </div>
                  <button
                    onClick={closeCheckout}
                    className={`rounded-full p-2 transition-colors ${isDarkMode ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {checkoutComplete ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="px-6 py-16 text-center"
                    >
                      <div
                        className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full text-white ${creditsApplied ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      >
                        {creditsApplied ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                      </div>
                      <h3 className={`text-2xl font-semibold tracking-[-0.03em] ${title}`}>
                        {creditsApplied ? 'Credits added' : 'Payment received'}
                      </h3>
                      <p className={`mx-auto mt-2 max-w-sm text-sm ${muted}`}>
                        {creditsApplied
                          ? `Your balance is now ${credits} credits. You can start a new analysis now.`
                          : checkoutError ||
                            'Paddle confirmed your payment. Waiting for the secure webhook to add credits to your account...'}
                      </p>
                      <div
                        className={`mx-auto mt-5 max-w-xs rounded-2xl border px-4 py-3 text-sm ${isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-zinc-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={muted}>Current balance</span>
                          <span className={`font-semibold ${title}`}>{credits}</span>
                        </div>
                        {expectedCreditsAfterCheckout !== null && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className={muted}>Expected balance</span>
                            <span className={`font-semibold ${title}`}>
                              {expectedCreditsAfterCheckout}
                            </span>
                          </div>
                        )}
                      </div>
                      {creditsApplied ? (
                        <button
                          onClick={() => navigate('/')}
                          className="mt-7 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                        >
                          Start analysis
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <p className={`mx-auto mt-5 max-w-sm text-xs leading-5 ${faint}`}>
                          If this stays here, add PADDLE_API_KEY to the backend or fix your Paddle
                          webhook URL/secret.
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="checkout"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid gap-0 lg:grid-cols-[360px_1fr]"
                    >
                      <aside
                        className={`relative overflow-hidden border-b p-6 lg:border-b-0 lg:border-r lg:p-7 ${isDarkMode ? 'border-white/10 bg-white/[0.015]' : 'border-zinc-200 bg-zinc-50/40'}`}
                      >
                        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
                        <div className="relative">
                          <div className="flex items-center justify-between gap-3">
                            <p
                              className={`text-xs font-semibold uppercase tracking-[0.18em] ${faint}`}
                            >
                              Selected plan
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${selectedPlan.recommended ? 'bg-indigo-500/10 text-indigo-500' : isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-white text-zinc-600 ring-1 ring-zinc-200'}`}
                            >
                              {selectedPlan.recommended ? 'Recommended' : selectedPlan.eyebrow}
                            </span>
                          </div>

                          <h3 className={`mt-4 text-4xl font-semibold tracking-[-0.05em] ${title}`}>
                            {selectedPlan.name}
                          </h3>
                          <p className={`mt-3 text-sm leading-6 ${muted}`}>
                            {selectedPlan.description}
                          </p>

                          <div
                            className={`mt-6 rounded-[1.35rem] border p-4 shadow-sm ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-white'}`}
                          >
                            <div className="flex items-end justify-between">
                              <div>
                                <span className={`text-sm font-medium ${muted}`}>Today</span>
                                <p className={`mt-1 text-xs ${faint}`}>One payment. No renewal.</p>
                              </div>
                              <span
                                className={`text-4xl font-semibold tracking-[-0.05em] ${title}`}
                              >
                                {prices[selectedPaddleId]?.total || selectedPlan.fallbackPrice}
                              </span>
                            </div>
                            <div
                              className={`mt-4 grid grid-cols-2 gap-2 border-t pt-4 ${isDarkMode ? 'border-white/10' : 'border-zinc-100'}`}
                            >
                              <div>
                                <p className={`text-[11px] uppercase tracking-[0.14em] ${faint}`}>
                                  Credits
                                </p>
                                <p className={`mt-1 text-sm font-semibold ${title}`}>
                                  {selectedPlan.credits} scans
                                </p>
                              </div>
                              <div>
                                <p className={`text-[11px] uppercase tracking-[0.14em] ${faint}`}>
                                  Delivery
                                </p>
                                <p className={`mt-1 text-sm font-semibold ${title}`}>Instant</p>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`mt-5 rounded-[1.35rem] border p-4 ${isDarkMode ? 'border-emerald-500/15 bg-emerald-500/[0.04]' : 'border-emerald-100 bg-emerald-50/70'}`}
                          >
                            <div className="flex gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${title}`}>
                                  Why this is worth it
                                </p>
                                <p className={`mt-1 text-xs leading-5 ${muted}`}>
                                  Compare scans, understand what actually changed, and leave with
                                  clear priorities instead of guessing from photos.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p
                            className={`mt-6 text-xs font-semibold uppercase tracking-[0.16em] ${faint}`}
                          >
                            Included
                          </p>
                        </div>

                        <ul className="relative mt-4 space-y-3">
                          {selectedPlan.features.map((feature) => (
                            <li key={feature} className={`flex gap-2.5 text-sm ${muted}`}>
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={closeCheckout}
                          className={`relative mt-7 w-full rounded-full border px-4 py-3 text-sm font-semibold transition-colors ${isDarkMode ? 'border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white' : 'border-zinc-200 text-zinc-700 hover:bg-white hover:text-zinc-950'}`}
                        >
                          Change plan
                        </button>
                      </aside>

                      <div className="p-3 sm:p-5">
                        {checkoutError && (
                          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                            {checkoutError}
                          </div>
                        )}
                        <InlineCheckout
                          clientToken={clientToken}
                          environment={environment}
                          theme={isDarkMode ? 'dark' : 'light'}
                          items={[{ priceId: selectedPaddleId, quantity: 1 }]}
                          summaryPosition="bottom"
                          successUrl={`${window.location.origin}/pricing?checkout=success`}
                          customer={user?.email ? { email: user.email } : undefined}
                          customData={{
                            userId: user?.uid || '',
                            planId: selectedPlan.id,
                            credits: selectedPlan.credits
                          }}
                          policyUrl="/refund"
                          policyLabel="Refund policy"
                          onComplete={handleComplete}
                          onError={(error) => setCheckoutError(error.message)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
