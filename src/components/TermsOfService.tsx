import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function TermsOfService({ onBack, isDarkMode }: { onBack: () => void, isDarkMode: boolean }) {
  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 lg:px-8 max-w-4xl mx-auto ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
      <button 
        onClick={onBack}
        className={`flex items-center gap-2 mb-12 transition-colors ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
      </button>

      <div className="mb-12">
        <h1 className={cn("text-4xl md:text-6xl font-display italic tracking-tight mb-4", isDarkMode ? "text-white" : "text-zinc-900")}>
          Terms of <span className="text-indigo-500">Service</span>
        </h1>
        <p className={cn("text-lg font-light", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
          Last updated: March 2026. Please read these terms carefully before using VisageX.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className={cn("text-2xl font-display font-bold mb-6", isDarkMode ? "text-white" : "text-zinc-900")}>1. Acceptance of Terms</h2>
          <p className={cn("text-sm md:text-base leading-relaxed mb-4", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
            By accessing or using VisageX, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 className={cn("text-2xl font-display font-bold mb-6", isDarkMode ? "text-white" : "text-zinc-900")}>2. Use License</h2>
          <p className={cn("text-sm md:text-base leading-relaxed mb-4", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
            Permission is granted to use VisageX for personal, non-commercial facial analysis. This is the grant of a license, not a transfer of title.
          </p>
        </section>

        <section>
          <h2 className={cn("text-2xl font-display font-bold mb-6", isDarkMode ? "text-white" : "text-zinc-900")}>3. Disclaimer</h2>
          <p className={cn("text-sm md:text-base leading-relaxed mb-4", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
            The analyses provided by VisageX are for informational purposes only. We do not provide medical advice or clinical diagnoses. Always consult with a professional for health-related concerns.
          </p>
        </section>

        <section>
          <h2 className={cn("text-2xl font-display font-bold mb-6", isDarkMode ? "text-white" : "text-zinc-900")}>4. Biometric Data</h2>
          <p className={cn("text-sm md:text-base leading-relaxed mb-4", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
            By using VisageX, you consent to the processing of your biometric data for the purpose of facial analysis as described in our Privacy Policy.
          </p>
        </section>
        <h2 className={`text-xl font-bold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>5. Limitation of Liability</h2>
        <p>VisageX shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
      </div>
    </div>
  );
}
