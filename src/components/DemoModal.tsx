import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Globe,
  Radio,
  ShieldCheck,
  Bot,
  Activity,
  Layers,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '../utils/audioFx';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenAlerts: () => void;
}

interface DemoStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  actionLabel: string;
  targetTab: string;
  metricLabel: string;
  metricValue: string;
  metricUnit: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'telemetry',
    badge: 'STAGE 1: GLOBAL ASSIMILATION',
    title: 'Real-Time Planetary Telemetry',
    subtitle: 'European Space Agency Copernicus CAMS & Sentinel-5P',
    description:
      'Continuous assimilation of atmospheric chemical transport models and ground-station networks. BreatheX provides zero-hallucination, true physical atmospheric measurements updated every hour across 10,000+ coordinates.',
    highlights: [
      'Multi-pollutant tracking: PM2.5, PM10, NO₂, SO₂, CO, and O₃',
      'Direct assimilation from Open-Meteo & Copernicus Atmosphere Service',
      'Real-time atmospheric humidity, wind vectors, and thermal inversions',
    ],
    actionLabel: 'Explore Live Telemetry',
    targetTab: 'overview',
    metricLabel: 'Planetary Latency',
    metricValue: '42',
    metricUnit: 'ms (Global Cache)',
  },
  {
    id: '3d-globe',
    badge: 'STAGE 2: 3D SPATIAL DIGITAL TWIN',
    title: 'Interactive 3D WebGL Atmosphere',
    subtitle: 'Photorealistic Satellite Earth & Aerosol Heatmaps',
    description:
      'Explore atmospheric pollution in full 3D spatial fidelity. Rotate, zoom, and inspect real aerosol optical depth (AOD), industrial plume corridors, and regional smoke dispersion across all continents.',
    highlights: [
      'Three.js GPU-accelerated atmospheric shader with day/night terminator',
      'Over 500+ global monitoring stations with live color-coded pulsing beacons',
      'Realistic Earth landmass textures with geopolitical borders and labels',
    ],
    actionLabel: 'Launch 3D Globe',
    targetTab: 'liveMap',
    metricLabel: 'Spatial Resolution',
    metricValue: '0.1°',
    metricUnit: 'Copernicus Grid (~11km)',
  },
  {
    id: 'standards',
    badge: 'STAGE 3: MULTI-SCALE STANDARDS',
    title: 'Verified Breakpoint Equations',
    subtitle: 'US EPA AQI, European EAQI & Indian CPCB',
    description:
      'Never confuse incompatible air standards. BreatheX implements exact piecewise linear interpolation breakpoints for the European EAQI (0-100), US EPA AQI (0-500), and Indian National AQI methodologies with clear labeling.',
    highlights: [
      'True piecewise formula: I = [(I_hi - I_lo)/(BP_hi - BP_lo)] * (C - BP_lo) + I_lo',
      'Instant one-click toggle between EAQI, US AQI, and Indian CPCB scales',
      'Dominant pollutant attribution with health advisory tiers',
    ],
    actionLabel: 'Compare Multi-City AQI',
    targetTab: 'compare',
    metricLabel: 'Breakpoints Verified',
    metricValue: '100%',
    metricUnit: 'EPA / CPCB Validated',
  },
  {
    id: 'ai-assistant',
    badge: 'STAGE 4: GROUNDED ENVIRONMENTAL AI',
    title: 'BreatheX AI Environmental Diagnostics',
    subtitle: 'Powered by Gemini Intelligence Grounded in Live Telemetry',
    description:
      'Ask any question about atmospheric chemistry, health vulnerability, mask effectiveness, or ventilation safety. Every response is strictly grounded in the exact physical sensor telemetry of your selected city.',
    highlights: [
      'Personalized guidance for asthma, cardiovascular patients, children & athletes',
      'Micro-climate explanations for smog formation and nocturnal inversions',
      'Integrated voice synthesis with audio responses',
    ],
    actionLabel: 'Chat with BreatheX AI',
    targetTab: 'aiAssistant',
    metricLabel: 'Telemetry Grounding',
    metricValue: '100%',
    metricUnit: 'Live Sensor Context',
  },
  {
    id: 'clean-air',
    badge: 'STAGE 5: SANCTUARY FINDER & ALERTS',
    title: 'Clean Air Navigation & Smart Alarms',
    subtitle: 'Proactive Respiratory Protection for Daily Living',
    description:
      'Locate the cleanest parks, elevated micro-climates, and safe outdoor exercise corridors. Set automated browser alarms when AQI crosses custom sensitivity thresholds.',
    highlights: [
      'Real-time Clean Air Finder ranking nearby low-particulate zones',
      'Customizable threshold alerts with audio notifications',
      'Exportable high-resolution social share report cards',
    ],
    actionLabel: 'Find Clean Air Corridors',
    targetTab: 'cleanAir',
    metricLabel: 'Safe Corridors Found',
    metricValue: '18+',
    metricUnit: 'Verified Micro-Zones',
  },
];

export function DemoModal({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenAlerts,
}: DemoModalProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  const step = DEMO_STEPS[currentStepIdx];
  const STEP_DURATION = 6000; // 6 seconds per chapter

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIdx]);

  // Autoplay timer
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 50; // update progress every 50ms
    const stepIncrement = (interval / STEP_DURATION) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentStepIdx((idx) => {
            const nextIdx = (idx + 1) % DEMO_STEPS.length;
            if (soundEnabled) soundFx.playHoverChirp();
            return nextIdx;
          });
          return 0;
        }
        return prev + stepIncrement;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, currentStepIdx, soundEnabled]);

  const handleNext = () => {
    soundFx.playClickTone();
    setProgress(0);
    setCurrentStepIdx((idx) => (idx + 1) % DEMO_STEPS.length);
  };

  const handlePrev = () => {
    soundFx.playClickTone();
    setProgress(0);
    setCurrentStepIdx((idx) => (idx - 1 + DEMO_STEPS.length) % DEMO_STEPS.length);
  };

  const handleSelectStep = (idx: number) => {
    soundFx.playClickTone();
    setProgress(0);
    setCurrentStepIdx(idx);
  };

  const handleAction = () => {
    soundFx.playSuccessChime();
    onClose();
    if (step.targetTab === 'alerts') {
      onOpenAlerts();
    } else {
      onNavigateToTab(step.targetTab);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#090F1C] border border-[#1A2942] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-[#162338] flex items-center justify-between bg-[#070D18]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#F8FAFC]">
                  BreatheX Interactive Platform Tour
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/20">
                  SAMPLE TOUR
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Illustrative product tour; sample values below are not current API readings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                soundFx.playClickTone();
              }}
              title={soundEnabled ? 'Mute Demo Sound' : 'Enable Demo Sound'}
              className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#152234] transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            <button
              onClick={() => {
                soundFx.playClickTone();
                onClose();
              }}
              className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#152234] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chapter Stepper Tabs */}
        <div className="grid grid-cols-5 border-b border-[#162338] bg-[#0B1322] text-xs font-mono">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => handleSelectStep(idx)}
              className={`p-2.5 text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center gap-1 ${
                idx === currentStepIdx
                  ? 'bg-[#101C2F] text-emerald-400 font-bold'
                  : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#0E1727]'
              }`}
            >
              <span className="text-[10px] tracking-wider">CH {idx + 1}</span>
              <span className="text-[11px] truncate max-w-full">
                {s.id === 'telemetry'
                  ? 'Telemetry'
                  : s.id === '3d-globe'
                  ? '3D Globe'
                  : s.id === 'standards'
                  ? 'Standards'
                  : s.id === 'ai-assistant'
                  ? 'AI Agent'
                  : 'Sanctuaries'}
              </span>

              {/* Active Step Scrubber Progress Bar */}
              {idx === currentStepIdx && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-emerald-400 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Main Stage Viewport */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Simulated Interactive Display Screen */}
          <div className="relative rounded-2xl overflow-hidden border border-[#1F3045] bg-[#050912] p-5 shadow-inner">
            {/* Ambient Scanline & Grid Background */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 20px 20px, 20px 20px',
              }}
            />

            {/* Stage-specific Interactive Visual Simulation */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left Simulation Graphic */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 rounded-xl bg-[#090F1C]/80 border border-[#162338]">
                {currentStepIdx === 0 && (
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        SYNCHRONIZING SENTINEL-5P
                      </span>
                      <span>42.8 kHz</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-[#050912] border border-[#162338]">
                        <span className="text-[10px] text-[#64748B] block">PM2.5 AEROSOL</span>
                        <span className="text-emerald-400 font-extrabold text-lg">12.4</span>
                        <span className="text-[10px] text-[#94A3B8] ml-1">µg/m³</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#050912] border border-[#162338]">
                        <span className="text-[10px] text-[#64748B] block">NO₂ TROPOSPHERIC</span>
                        <span className="text-sky-400 font-extrabold text-lg">14.1</span>
                        <span className="text-[10px] text-[#94A3B8] ml-1">µg/m³</span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-[#162338] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-3/4 animate-pulse" />
                    </div>
                  </div>
                )}

                {currentStepIdx === 1 && (
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* Pulsing Orbital Rings */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-emerald-400/40 animate-spin" style={{ animationDuration: '20s' }} />
                    <div className="absolute inset-2 rounded-full border border-sky-400/30 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0F2A4A] via-[#1E4D7A] to-[#38BDF8] shadow-2xl shadow-sky-500/30 flex items-center justify-center relative overflow-hidden">
                      <Globe className="w-16 h-16 text-emerald-300 opacity-80 animate-pulse" />
                    </div>
                    <span className="absolute -bottom-2 text-[9px] font-mono text-emerald-400 font-bold bg-[#0B1220] px-2 py-0.5 rounded border border-emerald-500/30">
                      WebGL GPU 60 FPS
                    </span>
                  </div>
                )}

                {currentStepIdx === 2 && (
                  <div className="w-full space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-[#050912] border border-[#162338]">
                      <span className="text-[#94A3B8]">US EPA AQI</span>
                      <span className="text-emerald-400 font-bold">42 (Good)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#050912] border border-[#162338]">
                      <span className="text-[#94A3B8]">European EAQI</span>
                      <span className="text-sky-400 font-bold">Level 1 (Good)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#050912] border border-[#162338]">
                      <span className="text-[#94A3B8]">India CPCB AQI</span>
                      <span className="text-emerald-400 font-bold">45 (Satisfactory)</span>
                    </div>
                  </div>
                )}

                {currentStepIdx === 3 && (
                  <div className="w-full space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px]">
                      <Bot className="w-3.5 h-3.5" />
                      <span>BREATHEX AI INTELLIGENCE</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#050912] border border-[#162338] text-[11px] text-[#94A3B8]">
                      "Is outdoor running safe right now in Hyderabad?"
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-[#F8FAFC]">
                      <span className="text-emerald-400 font-bold">Safe: </span>
                      PM2.5 is 12.4 µg/m³. Low risk for cardiovascular & respiratory strain.
                    </div>
                  </div>
                )}

                {currentStepIdx === 4 && (
                  <div className="w-full space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-[11px] text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" />
                        CLEAN AIR SANCTUARIES
                      </span>
                      <span>TOP 3</span>
                    </div>
                    <div className="p-2 rounded bg-[#050912] border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-[#F8FAFC]">KBR National Park</span>
                      <span className="text-emerald-400 font-bold">AQI 28 ★</span>
                    </div>
                    <div className="p-2 rounded bg-[#050912] border border-[#162338] flex items-center justify-between">
                      <span className="text-[#F8FAFC]">Botanical Gardens</span>
                      <span className="text-emerald-400 font-bold">AQI 34</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Telemetry Specs */}
              <div className="w-full md:w-1/2 space-y-3">
                <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest block">
                  {step.badge}
                </span>
                <h4 className="text-xl font-black text-[#F8FAFC] tracking-tight">
                  {step.title}
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {step.description}
                </p>

                {/* Key Highlights Checkmarks */}
                <div className="space-y-1.5 pt-1">
                  {step.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#CBD5E1]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Real-time KPI Card */}
                <div className="pt-2 flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-[#090F1C] border border-[#162338]">
                    <span className="text-[9px] text-[#64748B] block font-mono">
                      {step.metricLabel}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black font-mono text-emerald-400">
                        {step.metricValue}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        {step.metricUnit}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleAction}
                    className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Playback Control Dock */}
        <div className="px-6 py-4 border-t border-[#162338] bg-[#070D18] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClickTone();
                setIsPlaying(!isPlaying);
              }}
              className="px-3 py-2 rounded-xl bg-[#0E1626] border border-[#1F3045] hover:border-emerald-400/50 text-[#F8FAFC] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause Demo</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Resume Demo</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-[#64748B] font-mono hidden sm:inline">
              Chapter {currentStepIdx + 1} of {DEMO_STEPS.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-[#0E1626] border border-[#1F3045] hover:border-emerald-400/50 text-[#F8FAFC] cursor-pointer transition-colors"
              title="Previous Step (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-[#0E1626] border border-[#1F3045] hover:border-emerald-400/50 text-[#F8FAFC] cursor-pointer transition-colors"
              title="Next Step (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
