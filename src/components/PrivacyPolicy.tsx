import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function PrivacyPolicy({ onBack, isDarkMode }: { onBack: () => void; isDarkMode: boolean }) {
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
          Privacy <span className="text-indigo-500">Policy</span>
        </h1>
        <p className={cn('text-lg font-light', isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}>
          Last updated: March 2026. How VisageX Neural Systems protects your biometric data.
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
            1. Our Commitment
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            At VisageX, your privacy is our foundational priority. We specialize in aesthetic
            biometric analysis, and we understand the sensitive nature of facial data.
          </p>
        </section>

        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            2. Data Collection
          </h2>
          <div className="space-y-4">
            <div
              className={cn(
                'p-6 rounded-2xl border',
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
              )}
            >
              <h4 className={cn('font-bold mb-2', isDarkMode ? 'text-white' : 'text-zinc-900')}>
                Biometric Photos
              </h4>
              <p className={cn('text-sm', isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                When you upload a photo to VisageX, it is processed securely using our neural
                networks. We use this data solely to provide you with facial analysis metrics.
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
            3. Local Processing
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            Where possible, analysis is performed in real-time. We do not store your original
            high-resolution photos on our permanent servers unless you explicitly save them to your
            profile history. Even then, they are encrypted at rest.
          </p>
        </section>

        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            4. No Third-Party Sales
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            VisageX will never sell, rent, or trade your biometric data or personal information to
            third-party data brokers or advertisers.
          </p>
        </section>

        <section>
          <h2
            className={cn(
              'text-2xl font-display font-bold mb-6',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            5. Contact Information & Operator
          </h2>
          <p
            className={cn(
              'text-sm md:text-base leading-relaxed mb-4',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            )}
          >
            VisageX is owned and operated by sole proprietor <strong>Luka Chokheli</strong>. For any inquiries 
            regarding our privacy practices, data deletion requests, or biometric concerns, you can contact us at{' '}
            <a
              href="mailto:privacy@visagex.online"
              className="text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              privacy@visagex.online
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
