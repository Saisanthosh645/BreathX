import { useState, useMemo } from 'react';
import {
  CurrentAirQualityData,
  HourlyAirQualityPoint,
  AQIScale,
  LocationInfo,
} from '../types/airQuality';
import { calculateIndAqi, getCategoryForScale } from '../utils/aqiCalculations';
import { formatDateTime } from '../utils/dateUtils';
import { Globe3D } from '../components/Globe3D';
import { MiniMap } from '../components/MiniMap';
import { DemoModal } from '../components/DemoModal';
import { soundFx } from '../utils/audioFx';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Leaf,
  Play,
  ArrowRight,
  Heart,
  ShieldCheck,
  Sun,
  Droplets,
  Wind,
  Sparkles,
  Bot,
  Share2,
  Compass,
  Trophy,
  CalendarDays,
  Activity,
  Cloud,
  Factory,
  Car,
  Layers,
  Flame,
  Zap,
} from 'lucide-react';

interface OverviewProps {
  airData: CurrentAirQualityData | null;
  hourlyData: HourlyAirQualityPoint[];
  scale: AQIScale;
  onScaleChange: (scale: AQIScale) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenShare: () => void;
  onOpenAlerts: () => void;
  onNavigateToTab: (tab: any) => void;
  onSelectLocation?: (loc: LocationInfo) => void;
  onUseGPS?: () => Promise<void>;
  isLocating?: boolean;
}

export function Overview({
  airData,
  hourlyData,
  scale,
  onOpenShare,
  onOpenAlerts,
  onNavigateToTab,
  onSelectLocation,
}: OverviewProps) {
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D');
  const [trendRange, setTrendRange] = useState<'1D' | '7D' | '14D' | '30D'>('7D');
  const [showDemoModal, setShowDemoModal] = useState(false);

  const trendData = useMemo(() => {
    const now = Date.now();
    const rangeMs = { '1D': 24, '7D': 168, '14D': 336, '30D': 720 }[trendRange] * 60 * 60 * 1000;
    const stepHours = { '1D': 1, '7D': 3, '14D': 6, '30D': 12 }[trendRange];
    return hourlyData
      .filter((point) => {
        const timestamp = new Date(point.time).getTime();
        return timestamp <= now && timestamp >= now - rangeMs;
      })
      .filter((_, index) => index % stepHours === 0)
      .map((point) => ({
        date: new Date(point.time).toLocaleString([], trendRange === '1D'
          ? { hour: '2-digit', minute: '2-digit' }
          : { month: 'short', day: 'numeric' }),
        aqi: scale === 'EAQI'
          ? point.europeanAqi
          : scale === 'USAQI'
          ? point.usAqi
          : calculateIndAqi(point.pm2_5, point.pm10),
        pm2_5: point.pm2_5,
        pm10: point.pm10,
      }));
  }, [hourlyData, scale, trendRange]);

  if (!airData) return null;

  const aqiVal =
    scale === 'EAQI'
      ? airData.europeanAqi
      : scale === 'USAQI'
      ? airData.usAqi
      : airData.indAqi;
  const category = getCategoryForScale(aqiVal, scale);

  // Circular gauge calculations (0 to 100/500)
  const maxScale = scale === 'EAQI' ? 100 : 500;
  const percentage = Math.min(Math.max(((aqiVal ?? 0) / maxScale) * 100, 0), 100);
  const gaugeStrokeDash = 260;
  const gaugeOffset = gaugeStrokeDash - (percentage / 100) * gaugeStrokeDash;

  const p = airData.pollutants;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. HERO SECTION: NATIVE HIGH-TECH UI WITH CLEAN ECO-CITY BACKGROUND & SVG HOLOGRAPHIC LEAF */}
      <div className="relative rounded-3xl overflow-hidden border border-[#162338] bg-[#070D18] shadow-2xl min-h-[300px] md:min-h-[340px] flex items-center">
        {/* Eco-City Skyline: CSS-rendered panoramic atmosphere with emerald city glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 60% 80% at 85% 60%, rgba(16,185,129,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 40% 60% at 70% 80%, rgba(6,182,212,0.12) 0%, transparent 50%),
              radial-gradient(ellipse 30% 40% at 90% 30%, rgba(52,211,153,0.10) 0%, transparent 50%),
              linear-gradient(135deg, #070D18 0%, #0A1628 30%, #071820 60%, #030D14 100%)
            `,
          }}
        />
        {/* SVG Eco-City Skyline (buildings + trees silhouette) */}
        <svg
          className="absolute right-0 bottom-0 w-[55%] md:w-[50%] h-full opacity-40 pointer-events-none"
          viewBox="0 0 600 340"
          preserveAspectRatio="xMaxYMax meet"
          fill="none"
        >
          {/* Atmospheric glow behind skyline */}
          <ellipse cx="420" cy="280" rx="220" ry="80" fill="rgba(16,185,129,0.12)" />
          <ellipse cx="380" cy="260" rx="180" ry="60" fill="rgba(6,182,212,0.08)" />
          {/* Background tall towers */}
          <rect x="310" y="80" width="30" height="260" rx="2" fill="#0D2535" />
          <rect x="315" y="85" width="20" height="250" rx="1" fill="#0A1E2E" />
          {/* Lit windows on background tower */}
          <rect x="318" y="95" width="4" height="3" rx="0.5" fill="rgba(52,211,153,0.6)" />
          <rect x="325" y="95" width="4" height="3" rx="0.5" fill="rgba(52,211,153,0.4)" />
          <rect x="318" y="105" width="4" height="3" rx="0.5" fill="rgba(52,211,153,0.5)" />
          <rect x="318" y="115" width="4" height="3" rx="0.5" fill="rgba(52,211,153,0.3)" />
          <rect x="325" y="115" width="4" height="3" rx="0.5" fill="rgba(52,211,153,0.6)" />
          <rect x="318" y="125" width="4" height="3" rx="0.5" fill="rgba(52,211,153,0.4)" />
          <rect x="325" y="125" width="4" height="3" rx="0.5" fill="rgba(52,211,153,0.5)" />
          {/* Main center skyscraper */}
          <rect x="350" y="40" width="45" height="300" rx="3" fill="#0C2030" />
          <rect x="355" y="45" width="35" height="290" rx="2" fill="#091C2A" />
          {/* Antenna */}
          <line x1="372" y1="40" x2="372" y2="20" stroke="rgba(52,211,153,0.7)" strokeWidth="2" />
          <circle cx="372" cy="18" r="3" fill="rgba(52,211,153,0.9)" />
          {/* Windows on main tower */}
          {[60,75,90,105,120,135,150,165,180,195,210,225,240,255,270].map((y, i) => (
            <g key={i}>
              <rect x="360" y={y} width="5" height="4" rx="0.5" fill={i % 3 === 0 ? "rgba(52,211,153,0.7)" : "rgba(52,211,153,0.3)"} />
              <rect x="370" y={y} width="5" height="4" rx="0.5" fill={i % 2 === 0 ? "rgba(52,211,153,0.5)" : "rgba(52,211,153,0.2)"} />
              <rect x="380" y={y} width="5" height="4" rx="0.5" fill={i % 4 === 0 ? "rgba(52,211,153,0.6)" : "rgba(52,211,153,0.3)"} />
            </g>
          ))}
          {/* Right tower */}
          <rect x="410" y="90" width="38" height="250" rx="2" fill="#0C2030" />
          <rect x="414" y="94" width="30" height="242" rx="1" fill="#091C2A" />
          {[100,115,130,145,160,175,190,205,220,235,250,265].map((y, i) => (
            <g key={i}>
              <rect x="417" y={y} width="4" height="3" rx="0.5" fill={i % 2 === 0 ? "rgba(6,182,212,0.6)" : "rgba(6,182,212,0.3)"} />
              <rect x="425" y={y} width="4" height="3" rx="0.5" fill={i % 3 === 0 ? "rgba(6,182,212,0.5)" : "rgba(6,182,212,0.2)"} />
              <rect x="433" y={y} width="4" height="3" rx="0.5" fill={i % 2 === 1 ? "rgba(6,182,212,0.4)" : "rgba(6,182,212,0.3)"} />
            </g>
          ))}
          {/* Far right shorter buildings */}
          <rect x="460" y="140" width="28" height="200" rx="2" fill="#0A1E2E" />
          <rect x="494" y="160" width="22" height="180" rx="2" fill="#0C2030" />
          <rect x="522" y="120" width="35" height="220" rx="2" fill="#0A1E2E" />
          <rect x="563" y="150" width="40" height="190" rx="2" fill="#0C2030" />
          {/* Left mid buildings */}
          <rect x="260" y="120" width="28" height="220" rx="2" fill="#0A1E2E" />
          <rect x="224" y="150" width="22" height="190" rx="2" fill="#0C2030" />
          {/* Trees/foliage (bottom left area) */}
          <ellipse cx="230" cy="310" rx="22" ry="30" fill="rgba(16,185,129,0.25)" />
          <ellipse cx="250" cy="320" rx="18" ry="25" fill="rgba(16,185,129,0.20)" />
          <ellipse cx="270" cy="315" rx="20" ry="28" fill="rgba(16,185,129,0.22)" />
          <ellipse cx="210" cy="318" rx="15" ry="22" fill="rgba(16,185,129,0.18)" />
          {/* Water reflection at base */}
          <rect x="150" y="330" width="450" height="10" rx="5" fill="rgba(6,182,212,0.08)" />
          <ellipse cx="420" cy="338" rx="180" ry="6" fill="rgba(16,185,129,0.06)" />
        </svg>

        {/* Dark Vignette & Gradient Overlays for Crystal Clear Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070D18] via-[#070D18]/90 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-transparent to-transparent pointer-events-none" />

        {/* Hero Left Content */}
        <div className="relative z-10 p-6 md:p-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F8FAFC] tracking-tight leading-[1.15]">
            Understand the air <br />
            <span className="text-emerald-400">around you.</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#94A3B8] mt-3.5 max-w-lg leading-relaxed">
            Real-time air quality insights, pollution hotspots, and personalized health recommendations.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            <button
              onClick={() => {
                soundFx.playClickTone();
                const el = document.getElementById('telemetry-matrix');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-400 hover:bg-emerald-500 text-black font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/25 group"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                soundFx.playSuccessChime();
                setShowDemoModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#0E1626]/85 hover:bg-[#152234] border border-[#1F3045] hover:border-emerald-400/50 text-[#F8FAFC] font-semibold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer shadow-md group"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Hero Right Holographic Glowing Neon Leaf & Tagline */}
        <div className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-5 z-10 pointer-events-none">
          {/* Glowing SVG Hologram Leaf */}
          <div className="relative w-32 h-32 lg:w-44 lg:h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-400/15 blur-2xl animate-pulse" />
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_0_20px_rgba(34,197,94,0.65)]"
            >
              <defs>
                <linearGradient id="heroLeafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="50%" stopColor="#4ADE80" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Outer organic leaf contour */}
              <path
                d="M 50 14 C 74 14, 88 38, 84 68 C 80 86, 62 90, 50 88 C 38 90, 20 86, 16 68 C 12 38, 26 14, 50 14 Z"
                fill="none"
                stroke="url(#heroLeafGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonGlow)"
              />
              {/* Central curved spine */}
              <path
                d="M 50 18 Q 50 54, 50 86"
                fill="none"
                stroke="#4ADE80"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Radiating vascular veins */}
              <path d="M 50 32 Q 64 36, 74 38" fill="none" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
              <path d="M 50 46 Q 66 52, 75 54" fill="none" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
              <path d="M 50 60 Q 62 65, 70 68" fill="none" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
              <path d="M 50 32 Q 36 36, 26 38" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
              <path d="M 50 46 Q 34 52, 25 54" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
              <path d="M 50 60 Q 38 65, 30 68" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
            </svg>
          </div>

          {/* Cursive Tagline */}
          <div className="text-right">
            <span className="font-serif italic text-2xl xl:text-3xl font-normal text-[#F8FAFC] tracking-wide drop-shadow-md block">
              Cleaner Air.
            </span>
            <span className="font-serif italic text-2xl xl:text-3xl font-normal text-emerald-400 tracking-wide drop-shadow-md block mt-0.5">
              Healthier Tomorrow.
            </span>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE TELEMETRY ROW: MAIN AQI CARD + 6 POLLUTANTS GRID + WEATHER CARD */}
      <div id="telemetry-matrix" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CARD A: MAIN AQI CARD (~4 cols) */}
        <div className="lg:col-span-4 border border-[#162338] rounded-3xl p-6 shadow-xl flex items-center justify-between gap-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1828 0%, #0B1422 50%, #091220 100%)' }}>
          {/* Subtle emerald glow behind gauge */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
          {/* Circular Rainbow Gauge */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="41"
                fill="none"
                stroke="#152238"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="41"
                fill="none"
                stroke={category.color}
                strokeWidth="10"
                strokeDasharray="260"
                strokeDashoffset={gaugeOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Number & Category */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono text-[#F8FAFC] tracking-tight">
                {aqiVal ?? '--'}
              </span>
              <span className="text-xs font-bold text-emerald-400 mt-0.5">
                {category.category}
              </span>
              <span className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider">
                AQI
              </span>
            </div>
          </div>

          {/* Right Status Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <h3 className="text-sm font-extrabold text-[#F8FAFC]">
                Air Quality is <span className="text-emerald-400">{category.category}</span>
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">
              {category.healthSummary.slice(0, 68)}...
            </p>

            <div className="text-[11px] text-[#64748B] font-mono">
              <span className="block text-[#94A3B8]">Last Updated</span>
              <span className="block">{airData.dataSource}</span>
              <span>{formatDateTime(airData.timestamp)}</span>
              <span className="block text-amber-400">CAMS model estimate, not a ground-station measurement.</span>
              {scale === 'INDAQI' && (
                <span className="block text-amber-400">Indian AQI uses PM2.5/PM10 only; it is not the official CPCB overall AQI.</span>
              )}
            </div>
          </div>
        </div>

        {/* CARD B: 6 POLLUTANTS MATRIX (2 rows × 3 columns, ~5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-2.5">
          {/* 1. PM2.5 */}
          <div className="bg-[#0B1220] border border-[#162338] hover:border-[#1F3045] rounded-2xl p-3 flex flex-col justify-between shadow-md transition-colors">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold">
              <span>PM2.5</span>
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Layers className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-black font-mono text-[#F8FAFC]">
                {p.pm2_5 ?? 'N/A'}
              </div>
              <div className="text-[10px] text-[#64748B] font-mono">µg/m³</div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span>{p.pm2_5 !== null ? 'Model estimate' : 'Unavailable'}</span>
            </div>
          </div>

          {/* 2. PM10 */}
          <div className="bg-[#0B1220] border border-[#162338] hover:border-[#1F3045] rounded-2xl p-3 flex flex-col justify-between shadow-md transition-colors">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold">
              <span>PM10</span>
              <div className="w-5 h-5 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Cloud className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-black font-mono text-[#F8FAFC]">
                {p.pm10 ?? 'N/A'}
              </div>
              <div className="text-[10px] text-[#64748B] font-mono">µg/m³</div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span>{p.pm10 !== null ? 'Model estimate' : 'Unavailable'}</span>
            </div>
          </div>

          {/* 3. NO2 */}
          <div className="bg-[#0B1220] border border-[#162338] hover:border-[#1F3045] rounded-2xl p-3 flex flex-col justify-between shadow-md transition-colors">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold">
              <span>NO₂</span>
              <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Factory className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-black font-mono text-[#F8FAFC]">
                {p.no2 ?? 'N/A'}
              </div>
              <div className="text-[10px] text-[#64748B] font-mono">µg/m³</div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span>{p.no2 !== null ? 'Model estimate' : 'Unavailable'}</span>
            </div>
          </div>

          {/* 4. SO2 */}
          <div className="bg-[#0B1220] border border-[#162338] hover:border-[#1F3045] rounded-2xl p-3 flex flex-col justify-between shadow-md transition-colors">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold">
              <span>SO₂</span>
              <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Flame className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-black font-mono text-[#F8FAFC]">
                {p.so2 ?? 'N/A'}
              </div>
              <div className="text-[10px] text-[#64748B] font-mono">µg/m³</div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span>{p.so2 !== null ? 'Model estimate' : 'Unavailable'}</span>
            </div>
          </div>

          {/* 5. CO */}
          <div className="bg-[#0B1220] border border-[#162338] hover:border-[#1F3045] rounded-2xl p-3 flex flex-col justify-between shadow-md transition-colors">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold">
              <span>CO</span>
              <div className="w-5 h-5 rounded-md bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Car className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-black font-mono text-[#F8FAFC]">
                {p.co !== null ? (p.co / 1000).toFixed(2) : 'N/A'}
              </div>
              <div className="text-[10px] text-[#64748B] font-mono">mg/m³</div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span>{p.co !== null ? 'Model estimate' : 'Unavailable'}</span>
            </div>
          </div>

          {/* 6. O3 */}
          <div className="bg-[#0B1220] border border-[#162338] hover:border-[#1F3045] rounded-2xl p-3 flex flex-col justify-between shadow-md transition-colors">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold">
              <span>O₃</span>
              <div className="w-5 h-5 rounded-md bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <Zap className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-black font-mono text-[#F8FAFC]">
                {p.o3 ?? 'N/A'}
              </div>
              <div className="text-[10px] text-[#64748B] font-mono">µg/m³</div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span>{p.o3 !== null ? 'Model estimate' : 'Unavailable'}</span>
            </div>
          </div>
        </div>

        {/* CARD C: WEATHER CARD (~3 cols) */}
        <div className="lg:col-span-3 border border-[#162338] rounded-3xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D2240 0%, #0E1F3A 30%, #102030 60%, #0B1220 100%)' }}>
          {/* Sky atmosphere glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 60% 20%, rgba(56,189,248,0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />
          {/* Top Sunny Visual & Temp */}
          <div className="flex items-center justify-between">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-xl shadow-amber-400/30 flex items-center justify-center animate-pulse">
              <Sun className="w-9 h-9 text-amber-950 fill-amber-300" />
            </div>

            <div className="text-right">
              <div className="text-3xl font-black font-mono text-[#F8FAFC]">
                {airData.weather?.temperature != null ? `${Math.round(airData.weather.temperature)}°C` : 'N/A'}
              </div>
              <div className="text-xs font-semibold text-[#94A3B8]">
                {airData.weather?.weatherDescription || 'Weather unavailable'}
              </div>
            </div>
          </div>

          {/* Bottom Meteorology Stats Row */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#162338] text-center text-xs mt-3">
            <div>
              <div className="text-[10px] text-[#64748B] font-mono flex items-center justify-center gap-1">
                <Droplets className="w-3 h-3 text-sky-400" />
                <span>Humidity</span>
              </div>
              <div className="font-bold text-[#F8FAFC] font-mono mt-0.5">
                {airData.weather?.humidity != null ? `${airData.weather.humidity}%` : 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#64748B] font-mono flex items-center justify-center gap-1">
                <Wind className="w-3 h-3 text-emerald-400" />
                <span>Wind</span>
              </div>
              <div className="font-bold text-[#F8FAFC] font-mono mt-0.5">
                {airData.weather?.windSpeed != null ? `${airData.weather.windSpeed} km/h` : 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#64748B] font-mono flex items-center justify-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>UV Index</span>
              </div>
              <div className="font-bold text-[#F8FAFC] font-mono mt-0.5">
                N/A
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM VISUAL INTELLIGENCE ROW: REAL MAP (2D/3D) + TREND CHART + TODAY'S INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CARD A: INTERACTIVE AIR QUALITY MAP (4 cols) */}
        <div className="lg:col-span-4 bg-[#0B1220] border border-[#162338] rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-sm font-extrabold text-[#F8FAFC]">
                  Interactive Air Quality Map
                </h4>
              </div>

              {/* 2D / 3D Switcher */}
              <div className="flex items-center bg-[#070D18] p-0.5 rounded-xl border border-[#162338] text-xs">
                <button
                  onClick={() => {
                    soundFx.playClickTone();
                    setMapMode('2D');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    mapMode === '2D' ? 'bg-emerald-400 text-black shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  2D
                </button>
                <button
                  onClick={() => {
                    soundFx.playClickTone();
                    setMapMode('3D');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    mapMode === '3D' ? 'bg-emerald-400 text-black shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  3D
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] mb-3">
              Select a city to fetch its current CAMS model estimate
            </p>

            {/* REAL MAP CONTAINER: Renders Leaflet MiniMap in 2D or Globe3D in 3D */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-[#162338] bg-[#070D18]">
              {mapMode === '2D' ? (
                <MiniMap
                  selectedLocation={airData.location}
                  onSelectLocation={onSelectLocation}
                  scale={scale}
                  onExpandMap={() => onNavigateToTab('liveMap')}
                />
              ) : (
                <Globe3D
                  key={`${airData.location.latitude}:${airData.location.longitude}:${aqiVal ?? 'unavailable'}`}
                  selectedLocation={airData.location}
                  onSelectLocation={onSelectLocation || (() => {})}
                  currentAqi={aqiVal}
                  scale={scale}
                  height="100%"
                  compactHud={true}
                />
              )}
            </div>
          </div>

          {/* Bottom Legend & View Full Map Button */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#162338] text-[10px] text-[#64748B] font-mono">
            <span>Global pins are locations, not live readings</span>

            <button
              onClick={() => {
                soundFx.playClickTone();
                onNavigateToTab('liveMap');
              }}
              className="text-[#F8FAFC] hover:text-emerald-400 font-bold flex items-center gap-1 cursor-pointer ml-2 shrink-0 transition-colors"
            >
              <span>View Full Map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CARD B: AIR QUALITY TREND CHART (5 cols) */}
        <div className="lg:col-span-5 bg-[#0B1220] border border-[#162338] rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-extrabold text-[#F8FAFC]">
                  Air Quality Trend
                </h4>
              </div>

              {/* Time Range Filter: 1D, 7D, 14D, 30D */}
              <div className="flex items-center bg-[#070D18] p-0.5 rounded-xl border border-[#162338] text-xs">
                {(['1D', '7D', '14D', '30D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      soundFx.playClickTone();
                      setTrendRange(r);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      trendRange === r
                        ? 'bg-emerald-400 text-black'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend: AQI (green), PM2.5 (cyan), PM10 (amber) */}
            <div className="flex items-center gap-4 text-[11px] font-mono mb-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                AQI
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                PM2.5
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                PM10
              </span>
            </div>

            {/* Recharts Multi-Line Curve */}
            {trendData.length === 0 ? (
              <p className="w-full h-48 flex items-center justify-center text-xs text-[#94A3B8]">
                Historical model data is unavailable for this period.
              </p>
            ) : <div className="w-full h-48 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#152234' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={10}
                    domain={[0, 150]}
                    ticks={[0, 50, 100, 150]}
                    tickLine={false}
                    axisLine={{ stroke: '#152234' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#070D18',
                      borderColor: '#1F3045',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke="#22C55E"
                    strokeWidth={2.5}
                    dot={{ fill: '#22C55E', r: 3.5 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pm2_5"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    dot={{ fill: '#38BDF8', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pm10"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>}
          </div>
        </div>

        {/* CARD C: TODAY'S INSIGHTS & HEALTH TIP (3 cols) */}
        <div className="lg:col-span-3 bg-[#0B1220] border border-[#162338] rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-[#F8FAFC]">
                  Today's Insights
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>

              <button
                onClick={() => {
                  soundFx.playClickTone();
                  onNavigateToTab('health');
                }}
                className="text-[11px] text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Insight Box 1: Leaf + Location AQI status */}
            <div className="p-3.5 rounded-2xl bg-[#070D18] border border-[#162338] flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Leaf className="w-4 h-4 fill-emerald-400/20" />
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Air quality is <strong className="font-bold" style={{ color: category.color }}>{category.category.toLowerCase()}</strong> in{' '}
                {airData.location.name} ({aqiVal ?? 'AQI unavailable'}).{' '}
                {p.pm2_5 !== null
                  ? `PM2.5 model estimate: ${p.pm2_5} µg/m³.`
                  : 'PM2.5 measurement is unavailable.'}{' '}
                {category.outdoorAdvice}
              </p>
            </div>

            {/* Insight Box 2: Health Tip with Runner */}
            <div className="p-3.5 rounded-2xl bg-[#070D18] border border-[#162338] flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Heart className="w-4 h-4 fill-emerald-400/20" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-emerald-400">
                    Health Tip:
                  </span>
                  <p className="text-xs text-[#94A3B8] leading-tight mt-0.5">
                    {category.category === 'Good' || category.category === 'Satisfactory'
                      ? 'Great day for outdoor exercise!'
                      : 'Limit prolonged outdoor exertion.'}
                  </p>
                </div>
              </div>

              {/* Runner Graphic */}
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl shrink-0">
                🏃
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#64748B] font-mono text-right">
            Generated via CAMS Telemetry
          </div>
        </div>
      </div>

      {/* 4. BOTTOM QUICK NAVIGATION DOCK: EXACT BUTTONS FROM REFERENCE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
        {/* Button 1: Health & Safety */}
        <button
          onClick={() => {
            soundFx.playClickTone();
            onNavigateToTab('health');
          }}
          className="p-3.5 rounded-2xl bg-[#0B1220] border border-[#162338] hover:border-emerald-400/40 text-left transition-all group cursor-pointer shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#F8FAFC]">
              Health & Safety
            </span>
            <span className="block text-[10px] text-[#64748B]">Guidelines</span>
          </div>
        </button>

        {/* Button 2: AQI Forecast (5 Days) */}
        <button
          onClick={() => {
            soundFx.playClickTone();
            onNavigateToTab('forecast');
          }}
          className="p-3.5 rounded-2xl bg-[#0B1220] border border-[#162338] hover:border-emerald-400/40 text-left transition-all group cursor-pointer shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#F8FAFC]">
              AQI Forecast
            </span>
            <span className="block text-[10px] text-[#64748B]">(5 Days)</span>
          </div>
        </button>

        {/* Button 3: Clean Air Finder */}
        <button
          onClick={() => {
            soundFx.playClickTone();
            onNavigateToTab('cleanAir');
          }}
          className="p-3.5 rounded-2xl bg-[#0B1220] border border-[#162338] hover:border-emerald-400/40 text-left transition-all group cursor-pointer shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#F8FAFC]">
              Clean Air
            </span>
            <span className="block text-[10px] text-[#64748B]">Finder Map</span>
          </div>
        </button>

        {/* Button 4: Pollution Leaderboard */}
        <button
          onClick={() => {
            soundFx.playClickTone();
            onNavigateToTab('cleanAir');
          }}
          className="p-3.5 rounded-2xl bg-[#0B1220] border border-[#162338] hover:border-emerald-400/40 text-left transition-all group cursor-pointer shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#F8FAFC]">
              Pollution
            </span>
            <span className="block text-[10px] text-[#64748B]">Leaderboard</span>
          </div>
        </button>

        {/* Button 5: Share Report */}
        <button
          onClick={() => {
            soundFx.playClickTone();
            onOpenShare();
          }}
          className="p-3.5 rounded-2xl bg-[#0B1220] border border-[#162338] hover:border-emerald-400/40 text-left transition-all group cursor-pointer shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#F8FAFC]">
              Share Report
            </span>
            <span className="block text-[10px] text-[#64748B]">Card Export</span>
          </div>
        </button>

        {/* Button 6: Chat with BreatheX AI (Glowing Green Accent - spans 2 cols) */}
        <button
          onClick={() => {
            soundFx.playClickTone();
            onNavigateToTab('aiAssistant');
          }}
          className="md:col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/50 hover:border-emerald-400 text-left transition-all group cursor-pointer shadow-lg shadow-emerald-500/15 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-400 text-black flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-extrabold text-emerald-400 truncate">
                Chat with BreatheX AI
              </span>
              <span className="block text-[10px] text-[#94A3B8] truncate">
                Ask anything about air quality...
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>
      </div>

      {/* Interactive Demo Walkthrough Modal */}
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onNavigateToTab={onNavigateToTab}
        onOpenAlerts={onOpenAlerts}
      />
    </div>
  );
}
