import { AQICategory, AQIScale } from '../types/airQuality';
import { ShieldCheck, Info, Sparkles, Activity } from 'lucide-react';
import { soundFx } from '../utils/audioFx';

interface AQIGaugeProps {
  aqi: number | null;
  scale: AQIScale;
  category: AQICategory;
  onScaleChange?: (scale: AQIScale) => void;
  dominantPollutant?: string | null;
  measurementTime?: string;
}

export function AQIGauge({
  aqi,
  scale,
  category,
  onScaleChange,
  dominantPollutant,
  measurementTime,
}: AQIGaugeProps) {
  // Max scale values: EAQI is usually 0-100+ (cap 120), US AQI is 0-500, Indian AQI is 0-500
  const maxScale = scale === 'EAQI' ? 120 : 500;
  const currentVal = aqi ?? 0;
  const percentage = Math.min(Math.max((currentVal / maxScale) * 100, 0), 100);

  // Gauge radius and stroke calculations (SVG 240 degree arc)
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  const scaleFullNames: Record<AQIScale, string> = {
    EAQI: 'European AQI (EAQI)',
    USAQI: 'US EPA Air Quality Index',
    INDAQI: 'Indian National AQI (CPCB)',
  };

  const scaleRanges: Record<AQIScale, string> = {
    EAQI: '0 to 100+',
    USAQI: '0 to 500',
    INDAQI: '0 to 500',
  };

  // Generate 21 radial dial ticks
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const angleDeg = 150 + i * (240 / 20);
    const angleRad = (angleDeg * Math.PI) / 180;
    const innerR = 68;
    const outerR = i % 5 === 0 ? 76 : 72;
    const x1 = 100 + innerR * Math.cos(angleRad);
    const y1 = 100 + innerR * Math.sin(angleRad);
    const x2 = 100 + outerR * Math.cos(angleRad);
    const y2 = 100 + outerR * Math.sin(angleRad);
    const isActive = (i / 20) * 100 <= percentage;
    return { x1, y1, x2, y2, isActive, isMajor: i % 5 === 0 };
  });

  return (
    <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl group">
      {/* Background radial gradient glow matching status color */}
      <div
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: category.color }}
      />

      {/* Header & Scale Switcher */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            Live Environmental Index
          </span>
          <h3 className="text-lg font-extrabold text-[#F8FAFC]">
            {scaleFullNames[scale]}
          </h3>
        </div>

        {/* Scale Quick Selector with Audio feedback */}
        {onScaleChange && (
          <div className="inline-flex items-center bg-[#0D1422] p-1 rounded-xl border border-[#1F3045]">
            {(['USAQI', 'EAQI', 'INDAQI'] as AQIScale[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  soundFx.playClickTone();
                  onScaleChange(s);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  scale === s
                    ? 'bg-[#22C55E] text-black shadow-md font-bold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {s === 'USAQI' ? 'US EPA' : s === 'EAQI' ? 'EU EAQI' : 'India'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Circular SVG Gauge with Futuristic Dial Ticks */}
      <div className="relative flex flex-col items-center justify-center py-3 my-auto">
        <svg
          className="w-60 h-60"
          viewBox="0 0 200 200"
        >
          <defs>
            <linearGradient id="activeArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="60%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor={category.color} />
            </linearGradient>
            <filter id="gaugeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Radial Tick Lines */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isActive ? category.color : '#1F3045'}
              strokeWidth={t.isMajor ? 2.2 : 1.2}
              strokeOpacity={t.isActive ? 0.9 : 0.4}
            />
          ))}

          {/* Background Track Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#162336"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform="rotate(150 100 100)"
          />

          {/* Glowing Shadow Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={category.color}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeOpacity="0.25"
            transform="rotate(150 100 100)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Main Active Progress Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={category.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(150 100 100)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Readout & Category Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none mt-2">
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Telemetry</span>
          </div>

          <div className="text-5xl font-black tracking-tight text-[#F8FAFC] font-mono drop-shadow-md">
            {aqi !== null ? aqi : '--'}
          </div>

          <span className="text-[11px] text-[#94A3B8] font-mono uppercase tracking-wider mt-0.5">
            Range: {scaleRanges[scale]}
          </span>

          <div
            className={`mt-2.5 px-3 py-1 rounded-full text-xs font-black tracking-wide border shadow-md ${category.bgClass} ${category.borderClass} ${category.textClass}`}
          >
            {category.category}
          </div>
        </div>
      </div>

      {/* Footer Details: Dominant pollutant & time */}
      <div className="z-10 pt-4 border-t border-[#1F3045]/60 flex items-center justify-between text-xs text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>
            Primary: <strong className="text-[#F8FAFC]">{dominantPollutant || 'PM2.5'}</strong>
          </span>
        </div>
        {measurementTime && (
          <span className="text-[11px] text-[#94A3B8]/80 font-mono">
            Observed: {new Date(measurementTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
