import {
  Thermometer,
  Droplets,
  Wind,
  CloudSun,
  Compass,
} from 'lucide-react';

interface WeatherCardProps {
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  weatherDescription: string;
}

export function WeatherCard({
  temperature,
  apparentTemperature,
  humidity,
  windSpeed,
  windDirection,
  weatherDescription,
}: WeatherCardProps) {
  // Atmospheric dispersion rating
  let dispersion = {
    label: 'Moderate Dispersion',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    desc: 'Moderate breeze circulating ambient particulates.',
  };

  if (windSpeed !== null) {
    if (windSpeed < 6) {
      dispersion = {
        label: 'Stagnant (Trapped Pollutants)',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        desc: 'Low wind speeds trap pollution close to surface level.',
      };
    } else if (windSpeed > 18) {
      dispersion = {
        label: 'High Dispersion (Clearing)',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        desc: 'Active convective winds dispersing ground emissions.',
      };
    }
  }

  return (
    <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#38BDF8]">
              <CloudSun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">
                Atmospheric Context
              </span>
              <h4 className="text-base font-bold text-[#F8FAFC]">
                {weatherDescription || 'Local Meteorology'}
              </h4>
            </div>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-current ${dispersion.bg} ${dispersion.color}`}
          >
            {dispersion.label.split('(')[0]}
          </span>
        </div>

        {/* 3 Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 my-4">
          {/* Temperature */}
          <div className="bg-[#0D1422] border border-[#1F3045]/60 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-1">
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              <span>Temp</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC]">
              {temperature !== null ? `${temperature}°C` : '--'}
            </div>
            {apparentTemperature !== null && (
              <span className="text-[11px] text-[#94A3B8]">
                Feels {apparentTemperature}°C
              </span>
            )}
          </div>

          {/* Humidity */}
          <div className="bg-[#0D1422] border border-[#1F3045]/60 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-1">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>Humidity</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC]">
              {humidity !== null ? `${humidity}%` : '--'}
            </div>
            <span className="text-[11px] text-[#94A3B8]">
              {humidity !== null && humidity > 70 ? 'Moist / Hazy' : 'Normal'}
            </span>
          </div>

          {/* Wind Speed */}
          <div className="bg-[#0D1422] border border-[#1F3045]/60 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-1">
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wind</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC]">
              {windSpeed !== null ? `${windSpeed} km/h` : '--'}
            </div>
            {windDirection !== null && (
              <span className="text-[11px] text-[#94A3B8] flex items-center gap-0.5">
                <Compass className="w-3 h-3 text-[#38BDF8]" />
                {windDirection}°
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#1F3045]/60 text-xs text-[#94A3B8] leading-relaxed">
        <span className="text-[#F8FAFC] font-semibold">Ventilation Effect: </span>
        {dispersion.desc}
      </div>
    </div>
  );
}
