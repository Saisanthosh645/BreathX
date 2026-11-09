import { useState } from 'react';
import { AQIScale, AlertSetting } from '../types/airQuality';
import { clearAirQualityCache } from '../services/airQualityApi';
import {
  Settings as SettingsIcon,
  Sliders,
  Bell,
  Trash2,
  Database,
  ShieldCheck,
  Check,
  Info,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface SettingsProps {
  scale: AQIScale;
  onScaleChange: (scale: AQIScale) => void;
  alerts: AlertSetting[];
  onAddAlert: (alert: Omit<AlertSetting, 'id'>) => void;
  onRemoveAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  permission: NotificationPermission;
  onRequestPermission: () => Promise<boolean>;
  currentCityName: string;
  currentLat: number;
  currentLon: number;
}

export function Settings({
  scale,
  onScaleChange,
  alerts,
  onAddAlert,
  onRemoveAlert,
  onToggleAlert,
  permission,
  onRequestPermission,
  currentCityName,
  currentLat,
  currentLon,
}: SettingsProps) {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [newCity, setNewCity] = useState(currentCityName);
  const [newThreshold, setNewThreshold] = useState(100);
  const [newScale, setNewScale] = useState<AQIScale>(scale);

  const handleClearCache = () => {
    clearAirQualityCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim()) return;
    onAddAlert({
      locationName: newCity.trim(),
      latitude: currentLat,
      longitude: currentLon,
      threshold: newThreshold,
      scale: newScale,
      enabled: true,
      browserNotify: true,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">
          <Sliders className="w-4 h-4" />
          System Preferences &amp; Data Pipeline
        </div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC]">
          BreatheX Platform Settings
        </h2>
        <p className="text-xs text-[#94A3B8]">
          Configure calculation formulas, active AQI standards, threshold alerts, and telemetry cache
        </p>
      </div>

      {/* 1. Default AQI Standard Preference */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Default Air Quality Calculation Methodology
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Select which regulatory methodology is used for gauge indicators and summaries
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-1 rounded">
            Active: {scale}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* US EPA */}
          <div
            onClick={() => onScaleChange('USAQI')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              scale === 'USAQI'
                ? 'bg-[#1F3045] border-[#22C55E]'
                : 'bg-[#0D1422] border-[#1F3045] hover:border-[#1F3045]/80'
            }`}
          >
            <strong className="text-sm text-[#F8FAFC] block mb-1">US EPA AQI</strong>
            <p className="text-xs text-[#94A3B8] leading-snug">
              0-500 scale based on United States Environmental Protection Agency breakpoints for PM2.5 and PM10.
            </p>
          </div>

          {/* European EAQI */}
          <div
            onClick={() => onScaleChange('EAQI')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              scale === 'EAQI'
                ? 'bg-[#1F3045] border-[#22C55E]'
                : 'bg-[#0D1422] border-[#1F3045] hover:border-[#1F3045]/80'
            }`}
          >
            <strong className="text-sm text-[#F8FAFC] block mb-1">European EAQI</strong>
            <p className="text-xs text-[#94A3B8] leading-snug">
              0-100+ index standardized by European Environment Agency (EEA) covering Good to Extremely Poor.
            </p>
          </div>

          {/* Indian NAQI */}
          <div
            onClick={() => onScaleChange('INDAQI')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              scale === 'INDAQI'
                ? 'bg-[#1F3045] border-[#22C55E]'
                : 'bg-[#0D1422] border-[#1F3045] hover:border-[#1F3045]/80'
            }`}
          >
            <strong className="text-sm text-[#F8FAFC] block mb-1">Indian National AQI</strong>
            <p className="text-xs text-[#94A3B8] leading-snug">
              CPCB standard index (0-500) formulated for tropical South Asian particulate profiles.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Smart AQI Alerts Configuration */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Smart Threshold Alerts
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Receive browser notifications when monitored locations cross safe pollution thresholds
            </p>
          </div>

          {permission !== 'granted' ? (
            <button
              onClick={onRequestPermission}
              className="px-3 py-1.5 bg-[#38BDF8] hover:bg-[#0284c7] text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Grant Browser Notification Permission
            </button>
          ) : (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> Notifications Active
            </span>
          )}
        </div>

        {/* Notice distinguishing from SMS/Email */}
        <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-3 text-xs text-[#94A3B8] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <span>
            <strong>Delivery Mode:</strong> In-app / Web Push Notifications only. BreatheX does not transmit SMS or email alerts to ensure total privacy and avoid collecting phone numbers.
          </span>
        </div>

        {/* Add Alert Form */}
        <form onSubmit={handleCreateRule} className="bg-[#080D18] border border-[#1F3045] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[#94A3B8] block mb-1">Target City</label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full bg-[#111C2D] border border-[#1F3045] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] outline-none focus:border-[#22C55E]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#94A3B8] block mb-1">AQI Standard</label>
              <select
                value={newScale}
                onChange={(e) => setNewScale(e.target.value as AQIScale)}
                className="w-full bg-[#111C2D] border border-[#1F3045] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] outline-none focus:border-[#22C55E]"
              >
                <option value="USAQI">US EPA AQI</option>
                <option value="EAQI">European EAQI</option>
                <option value="INDAQI">Indian CPCB AQI</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#94A3B8] block mb-1">
                Threshold: &gt; <strong className="text-[#F8FAFC]">{newThreshold}</strong>
              </label>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={newThreshold}
                onChange={(e) => setNewThreshold(Number(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer mt-1"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Alert Trigger
          </button>
        </form>

        {/* Existing Alerts List */}
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 bg-[#0D1422] border border-[#1F3045] rounded-xl flex items-center justify-between text-xs"
            >
              <div>
                <strong className="text-[#F8FAFC] text-sm mr-2">{alert.locationName}</strong>
                <span className="text-[#94A3B8]">
                  Notify when {alert.scale} &gt; {alert.threshold}
                </span>
                {alert.lastNotifiedTime && (
                  <span className="text-[10px] text-amber-400 block font-mono">
                    Last triggered: {new Date(alert.lastNotifiedTime).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleAlert(alert.id)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                    alert.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {alert.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => onRemoveAlert(alert.id)}
                  className="text-[#94A3B8] hover:text-rose-400 p-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Cache & Network Ingestion Management */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Telemetry Memory Cache
            </h3>
            <p className="text-xs text-[#94A3B8]">
              BreatheX temporarily caches API responses for 10 minutes to respect Open-Meteo open-access rate limits.
            </p>
          </div>

          <button
            onClick={handleClearCache}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F3045] hover:bg-rose-500/20 hover:text-rose-300 text-xs font-semibold rounded-xl text-[#F8FAFC] transition-colors cursor-pointer"
          >
            {cacheCleared ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Cache Cleared!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Flush In-Memory Cache</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Complete Data Methodology & Provenance Section */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
          <h3 className="text-base font-bold text-[#F8FAFC]">
            Environmental Data Methodology &amp; Provenance
          </h3>
        </div>

        <div className="text-xs text-[#94A3B8] leading-relaxed space-y-2">
          <p>
            <strong>Primary Data Pipeline:</strong> BreatheX ingests data from the open Open-Meteo Air Quality API suite, which assimilates global numerical atmospheric composition forecasts provided by the Copernicus Atmosphere Monitoring Service (CAMS) and national meteorological agencies at an 11 km horizontal grid spacing.
          </p>
          <p>
            <strong>Observation vs Model:</strong> Real-time urban measurements reflect high-resolution numerical models combined with optical and satellite aerosol depth measurements. When ground-sensor readings are unavailable, the platform explicitly marks the pollutant as N/A rather than generating synthetic measurements.
          </p>
          <p>
            <strong>AI Grounding:</strong> The BreatheX AI assistant runs on Gemini 3.8 Flash via a protected server proxy. Prompt payloads strictly embed current telemetry as system context to eliminate model hallucinations.
          </p>
        </div>
      </div>
    </div>
  );
}
