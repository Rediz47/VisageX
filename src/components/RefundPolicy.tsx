import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function RefundPolicy({ onBack, isDarkMode }: { onBack: () => void; isDarkMode: boolean }) {
  return (
    <div
      className={`min-h-screen pt-24 pb-20 px-6 lg:px-8 max-w-4xl mx-auto ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
    >
      <button
        onClick={onBack}
        className={`flex items-center gap-2 mb-12 transition-colors ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
      </button>

      <div className="mb-12">
        <h1
          className={cn(
            'text-4xl md:text-6xl font-display italic tracking-tight mb-4',
            isDarkMode ? 'text-white' : 'text-zinc-900'
          )}
        >
          Refund <span className="text-indigo-500">Policy</span>
        </h1>
        <p className={cn('text-lg font-light', isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}>
          Last updated: April 2026. Our policy on refunds, credits, and cancellations.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            1. Credit-Based System
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            VisageX operates on a credit-based system. Credits are purchased in advance and consumed
            when you use our AI-powered analysis features such as Neural Scan and Celebrity
            Lookalike. Each analysis costs one credit.
          </p>
        </section>

        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            2. Automatic Refunds
          </h2>
          <div className="space-y-4">
            <div
              className={cn(
                'p-6 rounded-2xl border',
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
              )}
            >
              <h4 className={cn('font-bold mb-2', isDarkMode ? 'text-white' : 'text-zinc-900')}>
                Failed Analyses
              </h4>
              <p className={cn('text-sm', isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                If an AI analysis fails due to a system error after your credit has been deducted,
                the credit is automatically refunded to your account. No action is required on your
                part.
              </p>
            </div>
            <div
              className={cn(
                'p-6 rounded-2xl border',
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
              )}
            >
              <h4 className={cn('font-bold mb-2', isDarkMode ? 'text-white' : 'text-zinc-900')}>
                Cached Results
              </h4>
              <p className={cn('text-sm', isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                If you submit the same image for analysis and a cached result is returned, the
                credit is automatically refunded since no new AI processing was performed.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            3. Purchase Refunds
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            If you are unsatisfied with your credit purchase, you may request a refund within{' '}
            <strong>7 days</strong> of the purchase date, provided that fewer than 25% of the
            purchased credits have been consumed. Refund requests are processed via PayPal to the
            original payment method.
          </p>
        </section>

        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            4. Non-Refundable Cases
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            The following are not eligible for refunds:
          </p>
          <ul
            className={cn(
              'list-disc pl-6 space-y-2 text-sm md:text-base leading-relaxed',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            <li>Credits that have already been successfully consumed for analyses</li>
            <li>Bonus credits received through referrals or promotions</li>
            <li>Accounts that have been suspended or banned for policy violations</li>
            <li>Purchase requests made more than 7 days after the transaction date</li>
          </ul>
        </section>

        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            5. How to Request a Refund
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            To request a refund, email us at{' '}
            <a
              href="mailto:support@visagex.online"
              className="text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              support@visagex.online
            </a>{' '}
            with your account email and the PayPal transaction ID. We aim to process all refund
            requests within 3-5 business days.
          </p>
        </section>

        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            6. Changes to This Policy
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            VisageX reserves the right to modify this refund policy at any time. Any changes will be
            posted on this page with an updated revision date. Continued use of the service after
            changes constitutes acceptance of the revised policy.
          </p>
        </section>
      </div>
    </div>
  );
}
