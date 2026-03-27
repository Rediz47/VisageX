import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GlowUpCoachProps {
  result: any;
  isDarkMode: boolean;
}

export function GlowUpCoach({ result, isDarkMode }: GlowUpCoachProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your Visage AI Glow-up Coach. I've analyzed your scan (Score: ${result.overallScore}/10). You have great ${result.analysis.strengths[0] || 'features'}! How can I help you reach your potential?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/glow-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          context: {
            overallScore: result.overallScore,
            faceShape: result.visionAnalysis?.faceShape || 'Unknown',
            strengths: result.analysis.strengths.join(', '),
            weaknesses: result.analysis.weaknesses.join(', '),
            potentialScore: result.visionAnalysis?.potentialScore?.toFixed(1) || 'N/A',
            improvements: result.visionAnalysis?.improvements?.map((i: any) => i.action).join(', ')
          }
        })
      });

      if (!response.ok) throw new Error("Coach failed to respond.");
      const data = await response.json();

      const aiText = data.response || "I'm sorry, I couldn't process that. Could you try rephrasing?";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error("Coach Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a bit of trouble connecting to my neural network. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-8 right-8 z-[60] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-colors",
          isDarkMode ? "bg-white text-black" : "bg-zinc-900 text-white"
        )}
      >
        <MessageSquare className="w-7 h-7" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center"
        >
          <Sparkles className="w-3 h-3 text-white" />
        </motion.div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={cn(
              "fixed bottom-28 right-8 z-[60] w-[90vw] md:w-[400px] h-[600px] max-h-[70vh] rounded-[2.5rem] shadow-2xl border flex flex-col overflow-hidden",
              isDarkMode ? "bg-zinc-900 border-white/10" : "bg-white border-zinc-200"
            )}
          >
            {/* Header */}
            <div className={cn(
              "p-6 border-b flex items-center justify-between",
              isDarkMode ? "bg-black/40 border-white/5" : "bg-zinc-50 border-zinc-100"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={cn("font-display font-bold text-lg", isDarkMode ? "text-white" : "text-zinc-900")}>Glow-up Coach</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">AI Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={cn("p-2 rounded-xl transition-colors", isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5")}
              >
                <X className="w-5 h-5 opacity-50" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === 'user'
                      ? (isDarkMode ? "bg-white/10" : "bg-zinc-100")
                      : "bg-gradient-to-br from-indigo-500 to-rose-500"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user'
                      ? (isDarkMode ? "bg-white/5 text-zinc-100" : "bg-zinc-100 text-zinc-900")
                      : (isDarkMode ? "bg-zinc-800 text-zinc-100" : "bg-zinc-50 text-zinc-900")
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl flex items-center gap-2",
                    isDarkMode ? "bg-zinc-800" : "bg-zinc-50"
                  )}>
                    <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                    <span className="text-xs opacity-50 italic">Coach is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={cn(
              "p-6 border-t",
              isDarkMode ? "bg-black/40 border-white/5" : "bg-white border-zinc-100"
            )}>
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your results..."
                  className={cn(
                    "w-full pl-6 pr-14 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all",
                    isDarkMode
                      ? "bg-white/5 border-white/10 text-white focus:ring-white/20"
                      : "bg-zinc-100 border-zinc-200 text-zinc-900 focus:ring-zinc-900/10"
                  )}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all",
                    input.trim() && !isLoading
                      ? (isDarkMode ? "bg-white text-black" : "bg-zinc-900 text-white")
                      : "opacity-30 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["How to fix asymmetry?", "Best haircut?", "Skin routine?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors",
                      isDarkMode ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
