import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = 'Environmental Sensor Service Unavailable',
  message,
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div className="bg-[#111C2D]/90 border border-rose-500/30 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-2xl backdrop-blur-sm my-8">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
        <WifiOff className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">{title}</h3>
      <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">{message}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Re-establishing Stream...' : 'Retry Connection'}
          </button>
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-[#1F3045] text-xs text-[#94A3B8]/80 text-left flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          Note: Open-Meteo services are free and open-access. High query volume may trigger temporary 429 throttling. Cached measurements will automatically resume once the window clears.
        </span>
      </div>
    </div>
  );
}
