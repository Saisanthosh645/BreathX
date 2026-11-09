import { useState, useEffect } from 'react';
import { LocationInfo, AQIScale, CurrentAirQualityData } from '../types/airQuality';
import { FEATURED_CITIES } from '../services/geocodingApi';
import { fetchLiveAirQuality } from '../services/airQualityApi';
import { getCategoryForScale } from '../utils/aqiCalculations';
import { formatDateTime } from '../utils/dateUtils';
import {
  Compass,
  Trophy,
  CheckCircle2,
  Navigation,
  Wind,
  Info,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface CleanAirFinderProps {
  currentLocation: LocationInfo;
  scale: AQIScale;
  onSelectCity: (loc: LocationInfo) => void;
}

interface RankedLocationItem {
  location: LocationInfo;
  data: CurrentAirQualityData | null;
  distanceKm: number;
  loading: boolean;
  error?: boolean;
}

// Haversine distance formula (in kilometers)
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function CleanAirFinder({
  currentLocation,
  scale,
  onSelectCity,
}: CleanAirFinderProps) {
  const [rankedList, setRankedList] = useState<RankedLocationItem[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  const loadAllRanked = async () => {
    setLoadingAll(true);

    const pool = FEATURED_CITIES;

    const initialItems: RankedLocationItem[] = pool.map((loc) => ({
      location: loc,
      data: null,
      distanceKm: calculateHaversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        loc.latitude,
        loc.longitude
      ),
      loading: true,
    }));

    setRankedList(initialItems);

    const fetchedItems = await Promise.all(
      pool.map(async (loc) => {
        try {
          const res = await fetchLiveAirQuality(loc);
          return {
            location: loc,
            data: res.current,
            distanceKm: calculateHaversineDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              loc.latitude,
              loc.longitude
            ),
            loading: false,
          };
        } catch {
          return {
            location: loc,
            data: null,
            distanceKm: calculateHaversineDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              loc.latitude,
              loc.longitude
            ),
            loading: false,
            error: true,
          };
        }
      })
    );

    // Sort by best (lowest) AQI value
    fetchedItems.sort((a, b) => {
      const aqiA =
        a.data
          ? scale === 'EAQI'
            ? a.data.europeanAqi
            : scale === 'USAQI'
            ? a.data.usAqi
            : a.data.indAqi
          : 999;
      const aqiB =
        b.data
          ? scale === 'EAQI'
            ? b.data.europeanAqi
            : scale === 'USAQI'
            ? b.data.usAqi
            : b.data.indAqi
          : 999;
      return (aqiA ?? 999) - (aqiB ?? 999);
    });

    setRankedList(fetchedItems);
    setLoadingAll(false);
  };

  useEffect(() => {
    loadAllRanked();
  }, [currentLocation, scale]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            Relative Atmospheric Purity Explorer
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">
            Clean Air Finder
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Relative comparison of air quality across monitored regions relative to your active position
          </p>
        </div>

        <button
          onClick={loadAllRanked}
          disabled={loadingAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D1422] border border-[#1F3045] hover:border-[#22C55E] text-xs font-semibold rounded-xl text-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAll ? 'animate-spin text-[#22C55E]' : ''}`} />
          <span>Re-evaluate Pool</span>
        </button>
      </div>

      {/* Honest Boundary Notice */}
      <div className="bg-[#0D1422] border border-[#1F3045] rounded-2xl p-4 text-xs text-[#94A3B8] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
        <span>
          <strong>Scientific Disclaimer:</strong> This finder ranks queried observation points. It does not claim to identify the single cleanest micro-climate point across an entire continent or city, as hyperlocal topography and street corridors vary. Rankings reflect the latest Copernicus model grid pull for each coordinate.
        </span>
      </div>

      {/* Ranked Grid */}
      {loadingAll ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rankedList.map((item, index) => {
            const { location, data, distanceKm, error } = item;
            if (error || !data) return null;

            const aqiVal =
              scale === 'EAQI'
                ? data.europeanAqi
                : scale === 'USAQI'
                ? data.usAqi
                : data.indAqi;
            const cat = getCategoryForScale(aqiVal, scale);
            const isWinner = index === 0;

            return (
              <div
                key={location.name}
                className={`bg-[#111C2D] border rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all relative group hover:border-[#22C55E]/60 ${
                  isWinner ? 'border-[#22C55E]' : 'border-[#1F3045]'
                }`}
              >
                {/* Ranking Tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono ${
                        isWinner
                          ? 'bg-[#22C55E] text-black shadow-md'
                          : 'bg-[#1F3045] text-[#F8FAFC]'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Cleanest in Pool
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-[#94A3B8] flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-[#38BDF8]" />
                    {distanceKm === 0 ? 'Current Location' : `${distanceKm} km away`}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-[#F8FAFC]">
                    {location.name}
                  </h4>
                  <span className="text-xs text-[#94A3B8]">{location.country}</span>

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

                  {/* Pollutant metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#0D1422] p-2.5 rounded-xl border border-[#1F3045]/60 mb-4 font-mono">
                    <div>
                      <span className="text-[#94A3B8] text-[10px] block">PM2.5</span>
                      <strong className="text-[#F8FAFC]">
                        {data.pollutants.pm2_5 != null ? `${data.pollutants.pm2_5} µg` : 'N/A'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] text-[10px] block">PM10</span>
                      <strong className="text-[#F8FAFC]">
                        {data.pollutants.pm10 != null ? `${data.pollutants.pm10} µg` : 'N/A'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Select button */}
                <button
                  onClick={() => onSelectCity(location)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-[#1F3045] hover:bg-[#22C55E] hover:text-black text-xs font-semibold rounded-xl text-[#F8FAFC] transition-all cursor-pointer"
                >
                  <span>Switch Focus to {location.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
