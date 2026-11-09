import { useState } from 'react';
import { CurrentAirQualityData, AQIScale } from '../types/airQuality';
import { getCategoryForScale } from '../utils/aqiCalculations';
import { formatDateTime } from '../utils/dateUtils';
import { generateTextReport, downloadJsonReport } from '../utils/exportReport';
import { X, Check, Copy, Download, Share2, Wind, ShieldCheck } from 'lucide-react';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CurrentAirQualityData;
  scale: AQIScale;
}

export function ShareCardModal({
  isOpen,
  onClose,
  data,
  scale,
}: ShareCardModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const aqiVal = scale === 'EAQI' ? data.europeanAqi : scale === 'USAQI' ? data.usAqi : data.indAqi;
  const category = getCategoryForScale(aqiVal, scale);

  const handleCopyText = async () => {
    const report = generateTextReport(data, scale);
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    downloadJsonReport(data, scale);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1F3045] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#22C55E]" />
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Shareable Environmental Intelligence Card
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1F3045] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Visual Share Card Preview */}
        <div className="p-6">
          <div
            id="breathex-shareable-card"
            className="bg-[#080D18] border-2 border-[#1F3045] rounded-2xl p-6 relative overflow-hidden shadow-2xl"
          >
            {/* Ambient Corner Glow */}
            <div
              className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{ backgroundColor: category.color }}
            />

            {/* Top Brand Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[#22C55E]">
                  <Wind className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm tracking-wider text-[#F8FAFC]">
                  BREATHE<span className="text-[#22C55E]">X</span>
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#94A3B8] border border-[#1F3045] px-2 py-0.5 rounded">
                Verified Sensor Telemetry
              </span>
            </div>

            {/* Location & AQI Highlight */}
            <div className="flex items-end justify-between my-5">
              <div>
                <h4 className="text-2xl font-black text-[#F8FAFC]">
                  {data.location.name}
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  {data.location.country || 'Global Monitor'} • {data.location.latitude.toFixed(2)}°N, {data.location.longitude.toFixed(2)}°E
                </p>
                <div
                  className={`mt-2.5 inline-block px-3 py-1 rounded-full text-xs font-bold border ${category.bgClass} ${category.borderClass} ${category.textClass}`}
                >
                  {category.category} Air Quality
                </div>
              </div>

              <div className="text-right">
                <div className="text-5xl font-black font-mono tracking-tight text-[#F8FAFC]">
                  {aqiVal ?? '--'}
                </div>
                <span className="text-[11px] font-mono text-[#94A3B8] block">
                  {scale} Index
                </span>
              </div>
            </div>

            {/* Pollutants Matrix */}
            <div className="grid grid-cols-3 gap-2 my-4 bg-[#0D1422] p-3 rounded-xl border border-[#1F3045]/60">
              <div>
                <span className="text-[10px] text-[#94A3B8] block">PM2.5</span>
                <strong className="text-sm font-mono text-[#F8FAFC]">
                  {data.pollutants.pm2_5 != null ? `${data.pollutants.pm2_5} µg` : 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">PM10</span>
                <strong className="text-sm font-mono text-[#F8FAFC]">
                  {data.pollutants.pm10 != null ? `${data.pollutants.pm10} µg` : 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">NO2</span>
                <strong className="text-sm font-mono text-[#F8FAFC]">
                  {data.pollutants.no2 != null ? `${data.pollutants.no2} µg` : 'N/A'}
                </strong>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-3 border-t border-[#1F3045]/50 flex items-center justify-between text-[10px] text-[#94A3B8] font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#22C55E]" />
                Copernicus CAMS via Open-Meteo
              </span>
              <span>{formatDateTime(data.timestamp)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleCopyText}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1F3045] hover:bg-[#2A415E] text-[#F8FAFC] font-semibold rounded-xl text-sm transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#22C55E]" />
                  <span>Copied Report!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
