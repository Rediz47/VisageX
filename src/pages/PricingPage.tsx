import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Star,
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
  fallbackPrice: string;
  credits: number;
  description: string;
  cta: string;
  badge?: string;
  note?: string;
  kicker?: string;
  trustLine?: string;
  accent: 'slate' | 'indigo' | 'cyan' | 'amber';
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'price_single',
    name: '1 Scan',
    fallbackPrice: '$1.49',
    credits: 1,
    description: 'Try VisageX once and get your first full report.',
    cta: 'Buy 1 Scan',
    kicker: 'Good for first-time users',
    trustLine: 'Lowest commitment',
    accent: 'slate'
  },
  {
    id: 'price_basic',
    name: '5 Scans',
    fallbackPrice: '$4.99',
    credits: 5,
    description: 'Best for most people. Track changes over time.',
    cta: 'Buy 5 Scans',
    badge: 'Most popular',
    kicker: 'Best value for most buyers',
    trustLine: 'Most people start here',
    accent: 'indigo',
    recommended: true
  },
  {
    id: 'price_pro',
    name: '15 Scans',
    fallbackPrice: '$12.99',
    credits: 15,
    description: 'For serious progress tracking and before/after testing.',
    cta: 'Buy 15 Scans',
    note: '$0.87 per scan',
    kicker: 'Built for longer tracking',
    trustLine: 'Best for a full routine cycle',
    accent: 'cyan'
  },
  {
    id: 'price_elite',
    name: '50 Scans',
    fallbackPrice: '$29.99',
    credits: 50,
    description: 'Best for creators, coaches, and heavy use.',
    cta: 'Buy 50 Scans',
    note: '$0.60 per scan',
    kicker: 'Best for bulk use',
    trustLine: 'Highest savings per scan',
    accent: 'amber'
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
        setCheckoutError('Please sign in before checkout so your credits go to your account.');
        return;
      }

      if (!clientToken) {
        setCheckoutError('Paddle checkout is not configured.');
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
        setCheckoutError('Payment completed, but the transaction could not be verified.');
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
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Payment completed, but credits could not be added automatically.';
        setCheckoutError(message);
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
    if (creditsApplied) fireConfetti();
  }, [creditsApplied]);

  useEffect(() => {
    if (!selectedPlan) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedPlan]);

  const pageBg = isDarkMode
    ? 'bg-[#0b0b0c] text-white'
    : 'bg-[linear-gradient(180deg,#fafafe_0%,#f4f4f7_100%)] text-zinc-950';
  const card = isDarkMode
    ? 'border-white/10 bg-[#151517]'
    : 'border-zinc-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]';
  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';
  const faint = isDarkMode ? 'text-zinc-500' : 'text-zinc-500';
  const title = isDarkMode ? 'text-white' : 'text-zinc-950';
  const featuredCard = isDarkMode
    ? 'border-violet-400/30 bg-gradient-to-b from-violet-600 to-purple-800 text-white shadow-[0_24px_80px_rgba(124,58,237,0.35)]'
    : 'border-violet-500 bg-gradient-to-b from-violet-600 to-purple-800 text-white shadow-[0_24px_80px_rgba(124,58,237,0.32)]';
  const normalCard = isDarkMode
    ? 'border-white/8 bg-[#171719] text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)]'
    : 'border-zinc-200 bg-[#171719] text-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]';

  return (
    <>
      <Helmet>
        <title>Pricing - VisageX</title>
        <meta
          name="description"
          content="Buy one-time VisageX scan credits and start your face analysis instantly."
        />
      </Helmet>

      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/')}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] ${card}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${card}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className={muted}>Credits</span>
              <span className={title}>{credits}</span>
            </div>
          </div>

          <section className="mx-auto max-w-3xl pt-14 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: easeOut }}
            >
              <div
                className={`mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${
                  isDarkMode
                    ? 'border-indigo-400/20 bg-indigo-400/8 text-indigo-100'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                }`}
              >
                No subscription
              </div>

              <h1
                className={`mt-6 font-display text-5xl font-black tracking-[-0.06em] sm:text-6xl ${title}`}
              >
                Buy scans.
                <span className="block">Get results instantly.</span>
              </h1>

              <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 ${muted}`}>
                Simple one-time pricing for face analysis. The more scans you buy, the easier it is
                to track real progress.
              </p>

              {!user && (
                <p className="mt-4 text-sm font-semibold text-amber-500 dark:text-amber-400">
                  Sign in first so your credits are added to your account.
                </p>
              )}
            </motion.div>
          </section>

          {checkoutError && !selectedPlan && (
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-400">
              {checkoutError}
            </div>
          )}

          <section className="mt-14">
            <div className="grid gap-5 lg:grid-cols-4">
              {PLANS.map((plan, index) => {
                const paddleId = PADDLE_PRICE_IDS[plan.id];
                const price = paddleId ? prices[paddleId]?.total : undefined;
                const isFeatured = Boolean(plan.recommended);
                const cardTheme = isFeatured ? featuredCard : normalCard;

                return (
                  <motion.article
                    key={plan.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05, ease: easeOut }}
                    whileHover={{ y: -6 }}
                    className={`relative flex h-full min-h-[430px] flex-col rounded-xl border p-5 transition-transform ${cardTheme}`}
                  >
                    {isFeatured && (
                      <div className="pointer-events-none absolute right-5 top-4 h-10 w-16 rounded-full border-t border-white/60 opacity-80 rotate-12" />
                    )}
                    <div className="flex min-h-[1.75rem] items-start justify-between gap-3">
                      <p className="text-xs font-medium text-zinc-300">{plan.name}</p>
                      {plan.badge && (
                        <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-violet-700 shadow-sm">
                          Popular
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-end gap-1">
                      {pricesLoading && !price ? (
                        <div className="h-10 w-24 animate-pulse rounded-xl bg-white/10" />
                      ) : (
                        <span className="text-4xl font-semibold tracking-[-0.05em] text-white">
                          {price || plan.fallbackPrice}
                        </span>
                      )}
                      <span className="pb-1 text-xs font-medium text-zinc-300">/ scan</span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-300">{plan.description}</p>

                    <div className="my-5 h-px bg-white/10" />

                    {plan.kicker && (
                      <p className="mb-4 text-xs font-semibold text-zinc-200">{plan.kicker}</p>
                    )}

                    <ul className="space-y-2.5">
                      {[
                        `${plan.credits} face scan${plan.credits > 1 ? 's' : ''}`,
                        plan.note || plan.trustLine || 'Instant full report',
                        'AI face attractiveness report',
                        'Symmetry and feature insights',
                        'Private results',
                        'Discord community support'
                      ].map((feature) => (
                        <li
                          key={feature}
                          className={`flex items-center gap-2 text-xs text-zinc-100 ${isFeatured ? 'font-semibold' : ''}`}
                        >
                          <Check className="h-3.5 w-3.5 shrink-0 rounded-sm bg-white text-zinc-950 p-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => openCheckout(plan)}
                      className={`mt-auto flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-xs font-medium transition-all hover:-translate-y-0.5 ${
                        isFeatured
                          ? 'border-white bg-white text-zinc-950 hover:bg-zinc-100'
                          : 'border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10'
                      }`}
                    >
                      <span>Get Started</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <section className={`mt-14 rounded-[2rem] border p-6 sm:p-8 ${card}`}>
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className={`text-2xl font-black tracking-[-0.04em] ${title}`}>
                  Why people buy more than one scan
                </h3>
                <div className="mt-5 space-y-4">
                  {[
                    'Track whether your haircut, skincare, or weight-loss changes are working',
                    'Compare results over time instead of guessing from photos',
                    'Get the same premium analysis every time you scan'
                  ].map((item) => (
                    <div key={item} className={`flex items-start gap-3 text-sm leading-6 ${muted}`}>
                      <Check className="mt-1 h-4 w-4 shrink-0 text-indigo-500 dark:text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Secure checkout',
                    text: 'Paddle handles payment and tax inside checkout.',
                    icon: ShieldCheck
                  },
                  {
                    title: 'No subscription',
                    text: 'One payment. No renewal. No surprise charges.',
                    icon: LockKeyhole
                  },
                  {
                    title: 'Instant delivery',
                    text: 'Credits go straight to your account after purchase.',
                    icon: Sparkles
                  },
                  {
                    title: 'Easy to use',
                    text: 'Buy credits, scan, and get your report in minutes.',
                    icon: Star
                  }
                ].map((item) => (
                  <div key={item.title} className={`rounded-2xl border p-5 ${card}`}>
                    <item.icon className="h-5 w-5 text-indigo-500 dark:text-amber-400" />
                    <p className={`mt-3 text-sm font-bold ${title}`}>{item.title}</p>
                    <p className={`mt-2 text-sm leading-6 ${muted}`}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className={`mx-auto mt-10 text-center text-xs font-semibold ${faint}`}>
            Need custom or enterprise pricing?{' '}
            <a
              href="mailto:support@visagex.online"
              className="text-indigo-500 underline transition-colors hover:text-indigo-400"
            >
              Contact support
            </a>
          </div>
        </div>

        <AnimatePresence>
          {selectedPlan && selectedPaddleId && clientToken && (
            <motion.div
              className="checkout-scrollbar fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto px-3 pb-6 pt-3 sm:px-5 sm:pt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                aria-label="Close checkout"
                onClick={closeCheckout}
                className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
              />

              <motion.section
                initial={{ opacity: 0, y: 22, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.99 }}
                transition={{ duration: 0.4, ease: easeOut }}
                className={`checkout-scrollbar relative z-10 mx-auto max-h-[calc(100vh-1.5rem)] w-full max-w-[1180px] overflow-y-auto rounded-[1.75rem] border ${card}`}
              >
                <div
                  className={`sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4 backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-[#0a0a0c]/90' : 'border-zinc-200 bg-white/90'}`}
                >
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${faint}`}>
                      Checkout
                    </p>
                    <h2 className={`mt-1 text-lg font-black ${title}`}>
                      {selectedPlan.name} - {selectedPlan.credits} credits
                    </h2>
                  </div>
                  <button
                    onClick={closeCheckout}
                    className={`rounded-full p-2 ${isDarkMode ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {checkoutComplete ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                        {creditsApplied ? (
                          <Check className="h-7 w-7" />
                        ) : (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                      </div>
                      <h3 className={`text-3xl font-black tracking-[-0.04em] ${title}`}>
                        {creditsApplied ? 'Credits added' : 'Payment received'}
                      </h3>
                      <p className={`mx-auto mt-3 max-w-md text-sm leading-6 ${muted}`}>
                        {creditsApplied
                          ? `Your balance is now ${credits} credits.`
                          : checkoutError ||
                            'We are waiting for payment confirmation to finish adding your credits.'}
                      </p>
                      <button onClick={() => navigate('/')} className="btn-primary mt-8">
                        Start analysis
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="checkout"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]"
                    >
                      <aside
                        className={`relative overflow-hidden border-b p-6 lg:border-b-0 lg:border-r lg:p-7 ${isDarkMode ? 'border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.015]' : 'border-zinc-200 bg-zinc-50/70'}`}
                      >
                        <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 right-0 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />
                        <div className="relative">
                          <p
                            className={`text-[11px] font-bold uppercase tracking-[0.16em] ${faint}`}
                          >
                            Order summary
                          </p>
                          <h3 className={`mt-3 text-3xl font-black ${title}`}>
                            {selectedPlan.name}
                          </h3>
                          <p className={`mt-3 text-sm leading-6 ${muted}`}>
                            {selectedPlan.description}
                          </p>

                          <div className={`mt-6 rounded-2xl border p-4 ${card}`}>
                            <div className="flex items-center justify-between text-sm">
                              <span className={muted}>Price</span>
                              <span className={`font-bold ${title}`}>
                                {prices[selectedPaddleId]?.total || selectedPlan.fallbackPrice}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm">
                              <span className={muted}>Credits</span>
                              <span className={`font-bold ${title}`}>{selectedPlan.credits}</span>
                            </div>
                          </div>

                          <div className={`mt-5 rounded-2xl border p-4 ${card}`}>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${title}`}>
                                  Instant glow-up credits
                                </p>
                                <p className={`mt-1 text-xs leading-5 ${muted}`}>
                                  Your scans unlock right after Paddle confirms the payment.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 space-y-3">
                            {[
                              'One-time payment',
                              'Private analysis',
                              'Saved to your account',
                              'Secure Paddle checkout'
                            ].map((item) => (
                              <div
                                key={item}
                                className={`flex items-center gap-2 text-sm ${muted}`}
                              >
                                <Check className="h-4 w-4 text-emerald-400" />
                                {item}
                              </div>
                            ))}
                          </div>

                          {checkoutError && (
                            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                              {checkoutError}
                            </div>
                          )}
                        </div>
                      </aside>

                      <div className="min-w-0 p-3 sm:p-5 lg:p-7">
                        <InlineCheckout
                          clientToken={clientToken}
                          environment={environment}
                          theme="light"
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
                          className="checkout-paddle-frame"
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
