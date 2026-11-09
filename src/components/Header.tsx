import { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  RefreshCw,
  Bell,
  Navigation,
  Menu,
  ChevronDown,
  Sun,
} from 'lucide-react';
import { LocationInfo, AQIScale } from '../types/airQuality';
import { searchCities, FEATURED_CITIES } from '../services/geocodingApi';

interface HeaderProps {
  pageTitle: string;
  currentLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string | null;
  activeScale: AQIScale;
  onScaleChange: (scale: AQIScale) => void;
  onOpenAlerts: () => void;
  onOpenShare: () => void;
  onToggleMobileMenu: () => void;
  onUseCurrentLocation: () => Promise<void>;
  isLocating: boolean;
  alertsCount?: number;
  weatherTemp?: number | null;
  weatherDesc?: string;
}

export function Header({
  currentLocation,
  onSelectLocation,
  onOpenAlerts,
  onToggleMobileMenu,
  onUseCurrentLocation,
  isLocating,
  alertsCount = 2,
  weatherTemp,
  weatherDesc,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const cityPickerRef = useRef<HTMLDivElement>(null);

  const displayTemp = weatherTemp != null ? weatherTemp : 32;
  const displayDesc = weatherDesc || 'Partly Cloudy';

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        cityPickerRef.current &&
        !cityPickerRef.current.contains(event.target as Node)
      ) {
        setShowCityPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = (loc: LocationInfo) => {
    onSelectLocation(loc);
    setSearchQuery('');
    setShowDropdown(false);
    setShowCityPicker(false);
  };

  return (
    <header className="h-16 bg-[#090E17]/90 border-b border-[#152234] px-4 md:px-6 flex items-center sticky top-0 z-30 backdrop-blur-md">
      {/* Mobile Menu Button */}
      <button
        onClick={onToggleMobileMenu}
        className="lg:hidden p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2D] border border-[#18273D] cursor-pointer mr-3 flex-shrink-0"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: Search Input */}
      <div
        ref={searchContainerRef}
        className="relative flex-1 max-w-md lg:max-w-lg"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search city, area..."
            className="w-full bg-[#0D1524] border border-[#18273D] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 rounded-full pl-11 pr-10 py-2 text-xs md:text-sm text-[#F8FAFC] placeholder-[#64748B] transition-all outline-none"
          />
          {isSearching && (
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D1524] border border-[#1F3045] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="p-1.5">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Matching Stations
                </div>
                {searchResults.map((city) => (
                  <button
                    key={`${city.latitude}-${city.longitude}-${city.name}`}
                    onClick={() => handleSelectCity(city)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-[#152234] transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs md:text-sm font-semibold text-[#F8FAFC] group-hover:text-emerald-400">
                        {city.name}
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">
                        {[city.admin1, city.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="p-4 text-center text-xs text-[#94A3B8]">
                No matching cities found. Try another query.
              </div>
            ) : (
              <div className="p-2">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Popular Cities
                </div>
                {FEATURED_CITIES.slice(0, 5).map((city) => (
                  <button
                    key={city.name}
                    onClick={() => handleSelectCity(city)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#152234] transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="text-[#F8FAFC] font-medium">{city.name}</span>
                    <span className="text-[#94A3B8] text-[11px]">{city.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 ml-4">
        {/* Weather Display */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Sun gradient circle */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold font-mono text-[#F8FAFC] tracking-tight">
              {displayTemp}°C
            </span>
            <span className="text-[11px] text-[#94A3B8] -mt-0.5">
              {displayDesc}
            </span>
          </div>
        </div>

        {/* Divider — visible on md+ */}
        <div className="hidden md:block w-px h-8 bg-[#18273D]" />

        {/* Location Dropdown */}
        <div ref={cityPickerRef} className="relative hidden sm:block">
          <button
            onClick={() => setShowCityPicker(!showCityPicker)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#0D1524] border border-[#18273D] hover:border-emerald-400/40 text-xs font-semibold text-[#F8FAFC] transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[80px] truncate">{currentLocation.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
          </button>

          {showCityPicker && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#0D1524] border border-[#1F3045] rounded-2xl shadow-2xl p-1.5 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Select Location
              </div>
              <button
                onClick={async () => {
                  await onUseCurrentLocation();
                  setShowCityPicker(false);
                }}
                disabled={isLocating}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 hover:bg-[#152234] cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
              </button>
              <div className="my-1 border-t border-[#18273D]" />
              {FEATURED_CITIES.slice(0, 6).map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleSelectCity(city)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    city.name === currentLocation.name
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'text-[#F8FAFC] hover:bg-[#152234]'
                  }`}
                >
                  <span>{city.name}</span>
                  <span className="text-[10px] text-[#94A3B8]">{city.countryCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell with badge */}
        <button
          onClick={onOpenAlerts}
          title="Notifications & Smart Alerts"
          className="relative p-2.5 rounded-full bg-[#0D1524] border border-[#18273D] hover:border-emerald-400/40 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer flex-shrink-0"
        >
          <Bell className="w-4 h-4" />
          {alertsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-md">
              {alertsCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0 cursor-pointer ring-2 ring-[#152234]">
          <span className="text-xs font-bold text-white">U</span>
        </div>

        {/* Chevron Down */}
        <ChevronDown className="w-4 h-4 text-[#64748B] hidden sm:block cursor-pointer hover:text-[#F8FAFC] transition-colors" />
      </div>
    </header>
  );
}
