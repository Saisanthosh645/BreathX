import { useState } from 'react';
import { AQIScale, CurrentAirQualityData } from '../types/airQuality';
import { getCategoryForScale } from '../utils/aqiCalculations';
import {
  HeartPulse,
  Activity,
  ShieldAlert,
  Wind,
  Baby,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Footprints,
  Bike,
  Dumbbell,
  Home,
} from 'lucide-react';

interface HealthSafetyProps {
  currentData: CurrentAirQualityData | null;
  scale: AQIScale;
  onScaleChange: (scale: AQIScale) => void;
}

export function HealthSafety({
  currentData,
  scale,
  onScaleChange,
}: HealthSafetyProps) {
  const [selectedStandard, setSelectedStandard] = useState<AQIScale>(scale);

  const currentAqi = currentData
    ? scale === 'EAQI'
      ? currentData.europeanAqi
      : scale === 'USAQI'
      ? currentData.usAqi
      : currentData.indAqi
    : null;

  const currentCat = getCategoryForScale(currentAqi, selectedStandard);

  // Category definitions for the standard
  const standardsData: Record<
    AQIScale,
    {
      name: string;
      authority: string;
      levels: {
        range: string;
        name: string;
        color: string;
        bg: string;
        border: string;
        text: string;
        summary: string;
        generalAction: string;
        sensitiveAction: string;
      }[];
    }
  > = {
    USAQI: {
      name: 'US EPA Air Quality Index',
      authority: 'United States Environmental Protection Agency',
      levels: [
        {
          range: '0 – 50',
          name: 'Good',
          color: '#22C55E',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          summary: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
          generalAction: 'Ideal for all outdoor activities, running, and cycling.',
          sensitiveAction: 'No restrictions.',
        },
        {
          range: '51 – 100',
          name: 'Moderate',
          color: '#EAB308',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          summary: 'Air quality is acceptable. Very small number of unusually sensitive people may experience minor discomfort.',
          generalAction: 'Safe for most outdoor exercise.',
          sensitiveAction: 'Unusually sensitive people should consider reducing prolonged or heavy exertion.',
        },
        {
          range: '101 – 150',
          name: 'Unhealthy for Sensitive Groups',
          color: '#F97316',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          summary: 'Members of sensitive groups may experience adverse health effects. General public less affected.',
          generalAction: 'Active adults can still exercise outdoors but take rest intervals.',
          sensitiveAction: 'Children, seniors, and people with asthma or heart conditions should limit prolonged outdoor exertion.',
        },
        {
          range: '151 – 200',
          name: 'Unhealthy',
          color: '#EF4444',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          summary: 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.',
          generalAction: 'Avoid intense outdoor cardio workouts. Move workouts indoors.',
          sensitiveAction: 'Sensitive groups should avoid all outdoor physical exertion; wear certified N95 masks if outside.',
        },
        {
          range: '201 – 300',
          name: 'Very Unhealthy',
          color: '#A855F7',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          summary: 'Health alert: Risk of health effects is increased for everyone in the region.',
          generalAction: 'Avoid all outdoor physical activity. Keep windows shut.',
          sensitiveAction: 'Remain indoors in clean filtered rooms. Run air purifiers on high.',
        },
        {
          range: '301 – 500',
          name: 'Hazardous',
          color: '#881337',
          bg: 'bg-red-950/40',
          border: 'border-rose-700/60',
          text: 'text-rose-300',
          summary: 'Health warning of emergency conditions: The entire population is likely to be affected by serious complications.',
          generalAction: 'Stay strictly indoors. Do not go outside unless emergency.',
          sensitiveAction: 'High-grade N95 / FFP3 respirators mandatory for any unavoidable exposure.',
        },
      ],
    },
    EAQI: {
      name: 'European Air Quality Index (EAQI)',
      authority: 'European Environment Agency (EEA)',
      levels: [
        {
          range: '0 – 20',
          name: 'Good',
          color: '#22C55E',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          summary: 'Air quality is excellent. No risk to public health.',
          generalAction: 'Perfect for all outdoor sports and ventilation.',
          sensitiveAction: 'No precautions necessary.',
        },
        {
          range: '20 – 40',
          name: 'Fair',
          color: '#84CC16',
          bg: 'bg-lime-500/10',
          border: 'border-lime-500/30',
          text: 'text-lime-400',
          summary: 'Air quality is fair. Pollution levels are low.',
          generalAction: 'Normal outdoor activities recommended.',
          sensitiveAction: 'Sensitive individuals watch for unusual respiratory symptoms.',
        },
        {
          range: '40 – 60',
          name: 'Moderate',
          color: '#EAB308',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          summary: 'Noticeable pollution. May cause mild symptoms in vulnerable populations.',
          generalAction: 'Enjoy outdoor activities; take breaks if coughing occurs.',
          sensitiveAction: 'Sensitive groups consider reducing strenuous outdoor exercise.',
        },
        {
          range: '60 – 80',
          name: 'Poor',
          color: '#F97316',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          summary: 'Air pollution is high. Negative health effects possible for general public.',
          generalAction: 'Avoid strenuous outdoor running or cycling.',
          sensitiveAction: 'Sensitive individuals stay indoors; wear N95 mask outside.',
        },
        {
          range: '80 – 100',
          name: 'Very Poor',
          color: '#EF4444',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          summary: 'Air pollution is very high. Respiratory irritation common.',
          generalAction: 'Minimize outdoor time; avoid outdoor physical exertion.',
          sensitiveAction: 'Keep windows closed; run HEPA air cleaners.',
        },
        {
          range: '> 100',
          name: 'Extremely Poor',
          color: '#A855F7',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          summary: 'Emergency pollution level. Serious risk for entire population.',
          generalAction: 'Stay indoors with sealed doors and windows.',
          sensitiveAction: 'Avoid all outdoor exposure. Seek medical attention if experiencing chest tightness.',
        },
      ],
    },
    INDAQI: {
      name: 'Indian National Air Quality Index (NAQI)',
      authority: 'Central Pollution Control Board (CPCB)',
      levels: [
        {
          range: '0 – 50',
          name: 'Good',
          color: '#22C55E',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          summary: 'Minimal health impact. Air quality is clean and healthy.',
          generalAction: 'Safe for morning walks and outdoor sports.',
          sensitiveAction: 'No restrictions.',
        },
        {
          range: '51 – 100',
          name: 'Satisfactory',
          color: '#84CC16',
          bg: 'bg-lime-500/10',
          border: 'border-lime-500/30',
          text: 'text-lime-400',
          summary: 'Minor breathing discomfort to sensitive people.',
          generalAction: 'Normal outdoor routines permitted.',
          sensitiveAction: 'Keep asthma inhalers accessible.',
        },
        {
          range: '101 – 200',
          name: 'Moderate',
          color: '#EAB308',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          summary: 'Breathing discomfort to people with asthma, heart disease, and children.',
          generalAction: 'Reduce long strenuous outdoor sessions.',
          sensitiveAction: 'Sensitive people limit outdoor jogging.',
        },
        {
          range: '201 – 300',
          name: 'Poor',
          color: '#F97316',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          summary: 'Breathing discomfort to most people on prolonged exposure.',
          generalAction: 'Avoid morning jogs when fog/smog traps pollutants.',
          sensitiveAction: 'Wear anti-pollution mask; avoid traffic junctions.',
        },
        {
          range: '301 – 400',
          name: 'Very Poor',
          color: '#EF4444',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          summary: 'Respiratory illness to the people on prolonged exposure.',
          generalAction: 'Avoid outdoor exercise completely. Shift indoors.',
          sensitiveAction: 'Elderly and children remain indoors.',
        },
        {
          range: '401 – 500',
          name: 'Severe',
          color: '#881337',
          bg: 'bg-red-950/40',
          border: 'border-rose-700/60',
          text: 'text-rose-300',
          summary: 'Affects healthy people and seriously impacts those with existing diseases.',
          generalAction: 'Stay strictly indoors. Wear N95 respirator if stepping out.',
          sensitiveAction: 'Critical health emergency. Seek immediate care for respiratory distress.',
        },
      ],
    },
  };

  const activeStandard = standardsData[selectedStandard];

  // Activity Status matrix based on current live category level (1-6)
  const isGood = currentCat.level <= 1;
  const isModerate = currentCat.level === 2;
  const isUnhealthySensitive = currentCat.level === 3;
  const isUnhealthy = currentCat.level >= 4;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">
            <HeartPulse className="w-4 h-4" />
            Epidemiological &amp; Public Health Protocols
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">
            Health &amp; Safety Dashboard
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Evidence-based precautions, exercise safety guidance, and pollutant vulnerability breakdowns
          </p>
        </div>

        {/* Standard Switcher */}
        <div className="inline-flex bg-[#0D1422] p-1 rounded-xl border border-[#1F3045]">
          {(['USAQI', 'EAQI', 'INDAQI'] as AQIScale[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSelectedStandard(s);
                onScaleChange(s);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStandard === s
                  ? 'bg-[#22C55E] text-black font-bold shadow-md'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {s === 'USAQI' ? 'US EPA Standard' : s === 'EAQI' ? 'European EAQI' : 'India CPCB'}
            </button>
          ))}
        </div>
      </div>

      {/* Live Activity Recommendations Card based on real current AQI */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#22C55E]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Real-Time Activity Advisory ({currentData?.location.name || 'Current Location'})
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Tailored based on observed {scale} Index of <strong className="text-[#F8FAFC]">{currentAqi ?? 'N/A'}</strong> ({currentCat.category})
              </p>
            </div>
          </div>

          <div
            className={`text-xs font-bold px-3 py-1 rounded-full border ${currentCat.bgClass} ${currentCat.borderClass} ${currentCat.textClass}`}
          >
            {currentCat.category}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Outdoor Running */}
          <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-[#38BDF8]" />
                Outdoor Running
              </span>
              {isGood ? (
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Optimal
                </span>
              ) : isModerate ? (
                <span className="text-amber-400 text-xs flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Normal
                </span>
              ) : (
                <span className="text-rose-400 text-xs flex items-center gap-1 font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> Not Advised
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              {isGood
                ? 'Excellent lung ventilation conditions. Enjoy distance running.'
                : isModerate
                ? 'Safe for most runners. Hydrate well; take breaks if coughing.'
                : 'Heavy breathing draws microscopic particulates deep into alveoli. Avoid outdoor running.'}
            </p>
          </div>

          {/* Walking / Commuting */}
          <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Walking &amp; Transit
              </span>
              {isUnhealthy ? (
                <span className="text-amber-400 text-xs flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Wear Mask
                </span>
              ) : (
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Safe
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              {isUnhealthy
                ? 'Keep walks brief. Wear an N95 respirator mask and avoid walking alongside heavy traffic.'
                : 'Safe for leisure walks, commuting, and errands outdoors.'}
            </p>
          </div>

          {/* Cycling */}
          <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-amber-400" />
                Cycling
              </span>
              {isGood || isModerate ? (
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Permitted
                </span>
              ) : (
                <span className="text-rose-400 text-xs flex items-center gap-1 font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> High Inhalation
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              {isGood || isModerate
                ? 'Cycling is safe. Avoid major arterial truck routes during evening rush hour.'
                : 'High ventilation rate during cycling multiplies toxic particulate absorption. Shift indoors.'}
            </p>
          </div>

          {/* Indoor Exercise */}
          <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-[#38BDF8]" />
                Indoor Fitness
              </span>
              <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Recommended
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Ideal alternative during elevated outdoor pollution. Run a HEPA air purifier in the gym or exercise room.
            </p>
          </div>
        </div>
      </div>

      {/* Sensitive Populations Precautions */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-[#F8FAFC] mb-1">
          Targeted Guidance for Vulnerable Groups
        </h3>
        <p className="text-xs text-[#94A3B8] mb-4">
          Children, older adults, and individuals with respiratory or cardiovascular diseases face heightened health risks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Children & Infants */}
          <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#38BDF8]">
              <Baby className="w-4 h-4" />
              <strong className="text-sm text-[#F8FAFC]">Children &amp; Infants</strong>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Children breathe more air per kilogram of body weight than adults and their lungs are actively developing. Limit outdoor school sports when AQI exceeds Moderate levels. Keep school buses closed in traffic.
            </p>
          </div>

          {/* Older Adults */}
          <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Users className="w-4 h-4" />
              <strong className="text-sm text-[#F8FAFC]">Older Adults (65+)</strong>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Particulate matter triggers blood vessel constriction and elevates blood pressure. Seniors should schedule outdoor walks during early afternoon when inversion smog dissipates.
            </p>
          </div>

          {/* Respiratory & Cardiac Patients */}
          <div className="bg-[#0D1422] border border-[#1F3045] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-400">
              <HeartPulse className="w-4 h-4" />
              <strong className="text-sm text-[#F8FAFC]">Asthma &amp; Heart Conditions</strong>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Keep quick-relief bronchodilators/inhalers on hand. Watch for shortness of breath, wheezing, or chest tightness. Wear certified N95 respirators whenever stepping into heavy haze.
            </p>
          </div>
        </div>
      </div>

      {/* Explaining Pollutants and Health Significance */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-[#F8FAFC] mb-1">
          Pollutant Science &amp; Toxicological Profiles
        </h3>
        <p className="text-xs text-[#94A3B8] mb-4">
          Detailed breakdown of health mechanics for primary air pollutants monitored by BreatheX
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PM2.5 */}
          <div className="p-4 bg-[#0D1422] border border-[#1F3045] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-bold text-[#38BDF8]">PM2.5 (Fine Respirable Particles)</strong>
              <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded">
                Diameter &le; 2.5 µm
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Combustion particles, organic compounds, and heavy metals small enough to bypass nasal hairs, enter lung alveoli, and penetrate directly into the circulatory bloodstream. Long-term exposure increases chronic cardiovascular disease, lung cancer, and reduced life expectancy.
            </p>
          </div>

          {/* PM10 */}
          <div className="p-4 bg-[#0D1422] border border-[#1F3045] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-bold text-amber-400">PM10 (Inhalable Coarse Dust)</strong>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                Diameter &le; 10 µm
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Road dust, construction debris, pollen, and industrial emissions that deposit into the upper airways (trachea and bronchi). Induces rhinitis, severe cough, throat soreness, and exacerbates asthma attacks.
            </p>
          </div>

          {/* Ground-level Ozone (O3) */}
          <div className="p-4 bg-[#0D1422] border border-[#1F3045] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-bold text-emerald-400">Ground-level Ozone (O3)</strong>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                Photochemical Gas
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Secondary pollutant created by photochemical sunlight reactions between NOx and volatile organic compounds (VOCs). Acts as a severe lung oxidant, causing airway inflammation, chest tightness, and reduced lung capacity during hot sunny afternoons.
            </p>
          </div>

          {/* Nitrogen Dioxide (NO2) */}
          <div className="p-4 bg-[#0D1422] border border-[#1F3045] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-bold text-rose-400">Nitrogen Dioxide (NO2)</strong>
              <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded">
                Traffic &amp; Industrial Gas
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Emitted primarily from internal combustion vehicle engines and power plants. Deeply irritates lung linings, impairs immune defenses against respiratory infections, and triggers pediatric wheezing.
            </p>
          </div>
        </div>
      </div>

      {/* Official AQI Categories Reference Table for the selected standard */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              {activeStandard.name} Scale Breakdown
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Standardized classification established by {activeStandard.authority}
            </p>
          </div>
          <span className="text-xs font-mono text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-1 rounded">
            Official Standard
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F3045] text-[#94A3B8] uppercase text-[10px]">
                <th className="py-2.5 pr-4">AQI Range</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Health Implications</th>
                <th className="py-2.5 pl-4">Recommended General Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3045]/60">
              {activeStandard.levels.map((lvl) => (
                <tr key={lvl.name} className="hover:bg-[#0D1422]/60 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-[#F8FAFC]">
                    {lvl.range}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full border ${lvl.bg} ${lvl.border} ${lvl.text}`}
                    >
                      {lvl.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#F8FAFC]/90 max-w-xs leading-relaxed">
                    {lvl.summary}
                  </td>
                  <td className="py-3 pl-4 text-[#94A3B8] max-w-xs leading-relaxed">
                    {lvl.generalAction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Medical Disclaimer */}
      <div className="bg-[#080D18] border border-[#1F3045] rounded-2xl p-5 text-xs text-[#94A3B8] leading-relaxed flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#F8FAFC] block mb-1">
            Mandatory Public Health Disclaimer:
          </strong>
          All health advice, activity suggestions, and risk ratings provided by BreatheX are strictly for general educational and informational purposes. Atmospheric conditions and personal biological sensitivity vary widely. BreatheX does not provide medical diagnoses or treatment plans. Individuals suffering from asthma, cardiovascular disease, or respiratory distress should consult a licensed healthcare practitioner or local emergency services immediately.
        </div>
      </div>
    </div>
  );
}
