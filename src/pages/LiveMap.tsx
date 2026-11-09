import { useState, useMemo } from 'react';
import { LocationInfo, AQIScale } from '../types/airQuality';
import { MapView } from '../components/MapView';
import { Globe3D } from '../components/Globe3D';
import { FEATURED_CITIES } from '../services/geocodingApi';
import { GLOBAL_CITIES } from '../data/globalCities';
import { soundFx } from '../utils/audioFx';
import {
  MapPin,
  Flame,
  Globe2,
  Compass,
  Layers,
  Sparkles,
  Activity,
  Wind,
  Info,
  Search,
  Filter,
} from 'lucide-react';

interface LiveMapProps {
  currentLocation: LocationInfo;
  currentAqi: number | null;
  currentPm25: number | null;
  currentPm10: number | null;
  currentTimestamp: string | null;
  scale: AQIScale;
  onSelectLocation: (loc: LocationInfo) => void;
}

const CORRIDOR_CARDS = [
  {
    name: 'Indo-Gangetic Haze Corridor',
    path: 'Punjab → Delhi → Kolkata → Bay of Bengal',
    color: '#F59E0B',
    type: 'Dense Seasonal Aerosol',
    desc: 'Trapped seasonal smoke & particulate matter channeling down the Himalayan valley toward the Bay of Bengal.',
  },
  {
    name: 'Trans-Atlantic Saharan Dust Highway',
    path: 'Chad/Sahara → Cape Verde → Caribbean Basin',
    color: '#F97316',
    type: 'Mineral Dust Stream',
    desc: 'Annual trans-oceanic transport of 180+ million tons of mineral dust fertilizing the Atlantic & Amazon.',
  },
  {
    name: 'North Pacific Industrial Jetstream',
    path: 'Beijing/Hebei → Tokyo → Pacific → California',
    color: '#38BDF8',
    type: 'Trans-Pacific Jetstream',
    desc: 'Upper-tropospheric westerly winds carrying fine particulate matter & ozone precursors across the Pacific.',
  },
  {
    name: 'North American Westerly Corridor',
    path: 'Great Lakes → New York → North Atlantic → UK',
    color: '#22C55E',
    type: 'Tropospheric Drift',
    desc: 'Marine westerly air circulation connecting eastern North American air masses to the British Isles.',
  },
];

export function LiveMap({
  currentLocation,
  currentAqi,
  currentPm25,
  currentPm10,
  currentTimestamp,
  scale,
  onSelectLocation,
}: LiveMapProps) {
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [hubContinent, setHubContinent] = useState<string>('All');
  const [hubSearch, setHubSearch] = useState('');

  // Filtered global observation hubs
  const displayedHubs = useMemo(() => {
    return GLOBAL_CITIES.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(hubSearch.toLowerCase()) ||
        c.country.toLowerCase().includes(hubSearch.toLowerCase());
      const matchCont = hubContinent === 'All' || c.continent === hubContinent;
      return matchSearch && matchCont;
    });
  }, [hubSearch, hubContinent]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">
            <Globe2 className="w-4 h-4" />
            NASA Satellite Earth & Global AQI Telemetry
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">
            {viewMode === '3D' ? 'Photorealistic 3D Satellite Earth' : 'Spatial Model Grid Map'}
          </h2>
          <p className="text-xs text-[#94A3B8]">
            {viewMode === '3D'
              ? 'Satellite terrain and city locations. Select a city to fetch its current CAMS model estimate.'
              : 'Sub-grid coordinate mapping with detailed ground telemetry popups and spatial legends.'}
          </p>
        </div>

        {/* View Mode Toggle & City Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 3D vs 2D Switcher */}
          <div className="inline-flex bg-[#0D1422] p-1 rounded-xl border border-[#1F3045]">
            <button
              onClick={() => {
                soundFx.playClickTone();
                setViewMode('3D');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === '3D'
                  ? 'bg-[#22C55E] text-black font-bold shadow-md'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>3D Satellite Globe</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickTone();
                setViewMode('2D');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === '2D'
                  ? 'bg-[#22C55E] text-black font-bold shadow-md'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Grid Map</span>
            </button>
          </div>

          {/* Quick City Switcher */}
          <div className="hidden xl:flex items-center gap-1.5">
            {FEATURED_CITIES.slice(0, 4).map((city) => (
              <button
                key={city.name}
                onClick={() => {
                  soundFx.playCityLockChime();
                  onSelectLocation(city);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentLocation.name === city.name
                    ? 'bg-[#1F3045] text-[#22C55E] font-bold border border-[#22C55E]/40'
                    : 'bg-[#0D1422] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1F3045]'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visualization View: 3D Realistic Satellite Globe or 2D Leaflet Map */}
      {viewMode === '3D' ? (
        <Globe3D
          key={`${currentLocation.latitude}:${currentLocation.longitude}:${currentAqi ?? 'unavailable'}`}
          selectedLocation={currentLocation}
          onSelectLocation={onSelectLocation}
          currentAqi={currentAqi}
          scale={scale}
          height="660px"
        />
      ) : (
        <MapView
          currentLocation={currentLocation}
          currentAqi={currentAqi}
          currentPm25={currentPm25}
          currentPm10={currentPm10}
          currentTimestamp={currentTimestamp}
          scale={scale}
          onSelectLocation={onSelectLocation}
        />
      )}

      {/* Transboundary Jetstream Intelligence Corridors */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#38BDF8]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#F8FAFC]">
              Major Planetary Aerosol Transport Corridors
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Continuous transboundary air masses mapped dynamically on the 3D Globe
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CORRIDOR_CARDS.map((corridor) => (
            <div
              key={corridor.name}
              className="bg-[#0D1422] border border-[#1F3045] p-4 rounded-2xl flex flex-col justify-between hover:border-[#38BDF8]/40 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: corridor.color }}
                  />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#111C2D] text-[#94A3B8]">
                    {corridor.type}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors">
                  {corridor.name}
                </h4>
                <p className="text-[11px] font-mono text-[#38BDF8] my-1">
                  {corridor.path}
                </p>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-[#1F3045]/60 leading-relaxed">
                {corridor.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* All Places AQI Directory Hubs: "give all aqi of every place" */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#1F3045]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#22C55E]">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#F8FAFC]">
                Global AQI Directory — All Places ({displayedHubs.length} Active Hubs)
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Select a city to fetch its current Open-Meteo CAMS model estimate. These are not ground-station observations.
              </p>
            </div>
          </div>

          {/* Search Input and Continent Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hubSearch}
                onChange={(e) => setHubSearch(e.target.value)}
                placeholder="Search any place..."
                className="bg-[#0D1422] border border-[#1F3045] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#0D1422] p-1 rounded-xl border border-[#1F3045]">
              {['All', 'Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'].map(
                (cont) => (
                  <button
                    key={cont}
                    onClick={() => setHubContinent(cont)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      hubContinent === cont
                        ? 'bg-[#22C55E] text-black font-bold'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {cont}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Global Cities Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {displayedHubs.map((city) => {
            const isSelected = currentLocation.name === city.name;
            return (
              <div
                key={city.name}
                onClick={() => {
                  soundFx.playCityLockChime();
                  onSelectLocation(city);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#1F3045] border-[#22C55E] shadow-lg shadow-emerald-500/10'
                    : 'bg-[#0D1422] border-[#1F3045] hover:border-[#38BDF8]/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div>
                      <strong className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors">
                        {city.name}
                      </strong>
                      <div className="text-[11px] text-[#94A3B8]">
                        {city.country} • <span className="font-mono text-[#38BDF8]">{city.continent}</span>
                      </div>
                    </div>

                  </div>

                  <p className="text-[11px] text-[#94A3B8] line-clamp-2 mt-1 leading-relaxed">
                    {city.country} • Select this location to load its current air-quality estimate.
                  </p>

                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1F3045]/60 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                  <span>Location directory</span>
                  <span className="text-[#38BDF8] group-hover:translate-x-0.5 transition-transform">
                    Fly to &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
