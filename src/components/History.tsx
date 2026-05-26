import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Star,
  AlertCircle,
  TrendingUp,
  Columns,
  X
} from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { cn } from '../lib/utils';

interface HistoryProps {
  onBack: () => void;
  isDarkMode: boolean;
  onSelectScan: (result: any, imageUrl: string) => void;
}

/* ── Interactive Before/After Split Slider ── */
function ImageSlider({
  beforeUrl,
  afterUrl,
  label1,
  label2,
  isDarkMode
}: {
  beforeUrl: string;
  afterUrl: string;
  label1: string;
  label2: string;
  isDarkMode: boolean;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      className={cn(
        'relative aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden select-none cursor-ew-resize border shadow-2xl',
        isDarkMode ? 'border-white/10 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'
      )}
    >
      {/* Before Image (Left Base) */}
      <img
        src={beforeUrl}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute top-5 left-5 z-20 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white">
        {label1}
      </div>

      {/* After Image (Right Clipped Overlay) */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
      >
        <img src={afterUrl} alt="After" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-5 right-5 z-20 bg-indigo-500/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white">
        {label2}
      </div>

      {/* Slider Split Line */}
      <div
        className="absolute inset-y-0 w-1 bg-white/80 cursor-ew-resize flex items-center justify-center shadow-xl z-20"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="w-9 h-9 rounded-full bg-white shadow-2xl flex items-center justify-center border-2 border-indigo-500 text-indigo-500 hover:scale-110 active:scale-95 transition-transform">
          <Columns className="w-4.5 h-4.5 rotate-90" />
        </div>
      </div>
    </div>
  );
}

export function History({ onBack, isDarkMode, onSelectScan }: HistoryProps) {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!auth.currentUser) {
        setError('You must be logged in to view history.');
        setLoading(false);
        return;
      }

      try {
        // Cap at 30 most recent scans — full history fetch burns Firestore reads
        // and users rarely scroll past the first page.
        const q = query(
          collection(db, 'scans'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(30)
        );

        const querySnapshot = await getDocs(q);
        const fetchedScans = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setScans(fetchedScans);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Failed to load history. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const toggleComparison = (scan: any) => {
    if (selectedForComparison.find((s) => s.id === scan.id)) {
      setSelectedForComparison((prev) => prev.filter((s) => s.id !== scan.id));
    } else {
      if (selectedForComparison.length < 2) {
        setSelectedForComparison((prev) => [...prev, scan]);
      } else {
        setSelectedForComparison([selectedForComparison[1], scan]);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date =
      dateString && typeof (dateString as any).toDate === 'function'
        ? (dateString as any).toDate()
        : new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const chartData = [...scans].reverse().map((scan) => ({
    date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
      scan.createdAt && typeof scan.createdAt.toDate === 'function'
        ? scan.createdAt.toDate()
        : new Date(scan.createdAt)
    ),
    score: Number(scan.overallScore.toFixed(1)),
    fullDate: formatDate(scan.createdAt)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-4 rounded-xl border shadow-xl ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
        >
          <p className="text-sm font-medium mb-1 opacity-70">{payload[0].payload.fullDate}</p>
          <p className="text-2xl font-display font-bold text-cyan-400">
            {payload[0].value} <span className="text-sm font-normal opacity-50">/ 10</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isComparing && selectedForComparison.length === 2) {
    const [scan1, scan2] = selectedForComparison;
    const data1 = JSON.parse(scan1.analysisData);
    const data2 = JSON.parse(scan2.analysisData);
    const scoreDiff = scan2.overallScore - scan1.overallScore;

    return (
      <div
        className={`min-h-screen pt-12 pb-20 px-6 lg:px-8 max-w-[1600px] mx-auto ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
      >
        <button
          onClick={() => setIsComparing(false)}
          className={`flex items-center gap-2 mb-12 transition-colors ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-widest">Back to History</span>
        </button>

        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-display italic tracking-tight mb-4">
            Glow-Up{' '}
            <span className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Comparison
            </span>
          </h1>
          <p className={`text-lg font-light ${isDarkMode ? 'text-white/50' : 'text-zinc-500'}`}>
            Analyze your progress between {formatDate(scan1.createdAt)} and{' '}
            {formatDate(scan2.createdAt)}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Interactive Image Slider (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className={`p-1.5 rounded-[2.85rem] border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-zinc-50/50 border-zinc-100'}`}
            >
              <ImageSlider
                beforeUrl={scan1.imageUrl}
                afterUrl={scan2.imageUrl}
                label1={`BEFORE: ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(scan1.createdAt))}`}
                label2={`AFTER: ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(scan2.createdAt))}`}
                isDarkMode={isDarkMode}
              />
            </div>
            <p className="text-center text-xs opacity-40 font-medium tracking-wide">
              Drag or hover slider to compare facial alignment and features
            </p>
          </div>

          {/* Right Column: Comparative Metrics Sheet (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overall Score Progress Banner */}
            <div
              className={`p-8 rounded-[2.5rem] border relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-indigo-950/20 via-black/40 to-black border-white/10'
                  : 'bg-gradient-to-r from-indigo-50/30 to-white border-zinc-200 shadow-sm'
              }`}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1.5 opacity-40">
                  Glow-Up Trajectory
                </p>
                <h3 className="text-2xl font-display font-bold mb-1">
                  {scoreDiff > 0 ? 'Improvement Detected' : 'Consistency Lock'}
                </h3>
                <p className="text-sm opacity-50 font-light max-w-sm">
                  {scoreDiff > 0
                    ? `Excellent progress! You have increased your facial harmony score by ${scoreDiff.toFixed(1)} points.`
                    : 'Your facial structural measurements remain consistently locked. Focus on your roadmap to increase features.'}
                </p>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-0.5">
                    Initial
                  </p>
                  <span className="text-3xl font-black">{scan1.overallScore.toFixed(1)}</span>
                </div>
                <div className="text-indigo-400 font-bold text-lg">➔</div>
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-0.5">
                    Latest
                  </p>
                  <span className="text-3xl font-black text-cyan-400">
                    {scan2.overallScore.toFixed(1)}
                  </span>
                </div>
                {scoreDiff > 0 && (
                  <div className="ml-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-black tracking-tight flex items-center gap-0.5">
                    +{scoreDiff.toFixed(1)}
                  </div>
                )}
              </div>
            </div>

            {/* Side-by-Side Breakdown Cards */}
            <div
              className={`p-8 rounded-[2.5rem] border space-y-6 ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}
            >
              <h4 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40 mb-2">
                Biometric Ratios Breakdown
              </h4>

              <div className="space-y-6">
                {Object.entries(data1.breakdown).map(([key, value1]: [string, any]) => {
                  const value2 = data2.breakdown[key] || 0;
                  const diff = value2 - value1;

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-baseline text-sm">
                        <span className="font-semibold">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="opacity-40 font-mono text-xs">{value1.toFixed(1)}</span>
                          <span className="opacity-20 text-xs">➔</span>
                          <span className="font-black text-cyan-400 font-mono text-xs">
                            {value2.toFixed(1)}
                          </span>
                          {diff !== 0 && (
                            <span
                              className={`text-[10px] font-black ml-1.5 ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                            >
                              {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Overlapping progress track */}
                      <div
                        className={`w-full h-2 rounded-full relative overflow-hidden ${isDarkMode ? 'bg-white/[0.04]' : 'bg-zinc-100'}`}
                      >
                        {/* Before line */}
                        <div
                          className="absolute inset-y-0 left-0 bg-zinc-500/40 rounded-full"
                          style={{ width: `${(value1 / 10) * 100}%` }}
                        />
                        {/* After fill line */}
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${diff >= 0 ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' : 'bg-rose-500/50'}`}
                          style={{ width: `${(value2 / 10) * 100}%`, opacity: 0.85 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pt-12 pb-20 px-6 lg:px-8 max-w-[1600px] mx-auto ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 transition-colors ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-widest">Back to Analyzer</span>
        </button>

        {selectedForComparison.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {selectedForComparison.map((scan, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-zinc-800"
                >
                  <img src={scan.imageUrl} alt="Selected" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">
              {selectedForComparison.length}/2 Selected
            </p>
            {selectedForComparison.length === 2 && (
              <button
                onClick={() => setIsComparing(true)}
                className="px-6 py-2.5 rounded-full bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-600 transition-colors flex items-center gap-2"
              >
                <Columns className="w-3.5 h-3.5" />
                Compare Scans
              </button>
            )}
            <button
              onClick={() => setSelectedForComparison([])}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-zinc-100 hover:bg-zinc-200'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-display italic tracking-tight mb-4">
          Glow-Up{' '}
          <span className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            Tracker
          </span>
        </h1>
        <p className={`text-lg font-light ${isDarkMode ? 'text-white/50' : 'text-zinc-500'}`}>
          Review your past analyses and track your looksmaxxing journey over time.
        </p>
      </div>

      {loading ? (
        <div className="space-y-12">
          {/* Skeleton Chart */}
          <div
            className={`w-full h-64 rounded-3xl border animate-pulse ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'}`}
          />

          {/* Skeleton Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`aspect-[4/5] rounded-3xl border animate-pulse ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'}`}
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <div
          className={`p-6 rounded-2xl border flex items-start gap-4 ${isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}
        >
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      ) : scans.length === 0 ? (
        <div
          className={`text-center py-32 border rounded-3xl border-dashed ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}
        >
          <p
            className={`text-xl font-display italic mb-2 ${isDarkMode ? 'text-white/70' : 'text-zinc-900'}`}
          >
            No scans found
          </p>
          <p className={`font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
            Your analysis history will appear here once you complete a scan.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Progress Chart */}
          {scans.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Progress Overview</h2>
                  <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                    Your overall score trajectory
                  </p>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        fontSize: 12
                      }}
                      dy={10}
                    />
                    <YAxis
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        fontSize: 12
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#22d3ee"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* History Grid */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">Past Scans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {scans.map((scan, index) => {
                let parsedData: any = {};
                try {
                  parsedData = JSON.parse(scan.analysisData);
                } catch (e) {
                  console.error('Failed to parse scan data', e);
                }

                const imageUrlToUse =
                  parsedData.historyImage ||
                  (scan.imageUrl === 'base64-stored-in-analysisData' ? undefined : scan.imageUrl) ||
                  scan.imageBase64;

                return (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectScan(parsedData, imageUrlToUse)}
                    className={`group cursor-pointer rounded-3xl border overflow-hidden transition-all duration-500 hover:-translate-y-2 ${isDarkMode ? 'bg-black border-white/5 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-xl'}`}
                  >
                    <div className="aspect-[4/5] relative overflow-hidden bg-black/5">
                      <img
                        src={imageUrlToUse}
                        alt="Scan thumbnail"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Compare Button Overlay */}
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComparison(scan);
                          }}
                          className={cn(
                            'p-2.5 rounded-xl border backdrop-blur-md transition-all',
                            selectedForComparison.find((s) => s.id === scan.id)
                              ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                              : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white'
                          )}
                        >
                          <Columns className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-white/80">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">
                              {formatDate(scan.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-end gap-3">
                          <span className="text-4xl font-display font-bold text-white leading-none">
                            {scan.overallScore.toFixed(1)}
                          </span>
                          <span className="text-white/60 text-sm font-medium mb-1">/ 10</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
