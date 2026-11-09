import { useState, useEffect } from 'react';
import {
  LocationInfo,
  AQIScale,
  HourlyAirQualityPoint,
  DailyPollutionSummary,
  PollutionSpike,
} from '../types/airQuality';
import { fetchHistoricalAirQuality } from '../services/airQualityApi';
import {
  detectPollutionSpikes,
  aggregateDailySummaries,
  calculatePercentageChange,
} from '../utils/pollutionAnalysis';
import { calculateIndAqi } from '../utils/aqiCalculations';
import { getNDaysAgoISO, getTodayISO, formatDate } from '../utils/dateUtils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';

interface HistoricalAnalyticsProps {
  currentLocation: LocationInfo;
  scale: AQIScale;
}

export function HistoricalAnalytics({
  currentLocation,
  scale,
}: HistoricalAnalyticsProps) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [points, setPoints] = useState<HourlyAirQualityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const startDate = getNDaysAgoISO(days);
      const endDate = getTodayISO();
      const data = await fetchHistoricalAirQuality(
        currentLocation.latitude,
        currentLocation.longitude,
        startDate,
        endDate
      );
      setPoints(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to retrieve historical data for this coordinate range.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(rangeDays);
  }, [currentLocation, rangeDays]);

  // Derived summaries
  const dailySummaries: DailyPollutionSummary[] = aggregateDailySummaries(
    points,
    scale
  );
  const spikes: PollutionSpike[] = detectPollutionSpikes(points, 'pm2_5');

  // Percentage change: compare first half of period vs second half
  let periodChange: { percent: number; direction: 'up' | 'down' | 'stable' } | null = null;
  if (points.length >= 10) {
    const half = Math.floor(points.length / 2);
    const firstHalfPm25 = points
      .slice(0, half)
      .map((p) => p.pm2_5)
      .filter((v): v is number => v !== null && !isNaN(v));
    const secondHalfPm25 = points
      .slice(half)
      .map((p) => p.pm2_5)
      .filter((v): v is number => v !== null && !isNaN(v));

    if (firstHalfPm25.length > 0 && secondHalfPm25.length > 0) {
      const avg1 = firstHalfPm25.reduce((a, b) => a + b, 0) / firstHalfPm25.length;
      const avg2 = secondHalfPm25.reduce((a, b) => a + b, 0) / secondHalfPm25.length;
      periodChange = calculatePercentageChange(avg1, avg2);
    }
  }

  // Format Recharts data (downsample to every 3 hours for smoother charting over 14-30 days)
  const chartStep = rangeDays === 30 ? 6 : rangeDays === 14 ? 3 : 1;
  const chartPoints = points.filter((_, idx) => idx % chartStep === 0).map((pt) => ({
    time: pt.time.replace('T', ' ').slice(5, 16),
    aqi: scale === 'EAQI'
      ? pt.europeanAqi
      : scale === 'USAQI'
      ? pt.usAqi
      : calculateIndAqi(pt.pm2_5, pt.pm10),
    pm25: pt.pm2_5,
    pm10: pt.pm10,
    no2: pt.no2,
    o3: pt.o3,
  }));

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#38BDF8] font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            Historical CAMS Model Data
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">
            Pollution Trends &amp; Analytics
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Atmospheric observation series for {currentLocation.name} ({currentLocation.country})
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] font-medium hidden sm:inline">
            Window:
          </span>
          <div className="inline-flex bg-[#0D1422] p-1 rounded-xl border border-[#1F3045]">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setRangeDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  rangeDays === d
                    ? 'bg-[#22C55E] text-black font-bold shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Past {d} Days
              </button>
            ))}
          </div>

          <button
            onClick={() => loadHistory(rangeDays)}
            className="p-2 bg-[#0D1422] border border-[#1F3045] hover:border-[#22C55E] text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl transition-colors cursor-pointer"
            title="Reload Historical Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#22C55E]' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <LoadingSkeleton className="h-80 w-full" />
          <LoadingSkeleton className="h-80 w-full" />
        </div>
      ) : error ? (
        <ErrorState
          title="Historical Data Fetch Failed"
          message={error}
          onRetry={() => loadHistory(rangeDays)}
        />
      ) : (
        <>
          {/* Trend KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Period Trend Direction */}
            <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-5 shadow-xl">
              <span className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">
                Period Trend Momentum
              </span>
              <div className="flex items-center justify-between mt-2">
                <div className="text-2xl font-black font-mono text-[#F8FAFC]">
                  {periodChange ? `${periodChange.percent}%` : 'Stable'}
                </div>
                {periodChange && (
                  <div
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      periodChange.direction === 'up'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : periodChange.direction === 'down'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {periodChange.direction === 'up' ? (
                      <>
                        <ArrowUpRight className="w-4 h-4" /> Pollution Increasing
                      </>
                    ) : periodChange.direction === 'down' ? (
                      <>
                        <ArrowDownRight className="w-4 h-4" /> Air Quality Improving
                      </>
                    ) : (
                      <>
                        <Minus className="w-4 h-4" /> Steady Baseline
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-2">
                Comparison of second half vs first half of selected {rangeDays}-day window.
              </p>
            </div>

            {/* Total Data Points */}
            <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-5 shadow-xl">
              <span className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">
                Historical Model Data Points
              </span>
              <div className="text-2xl font-black font-mono text-[#F8FAFC] mt-2">
                {points.length} Hourly Hours
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-2">
                Continuous hourly model assimilation intervals from Open-Meteo.
              </p>
            </div>

            {/* Spikes Identified */}
            <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-5 shadow-xl">
              <span className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">
                Statistical Anomaly Spikes
              </span>
              <div className="text-2xl font-black font-mono text-[#F8FAFC] mt-2">
                {spikes.length} Outliers Detected
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-2">
                Z-score &gt; 1.8 above the standard rolling moving mean.
              </p>
            </div>
          </div>

          {/* 1. AQI Line Chart */}
          <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Hourly {scale} Historical Profile
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Evolution of the primary air quality index over the selected timeframe
                </p>
              </div>
              <span className="text-xs font-mono text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-md border border-[#22C55E]/20">
                {scale}
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F3045" opacity={0.6} />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1422',
                      borderColor: '#1F3045',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={false}
                    name={`${scale} Value`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. PM2.5 and PM10 Comparison Chart */}
          <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Particulate Matter Intercomparison (PM2.5 vs PM10)
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Comparing microscopic respirable particles (PM2.5) with inhalable coarse dust (PM10) in µg/m³
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F3045" opacity={0.6} />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1422',
                      borderColor: '#1F3045',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="pm25"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    dot={false}
                    name="PM2.5 (µg/m³)"
                  />
                  <Line
                    type="monotone"
                    dataKey="pm10"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                    name="PM10 (µg/m³)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Daily Average Pollution Bar Chart */}
          <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Daily Mean Particulate Load
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  24-hour mean concentrations calculated from full hourly measurements
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySummaries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F3045" opacity={0.6} />
                  <XAxis dataKey="dayName" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1422',
                      borderColor: '#1F3045',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="avgPm25" fill="#38BDF8" name="Mean PM2.5 (µg/m³)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgPm10" fill="#F59E0B" name="Mean PM10 (µg/m³)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Pollution Spikes Detection Section */}
          <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Detected Pollution Anomaly Spikes
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Identified using statistical Z-Score thresholding against baseline moving average
                </p>
              </div>
            </div>

            {spikes.length === 0 ? (
              <div className="p-4 bg-[#0D1422] rounded-xl text-center text-xs text-[#94A3B8]">
                No significant statistical pollution spikes detected in this time range. Conditions adhered to baseline dispersion.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {spikes.map((spike, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0D1422] border border-rose-500/20 rounded-xl p-4 space-y-2 hover:border-rose-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#F8FAFC] font-semibold">
                        {spike.time.replace('T', ' ')}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          spike.severity === 'severe'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {spike.severity} Spike
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-rose-400">
                        {spike.value}
                      </span>
                      <span className="text-xs text-[#94A3B8]">{spike.unit}</span>
                      <span className="text-xs text-[#94A3B8] ml-auto font-mono">
                        Mean: {spike.mean}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#94A3B8] leading-tight">
                      {spike.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
