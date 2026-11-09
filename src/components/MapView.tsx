import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationInfo, AQIScale } from '../types/airQuality';
import { fetchGridPoints } from '../services/airQualityApi';
import { calculateIndAqi, getCategoryForScale } from '../utils/aqiCalculations';
import { formatDateTime } from '../utils/dateUtils';
import { Layers, MapPin, RefreshCw, AlertCircle, Info, Globe2 } from 'lucide-react';

interface MapViewProps {
  currentLocation: LocationInfo;
  currentAqi: number | null;
  currentPm25: number | null;
  currentPm10: number | null;
  currentTimestamp: string | null;
  scale: AQIScale;
  onSelectLocation?: (loc: LocationInfo) => void;
}

interface MapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  europeanAqi: number | null;
  usAqi: number | null;
  indAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  timestamp: string | null;
  type: string;
}

export function MapView({
  currentLocation,
  currentAqi,
  currentPm25,
  currentPm10,
  currentTimestamp,
  scale,
  onSelectLocation,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark' | 'street'>('satellite');
  const [gridPoints, setGridPoints] = useState<MapPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // Fetch verified real grid points around city
  useEffect(() => {
    let isMounted = true;
    async function loadPoints() {
      setLoadingPoints(true);
      setGridError(null);
      try {
        const points = await fetchGridPoints(
          currentLocation.latitude,
          currentLocation.longitude,
          currentLocation.name
        );
        if (isMounted) {
          setGridPoints(points);
          if (points.length === 0) {
            setGridError('No valid CAMS model readings were returned for nearby grid cells.');
          }
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setGridError(e instanceof Error ? e.message : 'Failed to load nearby model data.');
          setGridPoints([]);
        }
      } finally {
        if (isMounted) setLoadingPoints(false);
      }
    }
    loadPoints();
    return () => {
      isMounted = false;
    };
  }, [currentLocation]);

  // Initialize Map with photorealistic satellite layer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.latitude, currentLocation.longitude],
        zoom: 11,
        zoomControl: false,
      });

      // 1. Realistic Satellite Imagery Base Layer (Esri World Imagery)
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri World Imagery &mdash; Open-Meteo &copy; Copernicus CAMS',
          maxZoom: 18,
        }
      ).addTo(map);
      baseTileLayerRef.current = satLayer;

      // 2. Clear White Country Boundaries & Place Names Overlay
      const labelsLayer = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          opacity: 0.9,
        }
      ).addTo(map);
      labelsTileLayerRef.current = labelsLayer;

      // Custom Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(
        [currentLocation.latitude, currentLocation.longitude],
        11,
        { animate: true }
      );
    }
  }, [currentLocation]);

  // Handle map style switching
  const handleStyleChange = (style: 'satellite' | 'dark' | 'street') => {
    setMapStyle(style);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
    if (labelsTileLayerRef.current) map.removeLayer(labelsTileLayerRef.current);

    if (style === 'satellite') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
      labelsTileLayerRef.current = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, opacity: 0.9 }
      ).addTo(map);
    } else if (style === 'dark') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      ).addTo(map);
      labelsTileLayerRef.current = null;
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      ).addTo(map);
      labelsTileLayerRef.current = null;
    }

    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((l: any) => {
        if (typeof l.bringToFront === 'function') l.bringToFront();
      });
    }
  };

  // Render markers whenever grid points or current city changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // All locations to display on map: selected city center + real grid points
    const allPoints: MapPoint[] = [
      {
        id: 'current-center',
        name: `${currentLocation.name} (Selected)`,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        europeanAqi: scale === 'EAQI' ? currentAqi : null,
        usAqi: scale === 'USAQI' ? currentAqi : null,
        indAqi: scale === 'INDAQI' ? currentAqi : null,
        pm25: currentPm25,
        pm10: currentPm10,
        no2: null,
        timestamp: currentTimestamp,
        type: 'Selected Location',
      },
      ...gridPoints.filter(
        (p) =>
          Math.abs(p.latitude - currentLocation.latitude) > 0.001 ||
          Math.abs(p.longitude - currentLocation.longitude) > 0.001
      ),
    ];

    allPoints.forEach((pt) => {
      const aqiVal = scale === 'EAQI'
        ? pt.europeanAqi
        : scale === 'USAQI'
        ? pt.usAqi
        : pt.indAqi ?? calculateIndAqi(pt.pm25, pt.pm10);
      const cat = getCategoryForScale(aqiVal, scale);

      // Create modern pulsing custom HTML DivIcon
      const isCenter = pt.id === 'current-center';
      const iconHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isCenter ? '42px' : '36px'};
          height: ${isCenter ? '42px' : '36px'};
          background-color: #080D18;
          border: 2px solid ${cat.color};
          border-radius: 9999px;
          box-shadow: 0 0 15px ${cat.color}88;
          color: #F8FAFC;
          font-family: monospace;
          font-weight: bold;
          font-size: ${isCenter ? '13px' : '11px'};
          cursor: pointer;
        ">
          ${isCenter ? '<span style="position: absolute; -inset: 4px; border-radius: 9999px; border: 2px solid ' + cat.color + '; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>' : ''}
          ${aqiVal ?? '--'}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-aqi-marker',
        html: iconHtml,
        iconSize: [isCenter ? 42 : 36, isCenter ? 42 : 36],
        iconAnchor: [isCenter ? 21 : 18, isCenter ? 21 : 18],
      });

      const marker = L.marker([pt.latitude, pt.longitude], { icon: customIcon });

      // Leaflet Popup with real data
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; min-width: 190px; color: #F8FAFC; padding: 4px;">
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 2px;">${pt.name}</div>
          <div style="font-size: 10px; color: #94A3B8; margin-bottom: 8px;">${pt.type}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding: 4px 8px; background: #0D1422; border-radius: 8px;">
            <span style="font-size: 11px; color: #94A3B8;">${scale}:</span>
            <span style="font-size: 14px; font-weight: 800; font-family: monospace; color: ${cat.color};">${aqiVal ?? 'N/A'} (${cat.category})</span>
          </div>
          <div style="font-size: 11px; color: #94A3B8; display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>PM2.5:</span>
            <strong style="color: #F8FAFC;">${pt.pm25 != null ? `${pt.pm25} µg/m³` : 'N/A'}</strong>
          </div>
          <div style="font-size: 11px; color: #94A3B8; display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>PM10:</span>
            <strong style="color: #F8FAFC;">${pt.pm10 != null ? `${pt.pm10} µg/m³` : 'N/A'}</strong>
          </div>
          <div style="font-size: 9px; color: #64748B; margin-top: 6px; border-top: 1px solid #1F3045; padding-top: 4px;">
            Timestamp: ${pt.timestamp ? formatDateTime(pt.timestamp) : 'Unavailable'}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'dark-leaflet-popup',
      });

      marker.on('click', () => {
        setSelectedPoint(pt);
      });

      marker.addTo(layer);
    });
  }, [gridPoints, currentLocation, currentAqi, currentPm25, currentPm10, currentTimestamp, scale]);

  return (
    <div className="space-y-6">
      {/* Map Card */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Top Control Bar */}
        <div className="p-4 bg-[#0D1422]/90 border-b border-[#1F3045] flex flex-wrap items-center justify-between gap-3 z-10 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#22C55E]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                {currentLocation.name} Atmospheric Grid
                <span className="text-[10px] font-mono uppercase bg-[#1F3045] text-[#94A3B8] px-2 py-0.5 rounded">
                  Copernicus CAMS Model
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Interactive spatial mapping of Open-Meteo CAMS model estimates (not ground-station measurements)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Map Style Switcher */}
            <div className="flex items-center bg-[#070B13] p-1 rounded-xl border border-[#1F3045] text-xs">
              <button
                onClick={() => handleStyleChange('satellite')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${mapStyle === 'satellite'
                    ? 'bg-emerald-400 text-black shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Satellite</span>
              </button>
              <button
                onClick={() => handleStyleChange('dark')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${mapStyle === 'dark'
                    ? 'bg-emerald-400 text-black shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
              >
                <span>Dark</span>
              </button>
              <button
                onClick={() => handleStyleChange('street')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${mapStyle === 'street'
                    ? 'bg-emerald-400 text-black shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
              >
                <span>Street</span>
              </button>
            </div>

            {loadingPoints && (
              <span className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" />
                Querying...
              </span>
            )}
            <div className="text-xs bg-[#111C2D] border border-[#1F3045] px-3 py-1.5 rounded-xl font-mono text-[#F8FAFC]">
              Lat {currentLocation.latitude.toFixed(3)}, Lon {currentLocation.longitude.toFixed(3)}
            </div>
          </div>
        </div>

        {gridError && (
          <div className="px-4 py-2 text-xs text-amber-300 bg-amber-500/10 border-b border-amber-500/20">
            {gridError}
          </div>
        )}

        {/* Map Canvas */}
        <div className="relative w-full h-[520px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-5 left-5 z-20 bg-[#0D1422]/95 border border-[#1F3045] rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs">
            <div className="font-bold text-[#F8FAFC] mb-2 flex items-center justify-between">
              <span>{scale} Categories</span>
              <span className="text-[10px] text-[#94A3B8] font-normal">Model data</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#22C55E] shrink-0" />
                <span className="text-[#94A3B8]">Good</span>
                <span className="ml-auto font-mono text-[#F8FAFC]">0 - {scale === 'EAQI' ? 20 : 50}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#84CC16] shrink-0" />
                <span className="text-[#94A3B8]">{scale === 'INDAQI' ? 'Satisfactory' : scale === 'EAQI' ? 'Fair' : 'Moderate'}</span>
                <span className="ml-auto font-mono text-[#F8FAFC]">{scale === 'INDAQI' ? '51 - 100' : scale === 'EAQI' ? '20 - 40' : '51 - 100'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EAB308] shrink-0" />
                <span className="text-[#94A3B8]">{scale === 'INDAQI' ? 'Moderate' : scale === 'EAQI' ? 'Moderate' : 'Sensitive'}</span>
                <span className="ml-auto font-mono text-[#F8FAFC]">{scale === 'INDAQI' ? '101 - 200' : scale === 'EAQI' ? '40 - 60' : '101 - 150'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F97316] shrink-0" />
                <span className="text-[#94A3B8]">{scale === 'INDAQI' ? 'Poor' : scale === 'EAQI' ? 'Poor' : 'Unhealthy'}</span>
                <span className="ml-auto font-mono text-[#F8FAFC]">{scale === 'INDAQI' ? '201 - 300' : scale === 'EAQI' ? '60 - 80' : '151 - 200'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444] shrink-0" />
                <span className="text-[#94A3B8]">{scale === 'INDAQI' ? 'Very Poor' : 'Very Poor / Unhealthy'}</span>
                <span className="ml-auto font-mono text-[#F8FAFC]">{scale === 'INDAQI' ? '301 - 400' : scale === 'EAQI' ? '80 - 100' : '201 - 300'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#A855F7] shrink-0" />
                <span className="text-[#94A3B8]">{scale === 'INDAQI' ? 'Severe' : 'Hazardous'}</span>
                <span className="ml-auto font-mono text-[#F8FAFC]">{scale === 'INDAQI' ? '401 - 500' : scale === 'EAQI' ? '> 100' : '301+'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transparent Methodology Footer */}
        <div className="p-3 bg-[#080D18] border-t border-[#1F3045] text-xs text-[#94A3B8] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>
              Values come from Open-Meteo's CAMS atmospheric model grid, not ground monitoring stations. The India index is an approximate PM2.5/PM10-only calculation, not official CPCB AQI.
            </span>
          </div>
          <span className="font-mono text-[#94A3B8]/80 text-[11px]">
            Points Active: {gridPoints.length + 1}
          </span>
        </div>
      </div>

      {/* Grid Coordinates Telemetry Cards */}
      <div>
        <h4 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider mb-3">
          Surrounding Sub-Grid Telemetry
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridPoints.map((pt) => {
            const aqiVal = scale === 'INDAQI'
              ? pt.indAqi
              : scale === 'EAQI'
                ? pt.europeanAqi
                : pt.usAqi;
            const cat = getCategoryForScale(aqiVal, scale);
            return (
              <div
                key={pt.id}
                className="bg-[#111C2D] border border-[#1F3045] rounded-xl p-4 hover:border-[#22C55E]/50 transition-all shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-bold text-sm text-[#F8FAFC]">{pt.name}</h5>
                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      {pt.latitude.toFixed(2)}°N, {pt.longitude.toFixed(2)}°E
                    </span>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs"
                    style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
                  >
                    AQI {aqiVal ?? 'N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-[#0D1422] p-2.5 rounded-lg border border-[#1F3045]/60">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">PM2.5</span>
                    <strong className="text-[#F8FAFC] font-mono">
                      {pt.pm25 != null ? `${pt.pm25} µg/m³` : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">PM10</span>
                    <strong className="text-[#F8FAFC] font-mono">
                      {pt.pm10 != null ? `${pt.pm10} µg/m³` : 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
