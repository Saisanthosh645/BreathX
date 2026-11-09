import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';

interface PollutantCardProps {
  name: string;
  code: string;
  value: number | null;
  unit?: string;
  whoGuideline?: number;
  description: string;
  healthImpact: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
}

export function PollutantCard({
  name,
  code,
  value,
  unit = 'µg/m³',
  whoGuideline,
  description,
  healthImpact,
  trend,
  trendPercent,
}: PollutantCardProps) {
  // Determine status color based on WHO threshold
  let statusBadge = {
    label: 'Unavailable',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    barColor: '#64748B',
  };

  if (value !== null) {
    if (whoGuideline) {
      const ratio = value / whoGuideline;
      if (ratio <= 1.0) {
        statusBadge = {
          label: 'Safe Level',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          barColor: '#22C55E',
        };
      } else if (ratio <= 2.5) {
        statusBadge = {
          label: 'Moderate',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          barColor: '#EAB308',
        };
      } else if (ratio <= 4.0) {
        statusBadge = {
          label: 'Elevated',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          barColor: '#F97316',
        };
      } else {
        statusBadge = {
          label: 'Hazardous',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          barColor: '#EF4444',
        };
      }
    } else {
      statusBadge = {
        label: 'Active',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/30',
        text: 'text-sky-400',
        barColor: '#38BDF8',
      };
    }
  }

  // Calculate percentage of guideline for bar
  const progressPercent =
    value !== null && whoGuideline
      ? Math.min(Math.round((value / (whoGuideline * 3)) * 100), 100)
      : value !== null
      ? 40
      : 0;

  return (
    <div className="bg-[#111C2D] border border-[#1F3045] hover:border-[#1F3045]/80 transition-all rounded-2xl p-5 flex flex-col justify-between group shadow-lg">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-1.5 gap-1">
          <span className="font-mono text-xs font-black text-[#38BDF8] bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            {code}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text} shrink-0`}
          >
            {statusBadge.label}
          </span>
        </div>

        <div className="text-xs text-[#F8FAFC] font-semibold truncate mb-1">
          {name}
        </div>
        <p className="text-[11px] text-[#94A3B8]/70 line-clamp-1 mb-2">
          {description}
        </p>

        {/* Primary Reading Value */}
        <div className="flex items-baseline gap-1.5 my-2">
          <span className="text-3xl font-extrabold text-[#F8FAFC] font-mono tracking-tight">
            {value !== null ? value : 'N/A'}
          </span>
          <span className="text-xs text-[#94A3B8] font-medium">{unit}</span>

          {/* Trend badge */}
          {trend && trendPercent !== undefined && trendPercent > 0 && (
            <div
              className={`ml-auto flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                trend === 'up'
                  ? 'text-rose-400 bg-rose-500/10'
                  : trend === 'down'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 bg-slate-500/10'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              <span>{trendPercent}%</span>
            </div>
          )}
        </div>

        {/* Progress bar relative to WHO 24-hr guideline */}
        <div className="w-full bg-[#0D1422] h-1.5 rounded-full overflow-hidden my-3 border border-[#1F3045]/40">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: statusBadge.barColor,
            }}
          />
        </div>

        {whoGuideline && (
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-2 font-mono">
            <span>WHO 24h Cap:</span>
            <span className="text-[#F8FAFC] font-semibold">{whoGuideline} {unit}</span>
          </div>
        )}
      </div>

      {/* Health Significance Footer */}
      <div className="pt-3 border-t border-[#1F3045]/50 flex items-start gap-1.5 text-[11px] text-[#94A3B8] leading-tight">
        <AlertCircle className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
        <span className="line-clamp-2">{healthImpact}</span>
      </div>
    </div>
  );
}
