import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Search, Brain, CheckCircle, Shield, Zap, Star } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogFreeAIFacePage() {
  const { isDarkMode } = useTheme();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const Card = ({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) => (
    <div className={`p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-white/[0.07]' : 'bg-white border-zinc-200 shadow-xl hover:shadow-2xl'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 bg-${color}-500/20 text-${color}-400`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className={`text-xl font-display font-bold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
      <div className={`space-y-3 text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
        {children}
      </div>
    </div>
  );

  const tools = [
    { name: 'VisageX', free: true, landmarks: '468', skin: true, gemini: true, verdict: 'Best overall' },
    { name: 'Generic "Face Rating" apps', free: false, landmarks: '~30', skin: false, gemini: false, verdict: 'Shallow' },
    { name: 'Photofeeler', free: false, landmarks: 'Human votes', skin: false, gemini: false, verdict: 'Subjective' },
    { name: 'FaceApp', free: false, landmarks: 'Filter-based', skin: false, gemini: false, verdict: 'Entertainment only' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <SEO
        title="Free AI Face Analysis — What Actually Works in 2026 | VisageX"
        description="Looking for a free AI face analysis? We break down what these tools actually measure, which ones are worth using, and how to get a clinical-grade result for free."
        canonical="https://visagex.online/blog/free-ai-face-analysis"
      />

      <article className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-16"
        >
          {/* Header */}
          <header className="text-center max-w-3xl mx-auto space-y-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 bg-indigo-50'}`}>
              <Search className="w-4 h-4" />
              Tool Review
            </div>
            <h1 className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Free AI Face Analysis
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                What Actually Works
              </span>
            </h1>
            <p className={`text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Not all "AI face rating" tools are equal. Most are just random number generators. Here's what clinical-grade analysis actually looks like — and how to get it free.
            </p>
            <div className={`inline-flex items-center gap-2 text-xs font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span>6 min read</span>
              <span>·</span>
              <span>Updated March 2026</span>
            </div>
          </header>

          {/* Hero callout */}
          <div className={`p-8 md:p-12 rounded-[3rem] border text-center ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              <strong>TL;DR:</strong> Real AI face analysis uses <strong>468+ facial landmark points</strong>, measures geometric ratios (golden ratio, facial thirds, canthal tilt), and adds a dermatology-grade skin assessment. Anything doing less is guessing. <Link to="/" className="text-indigo-500 font-bold hover:underline">VisageX does this for free.</Link>
            </p>
          </div>

          {/* What it measures */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className={`text-3xl md:text-4xl font-display font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                What Real AI Face Analysis Actually Measures
              </h2>
              <p className={`text-lg font-light max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                The difference between a real tool and a fake one comes down to what's being computed.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card icon={Brain} title="Facial Landmark Detection" color="indigo">
                <p>A proper tool uses a MediaPipe or similar neural network to map 468 distinct points across your face — eyes, nose, jaw, cheekbones, forehead. This mesh becomes the foundation for every score.</p>
                <p className="font-medium">Tools with fewer than 100 landmarks are not doing real analysis.</p>
              </Card>
              <Card icon={Sparkles} title="Geometric Ratio Scoring" color="violet">
                <p>Using the landmark mesh, the AI calculates: facial thirds (forehead:nose:chin ratios), the golden ratio (1.618:1 facial proportions), canthal tilt, facial width-to-height ratio (fWHR), and jaw angle.</p>
              </Card>
              <Card icon={Shield} title="Skin Quality Assessment" color="emerald">
                <p>A real dermatology-grade AI analyzes acne presence, skin texture uniformity, pore visibility, dark circles severity, redness, oiliness, and wrinkle depth using computer vision models.</p>
              </Card>
              <Card icon={Zap} title="Potential & Personalization" color="amber">
                <p>Beyond a raw score, legitimate tools identify your face shape, color season, specific visual strengths and weaknesses, and generate a personalized improvement roadmap. Generic tools give you none of this.</p>
              </Card>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="space-y-6">
            <h2 className={`text-3xl font-display font-bold text-center ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Free AI Face Analysis Tools Compared (2026)
            </h2>
            <div className={`rounded-[2.5rem] border overflow-hidden ${isDarkMode ? 'border-white/10' : 'border-zinc-200 shadow-xl'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-left ${isDarkMode ? 'bg-white/5 text-zinc-400' : 'bg-zinc-50 text-zinc-500'}`}>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Tool</th>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Free</th>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Landmarks</th>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Skin AI</th>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((t, i) => (
                    <tr key={i} className={`border-t ${isDarkMode ? 'border-white/5' : 'border-zinc-100'} ${i === 0 ? (isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-50/50') : ''}`}>
                      <td className={`px-6 py-5 font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {t.name}
                        {i === 0 && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">This article</span>}
                      </td>
                      <td className="px-6 py-5">
                        {t.free ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Paid/limited</span>}
                      </td>
                      <td className={`px-6 py-5 font-mono text-xs ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.landmarks}</td>
                      <td className="px-6 py-5">
                        {t.skin ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>No</span>}
                      </td>
                      <td className={`px-6 py-5 text-xs font-bold ${i === 0 ? 'text-indigo-400' : (isDarkMode ? 'text-zinc-500' : 'text-zinc-400')}`}>{t.verdict}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className={`p-10 md:p-14 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-zinc-200'}`}>
            <h2 className={`text-3xl md:text-4xl font-display mb-10 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Frequently Asked Questions</h2>
            <div className="space-y-8">
              {[
                {
                  q: 'Is free AI face analysis accurate?',
                  a: 'It depends entirely on the tool. A system using 468 MediaPipe landmarks plus a Gemini Vision model for skin analysis is genuinely accurate — comparable to what aesthetic clinics use for initial consultations. Simple "rate my face" apps with static overlays are not.',
                },
                {
                  q: 'Does AI face analysis work for all ethnicities?',
                  a: 'Tools trained on diverse datasets work for all skin tones. Geometric ratios (symmetry, facial thirds) are universal measurements that don\'t depend on ethnicity. Be skeptical of tools that seem to score certain features lower without explanation.',
                },
                {
                  q: 'What photo gives the best results?',
                  a: 'A front-facing selfie in neutral expression, good even lighting (no harsh shadows), hair pulled back from the face, and camera at eye level. Avoid ring-light halos which can flatten facial depth in the AI analysis.',
                },
                {
                  q: '"Face rating AI free" — what score should I expect?',
                  a: 'Average population scores cluster between 5.5 and 7.5 on a 10-point scale. A 7+ is genuinely above average. Don\'t obsess over the absolute number — the breakdown (which specific features to improve) is far more actionable.',
                },
              ].map((faq, i) => (
                <div key={i} className={`pb-8 border-b last:border-0 last:pb-0 ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}>
                  <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{faq.q}</h3>
                  <p className={`leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mt-8 p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-indigo-900/40 to-black border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}
          >
            <div className={`absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-100 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent' : ''}`} />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <h2 className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Try the free AI face analysis now
              </h2>
              <p className={`text-lg font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                468 landmark geometry + AI skin assessment. No signup required to start.
              </p>
              <div className="pt-4 flex justify-center">
                <Link
                  to="/"
                  className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-indigo-400 hover:text-white shadow-white/10' : 'bg-zinc-900 text-white hover:bg-black shadow-black/20'}`}
                >
                  Analyze My Face Free <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </article>
    </div>
  );
}
