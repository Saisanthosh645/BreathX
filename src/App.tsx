import { useState, useEffect } from 'react';
import { useAirQuality } from './hooks/useAirQuality';
import { useGeolocation } from './hooks/useGeolocation';
import { useAlerts } from './hooks/useAlerts';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ShareCardModal } from './components/ShareCardModal';
import { AlertsModal } from './components/AlertsModal';
import { ErrorState } from './components/ErrorState';
import { DashboardSkeleton } from './components/LoadingSkeleton';

// Page Views
import { Overview } from './pages/Overview';
import { LiveMap } from './pages/LiveMap';
import { HistoricalAnalytics } from './pages/HistoricalAnalytics';
import { CompareCities } from './pages/CompareCities';
import { Forecast } from './pages/Forecast';
import { HealthSafety } from './pages/HealthSafety';
import { AIAssistant } from './pages/AIAssistant';
import { CleanAirFinder } from './pages/CleanAirFinder';
import { Settings } from './pages/Settings';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    selectedLocation,
    airData,
    hourlyData,
    loading,
    refreshing,
    error,
    lastFetched,
    activeScale,
    changeLocation,
    refreshData,
    setActiveScale,
    clearError,
  } = useAirQuality();

  const { getCurrentLocation, loading: isLocating } = useGeolocation();

  const {
    alerts,
    notificationPermission,
    requestPermission,
    addAlert,
    removeAlert,
    toggleAlert,
    evaluateAlerts,
  } = useAlerts();

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Evaluate alerts whenever airData arrives
  useEffect(() => {
    if (airData) {
      const aqi =
        activeScale === 'EAQI'
          ? airData.europeanAqi
          : activeScale === 'USAQI'
          ? airData.usAqi
          : airData.indAqi;
      evaluateAlerts(aqi, airData.location.name, activeScale);
    }
  }, [airData, activeScale]);

  const handleUseGPS = async () => {
    try {
      showToast('Requesting GPS sensor telemetry...');
      const loc = await getCurrentLocation();
      changeLocation(loc);
      showToast(`Position locked: ${loc.name}`);
    } catch (err: any) {
      showToast(err?.message || 'Could not lock GPS location.');
    }
  };

  const getPageTitle = (tab: NavTab): string => {
    switch (tab) {
      case 'overview':
        return 'Air Quality Overview';
      case 'liveMap':
        return 'Spatial Pollution Map';
      case 'historical':
        return 'Historical Pollution Trends';
      case 'compare':
        return 'City Comparison Matrix';
      case 'forecast':
        return '72-Hour Pollution Forecast';
      case 'health':
        return 'Health & Exercise Safety';
      case 'aiAssistant':
        return 'BreatheX AI Assistant';
      case 'cleanAir':
        return 'Clean Air Explorer';
      case 'settings':
        return 'Platform Settings';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#080D18] text-[#F8FAFC] overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          pageTitle={getPageTitle(currentTab)}
          currentLocation={selectedLocation}
          onSelectLocation={(loc) => {
            changeLocation(loc);
            showToast(`Switched monitoring hub to ${loc.name}`);
          }}
          onRefresh={() => {
            refreshData();
            showToast('Fetching latest Open-Meteo telemetry...');
          }}
          isRefreshing={refreshing}
          lastUpdated={lastFetched}
          activeScale={activeScale}
          onScaleChange={(s) => {
            setActiveScale(s);
            showToast(`Active scale set to ${s}`);
          }}
          onOpenAlerts={() => setIsAlertsModalOpen(true)}
          onOpenShare={() => setIsShareModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onUseCurrentLocation={handleUseGPS}
          isLocating={isLocating}
          alertsCount={alerts.filter((a) => a.enabled).length}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {loading && !airData ? (
            <DashboardSkeleton />
          ) : error && !airData ? (
            <ErrorState
              title="Telemetry Ingestion Disrupted"
              message={error}
              onRetry={refreshData}
              isRetrying={refreshing}
            />
          ) : (
            <>
              {currentTab === 'overview' && (
                <Overview
                  airData={airData}
                  hourlyData={hourlyData}
                  scale={activeScale}
                  onScaleChange={setActiveScale}
                  onRefresh={refreshData}
                  isRefreshing={refreshing}
                  onOpenShare={() => setIsShareModalOpen(true)}
                  onOpenAlerts={() => setIsAlertsModalOpen(true)}
                  onNavigateToTab={setCurrentTab}
                  onSelectLocation={changeLocation}
                  onUseGPS={handleUseGPS}
                  isLocating={isLocating}
                />
              )}

              {currentTab === 'liveMap' && (
                <LiveMap
                  currentLocation={selectedLocation}
                  currentAqi={
                    activeScale === 'EAQI'
                      ? airData?.europeanAqi ?? null
                      : activeScale === 'USAQI'
                      ? airData?.usAqi ?? null
                      : airData?.indAqi ?? null
                  }
                  currentPm25={airData?.pollutants.pm2_5 ?? null}
                  currentPm10={airData?.pollutants.pm10 ?? null}
                  scale={activeScale}
                  onSelectLocation={(loc) => {
                    changeLocation(loc);
                    showToast(`Mapped ${loc.name}`);
                  }}
                />
              )}

              {currentTab === 'historical' && (
                <HistoricalAnalytics
                  currentLocation={selectedLocation}
                  scale={activeScale}
                />
              )}

              {currentTab === 'compare' && (
                <CompareCities
                  initialCity={selectedLocation}
                  scale={activeScale}
                />
              )}

              {currentTab === 'forecast' && (
                <Forecast
                  hourlyData={hourlyData}
                  currentData={airData}
                  scale={activeScale}
                />
              )}

              {currentTab === 'health' && (
                <HealthSafety
                  currentData={airData}
                  scale={activeScale}
                  onScaleChange={setActiveScale}
                />
              )}

              {currentTab === 'aiAssistant' && (
                <AIAssistant
                  currentData={airData}
                  scale={activeScale}
                />
              )}

              {currentTab === 'cleanAir' && (
                <CleanAirFinder
                  currentLocation={selectedLocation}
                  scale={activeScale}
                  onSelectCity={(loc) => {
                    changeLocation(loc);
                    setCurrentTab('overview');
                    showToast(`Focus set to ${loc.name}`);
                  }}
                />
              )}

              {currentTab === 'settings' && (
                <Settings
                  scale={activeScale}
                  onScaleChange={setActiveScale}
                  alerts={alerts}
                  onAddAlert={(a) => {
                    addAlert(a);
                    showToast('Threshold trigger created');
                  }}
                  onRemoveAlert={(id) => {
                    removeAlert(id);
                    showToast('Trigger removed');
                  }}
                  onToggleAlert={(id) => {
                    toggleAlert(id);
                    showToast('Trigger toggled');
                  }}
                  permission={notificationPermission}
                  onRequestPermission={async () => {
                    const granted = await requestPermission();
                    if (granted) showToast('Notifications enabled!');
                    return granted;
                  }}
                  currentCityName={selectedLocation.name}
                  currentLat={selectedLocation.latitude}
                  currentLon={selectedLocation.longitude}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {airData && (
        <ShareCardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          data={airData}
          scale={activeScale}
        />
      )}

      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        permission={notificationPermission}
        onRequestPermission={requestPermission}
        onAddAlert={(a) => {
          addAlert(a);
          showToast('Alert saved in LocalStorage');
        }}
        onRemoveAlert={removeAlert}
        onToggleAlert={toggleAlert}
        currentCity={selectedLocation.name}
        currentLat={selectedLocation.latitude}
        currentLon={selectedLocation.longitude}
        currentScale={activeScale}
      />

      {/* Floating Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111C2D] border border-[#22C55E]/60 text-[#F8FAFC] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
