import {
  Home,
  MapPin,
  LineChart,
  CalendarDays,
  Bell,
  Leaf,
  Settings,
  X,
  ArrowRight,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'liveMap'
  | 'historical'
  | 'compare'
  | 'forecast'
  | 'health'
  | 'aiAssistant'
  | 'cleanAir'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems: { id: NavTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'liveMap', label: 'Map', icon: MapPin },
    { id: 'historical', label: 'Analytics', icon: LineChart },
    { id: 'forecast', label: 'Forecast', icon: CalendarDays },
    { id: 'health', label: 'Alerts', icon: Bell },
    { id: 'cleanAir', label: 'Sustainability', icon: Leaf },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-[#090E17] border-r border-[#152234] flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Branding */}
        <div className="h-20 px-6 border-b border-[#152234] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/30 to-teal-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <Leaf className="w-5 h-5 fill-emerald-400/30" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#F8FAFC]">
                Breathe<span className="text-emerald-400">X</span>
              </span>
              <span className="block text-[10px] text-[#94A3B8] font-medium tracking-wide">
                Air Quality Intelligence Platform
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/30'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2D]/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-black' : 'text-[#94A3B8]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 space-y-3 shrink-0">
          {/* Promotional Card */}
          <div className="p-4 rounded-xl bg-[#0D1524] border border-[#18273D]">
            <div className="text-2xl mb-2">🌿</div>
            <h4 className="text-white font-bold text-sm">Greener Tomorrow</h4>
            <p className="text-[#94A3B8] text-xs mt-0.5 mb-3">
              Starts with Cleaner Air
            </p>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
              Learn More
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <span className="text-[10px] text-[#64748B]">BreatheX v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
