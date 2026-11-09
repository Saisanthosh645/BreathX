import { Sparkles, CheckCircle2, AlertTriangle, Wind, Info } from 'lucide-react';
import { AQIScale } from '../types/airQuality';
import { generateRealDataInsights } from '../utils/pollutionAnalysis';

interface TodayInsightsProps {
  aqi: number | null;
  scale: AQIScale;
  pollutants: {
    pm2_5: number | null;
    pm10: number | null;
    no2: number | null;
    o3: number | null;
    so2: number | null;
    co: number | null;
  };
  weather?: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
  };
  locationName: string;
}

export function TodayInsights({
  aqi,
  scale,
  pollutants,
  weather,
  locationName,
}: TodayInsightsProps) {
  const insights = generateRealDataInsights(aqi, scale, pollutants, weather);

  return (
    <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#22C55E]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#F8FAFC]">
              Today's Air Quality Insights
            </h4>
            <p className="text-xs text-[#94A3B8]">
              Automated intelligence derived from verified telemetry for {locationName}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Real-time Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
        {insights.map((insight, idx) => {
          let icon = <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />;
          let borderStyle = 'border-[#1F3045]/60 hover:border-[#1F3045]';

          if (insight.includes('WHO 24-hour safe guideline') && insight.includes('x')) {
            icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
            borderStyle = 'border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5';
          } else if (insight.includes('Stagnant air conditions')) {
            icon = <Wind className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
            borderStyle = 'border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5';
          } else if (insight.includes('ground-level ozone')) {
            icon = <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />;
            borderStyle = 'border-sky-500/20 hover:border-sky-500/40 bg-sky-500/5';
          }

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border bg-[#0D1422]/70 flex items-start gap-3 transition-colors ${borderStyle}`}
            >
              {icon}
              <p className="text-xs text-[#F8FAFC]/90 leading-relaxed font-normal">
                {insight}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
