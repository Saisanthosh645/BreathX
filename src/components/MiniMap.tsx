import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationInfo, AQIScale } from '../types/airQuality';
import { GLOBAL_CITIES } from '../data/globalCities';
import { soundFx } from '../utils/audioFx';
import { Plus, Minus, Layers, RotateCcw, MapPin, Maximize2, Globe2 } from 'lucide-react';

interface MiniMapProps {
  selectedLocation: LocationInfo;
  onSelectLocation?: (loc: LocationInfo) => void;
  scale: AQIScale;
  onExpandMap?: () => void;
}

export function MiniMap({
  selectedLocation,
  onSelectLocation,
  scale,
  onExpandMap,
}: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark'>('satellite');

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      // Initialize Leaflet map with realistic satellite view
      const map = L.map(containerRef.current, {
        center: [22, -15],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
      });

      // 1. Realistic Satellite Imagery Base Layer (Esri World Imagery)
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          subdomains: ['server', 'services'],
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

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Ensure leaflet tiles load cleanly without grey gaps
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
        map.remove();
        mapRef.current = null;
      };
    }
  }, []);

  // Handle map style toggling (Satellite vs Dark)
  const toggleMapStyle = (style: 'satellite' | 'dark') => {
    soundFx.playClickTone();
    setMapStyle(style);
    const map = mapRef.current;
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
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map);
      labelsTileLayerRef.current = null;
    }

    // Re-bring markers to top
    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((l: any) => {
        if (typeof l.bringToFront === 'function') l.bringToFront();
      });
    }
  };

  // Update hotspot markers whenever the scale changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Global pins are navigational; live readings are fetched after a city is selected.
    GLOBAL_CITIES.forEach((city) => {
      const isSelected =
        Math.abs(city.latitude - selectedLocation.latitude) < 0.1 &&
        Math.abs(city.longitude - selectedLocation.longitude) < 0.1;
      const glowColor = isSelected ? '#22c55e' : '#38bdf8';

      const html = `
        <div class="relative group cursor-pointer flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div class="absolute w-7 h-7 rounded-full opacity-60 animate-ping" style="background-color: ${glowColor}; animation-duration: 2.8s;"></div>
          <div class="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-xl transition-transform hover:scale-150" style="background-color: ${glowColor}; box-shadow: 0 0 12px ${glowColor}, 0 2px 4px rgba(0,0,0,0.8);">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          ${
            isSelected
              ? `<div class="absolute -top-7 px-1.5 py-0.5 rounded bg-emerald-400 text-black text-[9px] font-black font-mono tracking-tight pointer-events-none shadow-lg border border-black/20">YOU</div>`
              : ''
          }
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-aqi-pin',
        html,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([city.latitude, city.longitude], { icon });

      // Popup with rich satellite styling
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; padding: 6px 4px; color: #F8FAFC; min-width: 140px;">
          <div style="font-size: 11px; font-weight: 800; color: #F8FAFC; display: flex; align-items: center; justify-content: space-between;">
            <span>${city.name}</span>
            <span style="font-size: 9px; color: #94A3B8;">${city.countryCode}</span>
          </div>
          <div style="font-size: 10px; color: #CBD5E1; margin: 6px 0;">Select to load the latest CAMS model estimate.</div>
          <button id="btn-select-${city.id}" style="width: 100%; background: #22c55e; color: #000; font-size: 9px; font-weight: 800; padding: 5px 8px; border-radius: 6px; border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(34,197,94,0.4);">
            Inspect City
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'dark-leaflet-popup',
        closeButton: false,
      });

      marker.on('popupopen', () => {
        soundFx.playHoverChirp();
        const btn = document.getElementById(`btn-select-${city.id}`);
        if (btn) {
          btn.onclick = () => {
            soundFx.playClickTone();
            if (onSelectLocation) {
              onSelectLocation({
                id: city.id,
                name: city.name,
                country: city.country,
                countryCode: city.countryCode,
                admin1: city.admin1,
                latitude: city.latitude,
                longitude: city.longitude,
                timezone: city.timezone,
              });
            }
          };
        }
      });

      layer.addLayer(marker);
    });
  }, [selectedLocation, onSelectLocation]);

  const handleZoomIn = () => {
    soundFx.playClickTone();
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    soundFx.playClickTone();
    mapRef.current?.zoomOut();
  };

  const handleReset = () => {
    soundFx.playClickTone();
    mapRef.current?.setView([22, -15], 2);
  };

  const handleFocusSelected = () => {
    soundFx.playClickTone();
    mapRef.current?.flyTo([selectedLocation.latitude, selectedLocation.longitude], 5, {
      duration: 1.2,
    });
  };

  return (
    <div className="relative w-full h-full min-h-[176px] bg-[#070D18]">
      {/* Map DOM Element */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Realistic Map Layer Badge (Satellite vs Dark) */}
      <div className="absolute top-2.5 left-2.5 z-[500] flex items-center gap-1 bg-[#090E17]/85 border border-[#162338] p-0.5 rounded-xl backdrop-blur-md shadow-lg">
        <button
          onClick={() => toggleMapStyle('satellite')}
          title="Photorealistic Satellite Imagery"
          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
            mapStyle === 'satellite'
              ? 'bg-emerald-400 text-black shadow-sm'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <Globe2 className="w-2.5 h-2.5" />
          <span>Satellite</span>
        </button>
        <button
          onClick={() => toggleMapStyle('dark')}
          title="High-Tech Dark Map"
          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
            mapStyle === 'dark'
              ? 'bg-emerald-400 text-black shadow-sm'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <span>Dark</span>
        </button>
      </div>

      {/* High-Tech Map Navigation Controls */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 z-[500]">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-6 h-6 rounded-lg bg-[#0B1220]/90 border border-[#162338] text-[#F8FAFC] hover:bg-[#152234] hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shadow-md backdrop-blur-sm"
        >
          <Plus className="w-3 h-3" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-6 h-6 rounded-lg bg-[#0B1220]/90 border border-[#162338] text-[#F8FAFC] hover:bg-[#152234] hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shadow-md backdrop-blur-sm"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          onClick={handleReset}
          title="Reset World View"
          className="w-6 h-6 rounded-lg bg-[#0B1220]/90 border border-[#162338] text-[#F8FAFC] hover:bg-[#152234] hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shadow-md backdrop-blur-sm"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Target Focus on Current City Button */}
      <div className="absolute top-2.5 right-2.5 z-[500] flex items-center gap-1.5">
        <button
          onClick={handleFocusSelected}
          className="px-2 py-1 rounded-lg bg-[#0B1220]/90 border border-[#162338] text-emerald-400 hover:bg-[#152234] text-[10px] font-mono font-bold flex items-center gap-1 shadow-md backdrop-blur-sm cursor-pointer"
        >
          <MapPin className="w-3 h-3" />
          <span>{selectedLocation.name}</span>
        </button>

        {onExpandMap && (
          <button
            onClick={onExpandMap}
            title="Expand Full 2D Map"
            className="p-1 rounded-lg bg-[#0B1220]/90 border border-[#162338] text-[#94A3B8] hover:text-emerald-400 hover:bg-[#152234] shadow-md backdrop-blur-sm cursor-pointer transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Real-time telemetry scanner line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none z-[450] animate-pulse" />
    </div>
  );
}
