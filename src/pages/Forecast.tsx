import {
  HourlyAirQualityPoint,
  AQIScale,
  CurrentAirQualityData,
  DailyPollutionSummary,
} from '../types/airQuality';
import {
  aggregateDailySummaries,
  detectPollutionSpikes,
} from '../utils/pollutionAnalysis';
import { calculateIndAqi, getCategoryForScale } from '../utils/aqiCalculations';
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
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  CloudSun,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface ForecastProps {
  hourlyData: HourlyAirQualityPoint[];
  currentData: CurrentAirQualityData | null;
  scale: AQIScale;
}

export function Forecast({ hourlyData, currentData, scale }: ForecastProps) {
  // Extract strictly forecast points (future points)
  const now = Date.now();
  const forecastPoints = hourlyData.filter(
    (pt) => pt.isForecast === true && new Date(pt.time).getTime() >= now
  );

  const activeForecastPoints = forecastPoints;

  const next24h = activeForecastPoints.slice(0, 24);
  const next3Days = aggregateDailySummaries(activeForecastPoints, scale).slice(0, 4);
  const expectedSpikes = detectPollutionSpikes(activeForecastPoints, 'pm2_5');

  // Chart points for 24h & 3-day view
  const chartData = activeForecastPoints.slice(0, 72).map((pt) => ({
    time: pt.time.replace('T', ' ').slice(5, 16),
    predictedAqi: scale === 'EAQI'
      ? pt.europeanAqi
      : scale === 'USAQI'
      ? pt.usAqi
      : calculateIndAqi(pt.pm2_5, pt.pm10),
    predictedPm25: pt.pm2_5,
    predictedPm10: pt.pm10,
    predictedNo2: pt.no2,
  }));

  // Compare current vs next 24h peak
  const currentAqi =
    currentData
      ? scale === 'EAQI'
        ? currentData.europeanAqi
        : scale === 'USAQI'
        ? currentData.usAqi
        : currentData.indAqi
      : null;

  const next24hAqiList = next24h
    .map((p) => scale === 'EAQI'
      ? p.europeanAqi
      : scale === 'USAQI'
      ? p.usAqi
      : calculateIndAqi(p.pm2_5, p.pm10))
    .filter((v): v is number => v !== null && !isNaN(v));

  const peakForecastAqi = next24hAqiList.length > 0 ? Math.max(...next24hAqiList) : null;
  const minForecastAqi = next24hAqiList.length > 0 ? Math.min(...next24hAqiList) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner with PREDICTED Badge */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black bg-[#38BDF8] px-2.5 py-0.5 rounded-full shadow-sm">
              PREDICTED MODEL
            </span>
            <span className="text-xs text-[#94A3B8]">
              Open-Meteo forecast using Copernicus CAMS
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">
            Air Quality Forecast &amp; Projections
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Forward-looking pollution projections for{' '}
            <strong className="text-[#F8FAFC]">{currentData?.location.name}</strong>. Values represent meteorological dispersion simulations, not current ground readings.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0D1422] border border-[#1F3045] px-4 py-2 rounded-2xl text-xs">
          <Clock className="w-4 h-4 text-[#38BDF8]" />
          <div>
            <span className="text-[#94A3B8] block text-[10px]">Horizon Window:</span>
            <strong className="text-[#F8FAFC]">Next 72 Hours</strong>
          </div>
        </div>
      </div>

      {/* Current vs Forecast Comparison Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current CAMS model estimate */}
        <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-5 shadow-xl">
          <span className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">
            Current Model Estimate
          </span>
          <div className="text-3xl font-black font-mono text-[#F8FAFC] mt-2">
            {currentAqi ?? '--'} <span className="text-xs font-normal text-[#94A3B8]">{scale}</span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">
            Latest available CAMS estimate for the selected location.
          </p>
        </div>

        {/* Expected Peak (Worst Hour) */}
        <div className="bg-[#111C2D] border border-amber-500/30 rounded-2xl p-5 shadow-xl bg-amber-500/5">
          <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
            Next 24H Expected Peak
          </span>
          <div className="text-3xl font-black font-mono text-amber-400 mt-2">
            {peakForecastAqi ?? '--'} <span className="text-xs font-normal text-[#94A3B8]">{scale}</span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">
            Maximum AQI value among the available model forecast hours.
          </p>
        </div>

        {/* Cleanest Window */}
        <div className="bg-[#111C2D] border border-emerald-500/30 rounded-2xl p-5 shadow-xl bg-emerald-500/5">
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
            Cleanest Projected Window
          </span>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
            {minForecastAqi ?? '--'} <span className="text-xs font-normal text-[#94A3B8]">{scale}</span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">
            Optimal projected window for outdoor running, errands, or window ventilation.
          </p>
        </div>
      </div>

      {/* 1. Next 72-Hour Predicted AQI Chart */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                PREDICTED SIMULATION
              </span>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Next 72-Hour {scale} Projection Curve
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Anticipated hourly fluctuation in overall air quality index
            </p>
          </div>
        </div>

        {activeForecastPoints.length === 0 ? (
          <p className="text-sm text-[#94A3B8] py-12 text-center">
            Forecast data is currently unavailable. Historical readings are not shown as forecasts.
          </p>
        ) : <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                dataKey="predictedAqi"
                stroke="#38BDF8"
                strokeWidth={2.5}
                dot={false}
                name={`Predicted ${scale}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>}
      </div>

      {/* 2. Forecasted PM2.5 and PM10 Trends */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                PARTICULATE FORECAST
              </span>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Predicted PM2.5 &amp; PM10 Particulate Load (µg/m³)
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Expected progression of fine and coarse aerosols
            </p>
          </div>
        </div>

        {activeForecastPoints.length === 0 ? (
          <p className="text-sm text-[#94A3B8] py-12 text-center">
            Forecast data is currently unavailable.
          </p>
        ) : <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="predictedPm25"
                stroke="#22C55E"
                strokeWidth={2}
                dot={false}
                name="Predicted PM2.5 (µg/m³)"
              />
              <Line
                type="monotone"
                dataKey="predictedPm10"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                name="Predicted PM10 (µg/m³)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>}
      </div>

      {/* 3. 3-Day Daily Outlook Summary Cards */}
      <div>
        <h3 className="text-base font-bold text-[#F8FAFC] mb-3">
          Daily Forecast Outlook (Next 3–4 Days)
        </h3>
        {next3Days.length === 0 ? (
          <p className="text-sm text-[#94A3B8] py-8 text-center">
            No daily forecast is available for this location right now.
          </p>
        ) : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {next3Days.map((day) => (
            <div
              key={day.date}
              className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                    {day.dayName}
                  </span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                    PREDICTED
                  </span>
                </div>

                <div className="flex items-baseline gap-2 my-2">
                  <span className="text-3xl font-extrabold font-mono text-[#F8FAFC]">
                    {day.avgAqi}
                  </span>
                  <span className="text-xs text-[#94A3B8]">mean {scale}</span>
                </div>

                <div
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${day.category.bgClass} ${day.category.borderClass} ${day.category.textClass} mb-3`}
                >
                  {day.category.category}
                </div>

                <div className="space-y-1.5 text-xs text-[#94A3B8] bg-[#0D1422] p-2.5 rounded-xl border border-[#1F3045]/60 font-mono">
                  <div className="flex justify-between">
                    <span>Range:</span>
                    <strong className="text-[#F8FAFC]">{day.minAqi} – {day.maxAqi}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg PM2.5:</span>
                    <strong className="text-[#F8FAFC]">{day.avgPm25 ?? 'N/A'} µg/m³</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg PM10:</span>
                    <strong className="text-[#F8FAFC]">{day.avgPm10 ?? 'N/A'} µg/m³</strong>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#94A3B8] mt-3 leading-tight">
                {day.category.outdoorAdvice}
              </p>
            </div>
          ))}
        </div>}
      </div>

      {/* Anticipated Anomaly Spikes Warning */}
      {expectedSpikes.length > 0 && (
        <div className="bg-[#111C2D] border border-amber-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h4 className="text-base font-bold text-[#F8FAFC]">
              Anticipated High Pollution Episodes
            </h4>
          </div>
          <p className="text-xs text-[#94A3B8] mb-4">
            Simulated atmospheric stagnation indicates potential pollutant accumulation at these future intervals:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expectedSpikes.slice(0, 3).map((spike, idx) => (
              <div
                key={idx}
                className="bg-[#0D1422] border border-[#1F3045] p-3 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-[#F8FAFC] block">
                    {spike.time.replace('T', ' ')}
                  </span>
                  <span className="text-[11px] text-amber-400">
                    Est. PM2.5: {spike.value} µg/m³
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#94A3B8] bg-[#111C2D] px-2 py-1 rounded border border-[#1F3045]">
                  {spike.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
