import { useState } from 'react';
import { AlertSetting, AQIScale } from '../types/airQuality';
import { Bell, Plus, Trash2, X, Check, BellRing } from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertSetting[];
  permission: NotificationPermission;
  onRequestPermission: () => Promise<boolean>;
  onAddAlert: (alert: Omit<AlertSetting, 'id'>) => void;
  onRemoveAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  currentCity: string;
  currentLat: number;
  currentLon: number;
  currentScale: AQIScale;
}

export function AlertsModal({
  isOpen,
  onClose,
  alerts,
  permission,
  onRequestPermission,
  onAddAlert,
  onRemoveAlert,
  onToggleAlert,
  currentCity,
  currentLat,
  currentLon,
  currentScale,
}: AlertsModalProps) {
  const [threshold, setThreshold] = useState<number>(100);
  const [cityInput, setCityInput] = useState<string>(currentCity);
  const [scale, setScale] = useState<AQIScale>(currentScale);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!cityInput.trim()) return;
    onAddAlert({
      locationName: cityInput.trim(),
      latitude: currentLat,
      longitude: currentLon,
      threshold,
      scale,
      enabled: true,
      browserNotify: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        <div className="p-5 border-b border-[#1F3045] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-[#38BDF8]" />
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Smart AQI Health Alerts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1F3045] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Permission Status */}
          <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#94A3B8] block">Browser Notifications</span>
              <strong className="text-sm text-[#F8FAFC]">
                Status: {permission === 'granted' ? 'Allowed' : permission === 'denied' ? 'Blocked' : 'Not Requested'}
              </strong>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={onRequestPermission}
                className="px-3 py-1.5 bg-[#38BDF8] hover:bg-[#0284c7] text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Enable Notifications
              </button>
            )}
            {permission === 'granted' && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-4 h-4" /> Ready
              </span>
            )}
          </div>

          {/* Create Alert Form */}
          <div className="bg-[#080D18] border border-[#1F3045] rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Add New Threshold Rule
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#94A3B8] block mb-1">City Location</label>
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full bg-[#111C2D] border border-[#1F3045] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#94A3B8] block mb-1">Scale</label>
                <select
                  value={scale}
                  onChange={(e) => setScale(e.target.value as AQIScale)}
                  className="w-full bg-[#111C2D] border border-[#1F3045] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="USAQI">US EPA AQI</option>
                  <option value="EAQI">European AQI</option>
                  <option value="INDAQI">Indian CPCB AQI</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#94A3B8]">Alert me when AQI exceeds:</span>
                <span className="font-mono font-bold text-[#F8FAFC] text-sm">{threshold}</span>
              </div>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            <button
              onClick={handleCreate}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Alert Rule
            </button>
          </div>

          {/* Active Rules List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2.5">
              Configured Alert Triggers ({alerts.length})
            </h4>

            {alerts.length === 0 ? (
              <p className="text-xs text-[#94A3B8]/70 italic">No alert triggers saved.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl bg-[#0D1422] border border-[#1F3045] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-[#F8FAFC]">{alert.locationName}</strong>
                        <span className="text-[10px] font-mono bg-[#111C2D] border border-[#1F3045] px-1.5 py-0.2 rounded text-[#38BDF8]">
                          {alert.scale}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#94A3B8]">
                        Trigger at AQI &gt; {alert.threshold}
                      </span>
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
                        {alert.enabled ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => onRemoveAlert(alert.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
