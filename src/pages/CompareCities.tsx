import { useState, useEffect } from 'react';
import { LocationInfo, AQIScale, CurrentAirQualityData } from '../types/airQuality';
import { FEATURED_CITIES, searchCities } from '../services/geocodingApi';
import { fetchLiveAirQuality } from '../services/airQualityApi';
import { getCategoryForScale } from '../utils/aqiCalculations';
import { formatDateTime } from '../utils/dateUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  GitCompare,
  Plus,
  Trash2,
  Trophy,
  Search,
  RefreshCw,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface CompareCitiesProps {
  initialCity: LocationInfo;
  scale: AQIScale;
}

interface CityComparisonItem {
  location: LocationInfo;
  data: CurrentAirQualityData | null;
  loading: boolean;
  error?: string;
}

export function CompareCities({ initialCity, scale }: CompareCitiesProps) {
  const [comparedCities, setComparedCities] = useState<CityComparisonItem[]>([
    { location: initialCity, data: null, loading: true },
    { location: FEATURED_CITIES[1], data: null, loading: true }, // New Delhi
    { location: FEATURED_CITIES[2], data: null, loading: true }, // London
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load telemetry for any city missing data
  useEffect(() => {
    comparedCities.forEach(async (item, index) => {
      if (item.data === null && item.loading) {
        try {
          const res = await fetchLiveAirQuality(item.location);
          setComparedCities((prev) =>
            prev.map((c, idx) =>
              idx === index ? { ...c, data: res.current, loading: false } : c
            )
          );
        } catch (err: any) {
          setComparedCities((prev) =>
            prev.map((c, idx) =>
              idx === index
                ? { ...c, loading: false, error: 'Failed to load telemetry' }
                : c
            )
          );
        }
      }
    });
  }, [comparedCities]);

  // Search autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(searchQuery);
        setSearchResults(results.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddCity = (city: LocationInfo) => {
    if (comparedCities.length >= 4) return;
    if (comparedCities.some((c) => c.location.name.toLowerCase() === city.name.toLowerCase())) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    setComparedCities((prev) => [
      ...prev,
      { location: city, data: null, loading: true },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveCity = (name: string) => {
    if (comparedCities.length <= 1) return;
    setComparedCities((prev) =>
      prev.filter((c) => c.location.name !== name)
    );
  };

  // Find relatively cleanest city using functional reduce
  const cleanestCity = comparedCities.reduce<CityComparisonItem | null>((best, c) => {
    if (!c.data) return best;
    const aqi =
      scale === 'EAQI'
        ? c.data.europeanAqi
        : scale === 'USAQI'
        ? c.data.usAqi
        : c.data.indAqi;
    if (aqi === null) return best;
    if (!best || !best.data) return c;
    const bestAqi =
      scale === 'EAQI'
        ? best.data.europeanAqi
        : scale === 'USAQI'
        ? best.data.usAqi
        : best.data.indAqi;
    return bestAqi === null || aqi < bestAqi ? c : best;
  }, null);

  const lowestAqi = cleanestCity?.data
    ? scale === 'EAQI'
      ? cleanestCity.data.europeanAqi
      : scale === 'USAQI'
      ? cleanestCity.data.usAqi
      : cleanestCity.data.indAqi
    : null;

  // Prepare chart comparison data
  const chartData = comparedCities
    .filter((c) => c.data !== null)
    .map((c) => {
      const aqi =
        scale === 'EAQI'
          ? c.data!.europeanAqi
          : scale === 'USAQI'
          ? c.data!.usAqi
          : c.data!.indAqi;
      return {
        name: c.location.name,
        aqi: aqi ?? 0,
        pm25: c.data!.pollutants.pm2_5 ?? 0,
        pm10: c.data!.pollutants.pm10 ?? 0,
        no2: c.data!.pollutants.no2 ?? 0,
      };
    });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">
            <GitCompare className="w-4 h-4" />
            Cross-Metropolitan Analysis
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">
            Multi-City Air Quality Comparison
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Compare up to 4 global cities simultaneously using aligned standards ({scale})
          </p>
        </div>

        {/* Add City Search Box */}
        {comparedCities.length < 4 && (
          <div className="relative w-full md:w-80">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Add city to compare..."
                className="w-full bg-[#0D1422] border border-[#1F3045] focus:border-[#22C55E] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 outline-none"
              />
              {isSearching && (
                <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D1422] border border-[#1F3045] rounded-xl shadow-2xl overflow-hidden z-50">
                {searchResults.map((city) => (
                  <button
                    key={`${city.name}-${city.latitude}`}
                    onClick={() => handleAddCity(city)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#1F3045] transition-colors flex items-center justify-between text-[#F8FAFC] cursor-pointer"
                  >
                    <span>{city.name}, {city.country}</span>
                    <Plus className="w-3.5 h-3.5 text-[#22C55E]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Best Relative Quality Banner */}
      {cleanestCity && cleanestCity.data && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-[#111C2D] to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#22C55E]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                Relatively Cleaner Air
              </span>
              <h3 className="text-lg font-bold text-[#F8FAFC]">
                {cleanestCity.location.name} is currently the cleanest among compared locations
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Recorded {scale} is {lowestAqi}. Note: Cleaner relative to this set does not imply completely pollution-free air.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* City Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {comparedCities.map((item) => {
          const { location, data, loading, error } = item;
          if (loading) {
            return (
              <div key={location.name} className="h-64">
                <LoadingSkeleton className="h-full w-full" />
              </div>
            );
          }

          if (error || !data) {
            return (
              <div
                key={location.name}
                className="bg-[#111C2D] border border-rose-500/30 rounded-2xl p-5 text-center flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-[#F8FAFC]">{location.name}</h4>
                  <p className="text-xs text-rose-400 mt-2">Data currently unavailable</p>
                </div>
                <button
                  onClick={() => handleRemoveCity(location.name)}
                  className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] underline mt-4"
                >
                  Remove
                </button>
              </div>
            );
          }

          const aqiVal =
            scale === 'EAQI'
              ? data.europeanAqi
              : scale === 'USAQI'
              ? data.usAqi
              : data.indAqi;
          const cat = getCategoryForScale(aqiVal, scale);
          const isBest = cleanestCity?.location.name === location.name;

          return (
            <div
              key={location.name}
              className={`bg-[#111C2D] border rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all relative ${
                isBest ? 'border-[#22C55E]' : 'border-[#1F3045]'
              }`}
            >
              {isBest && (
                <span className="absolute top-3 right-3 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Best Index
                </span>
              )}

              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-bold text-[#F8FAFC]">
                      {location.name}
                    </h4>
                    <span className="text-xs text-[#94A3B8]">{location.country}</span>
                  </div>

                  {comparedCities.length > 1 && (
                    <button
                      onClick={() => handleRemoveCity(location.name)}
                      className="text-[#94A3B8] hover:text-rose-400 p-1 cursor-pointer"
                      title="Remove from comparison"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Primary AQI Display */}
                <div className="flex items-baseline gap-2 my-3">
                  <span className="text-4xl font-extrabold font-mono text-[#F8FAFC]">
                    {aqiVal ?? '--'}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono">{scale}</span>
                </div>

                <div
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cat.bgClass} ${cat.borderClass} ${cat.textClass} mb-4`}
                >
                  {cat.category}
                </div>

                {/* Key Pollutants breakdown */}
                <div className="space-y-2 text-xs bg-[#0D1422] p-3 rounded-xl border border-[#1F3045]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">PM2.5:</span>
                    <strong className="text-[#F8FAFC] font-mono">
                      {data.pollutants.pm2_5 != null ? `${data.pollutants.pm2_5} µg/m³` : 'N/A'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">PM10:</span>
                    <strong className="text-[#F8FAFC] font-mono">
                      {data.pollutants.pm10 != null ? `${data.pollutants.pm10} µg/m³` : 'N/A'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">NO2:</span>
                    <strong className="text-[#F8FAFC] font-mono">
                      {data.pollutants.no2 != null ? `${data.pollutants.no2} µg/m³` : 'N/A'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#1F3045]/40">
                    <span className="text-[#94A3B8]">Dominant:</span>
                    <span className="text-[#38BDF8] font-semibold">{data.dominantPollutant || 'PM2.5'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F3045]/60 mt-4 text-[10px] text-[#94A3B8] font-mono">
                Observed: {formatDateTime(data.timestamp)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AQI Comparison Bar Chart */}
          <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#F8FAFC] mb-1">
              Relative {scale} Index Comparison
            </h3>
            <p className="text-xs text-[#94A3B8] mb-4">
              Direct comparison under uniform scale standards
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F3045" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1422',
                      borderColor: '#1F3045',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="aqi" fill="#22C55E" name={`${scale} Value`} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PM2.5 vs PM10 Concentration Breakdown */}
          <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#F8FAFC] mb-1">
              Particulate Concentrations (µg/m³)
            </h3>
            <p className="text-xs text-[#94A3B8] mb-4">
              Side-by-side fine (PM2.5) vs coarse (PM10) particulate density
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F3045" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
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
                  <Bar dataKey="pm25" fill="#38BDF8" name="PM2.5 (µg/m³)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pm10" fill="#F59E0B" name="PM10 (µg/m³)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Methodology Disclaimer */}
      <div className="bg-[#0D1422] border border-[#1F3045] rounded-2xl p-4 text-xs text-[#94A3B8] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
        <span>
          <strong>Scientific Comparison Policy:</strong> All locations are queried with identical API parameters and compared using the same calculation methodology. Even the relatively cleaner location may exceed WHO annual or daily thresholds; always review absolute pollutant concentrations.
        </span>
      </div>
    </div>
  );
}
