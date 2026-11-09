import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { LocationInfo, AQIScale } from '../types/airQuality';
import { soundFx } from '../utils/audioFx';
import { GLOBAL_CITIES_AQI, GlobalCityAQI } from '../data/globalCitiesAqi';
import {
  RotateCcw,
  Play,
  Pause,
  MapPin,
  Layers,
  Volume2,
  VolumeX,
  Globe2,
  Search,
  ArrowUpDown,
  X,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Globe3DProps {
  selectedLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  currentAqi: number | null;
  scale: AQIScale;
  height?: string;
  compactHud?: boolean;
}

// Convert geographic coordinates (lat, lon in degrees) to 3D Cartesian coordinates
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// -------------------------------------------------------------------------------------------------
// 1. Procedural Realistic Satellite Earth Texture (Instant 0ms fallback - NEVER shows a black globe)
// -------------------------------------------------------------------------------------------------
function createProceduralSatelliteTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Base Deep Ocean Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, '#0c2744');
  oceanGrad.addColorStop(0.3, '#081e36');
  oceanGrad.addColorStop(0.5, '#0a233e');
  oceanGrad.addColorStop(0.7, '#081e36');
  oceanGrad.addColorStop(1.0, '#0a213a');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Shallow Turquoise Reef & Continental Shelf Waters (Caribbean, Florida, Bahamas, Gulf of Mexico)
  const drawReef = (lon: number, lat: number, rX: number, rY: number, color = 'rgba(20, 184, 166, 0.45)') => {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.filter = 'blur(12px)';
    ctx.ellipse(toX(lon), toY(lat), rX, rY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawReef(-78, 25, 45, 25, 'rgba(6, 182, 212, 0.65)'); // Bahamas / Florida
  drawReef(-85, 21, 35, 20, 'rgba(14, 165, 233, 0.50)'); // Cuba / Yucatan
  drawReef(-68, 14, 40, 20, 'rgba(20, 184, 166, 0.45)'); // Caribbean basin
  drawReef(-90, 28, 50, 20, 'rgba(14, 165, 233, 0.40)'); // Gulf Coast shelf
  drawReef(-55, -2, 50, 30, 'rgba(20, 184, 166, 0.35)'); // Amazon shelf
  drawReef(145, -18, 50, 40, 'rgba(6, 182, 212, 0.55)'); // Great Barrier Reef

  // Helper to draw continent landmass polygon
  const drawLandmass = (
    pts: [number, number][],
    fillColor: string,
    strokeColor?: string
  ) => {
    if (pts.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(toX(pts[0][0]), toY(pts[0][1]));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(toX(pts[i][0]), toY(pts[i][1]));
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  };

  // 1. Greenland & Polar Ice Caps (Crisp Snow White)
  drawLandmass(
    [
      [-55, 83], [-20, 83], [-18, 76], [-25, 70], [-43, 60], [-50, 62],
      [-55, 69], [-60, 76], [-55, 83]
    ],
    '#F1F5F9',
    '#BAE6FD'
  );
  // Antarctica ice fringe
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(0, toY(-75), width, height - toY(-75));

  // 2. North America (Boreal Forest Green, Temperate Green, Desert Tan)
  // Canada & Alaska
  drawLandmass(
    [
      [-168, 65], [-160, 71], [-140, 70], [-120, 74], [-95, 74], [-80, 68],
      [-60, 60], [-55, 52], [-65, 45], [-75, 45], [-85, 50], [-95, 49],
      [-125, 49], [-130, 55], [-141, 60], [-165, 58], [-168, 65]
    ],
    '#1E3A27'
  );

  // United States & Great Lakes
  drawLandmass(
    [
      [-125, 49], [-95, 49], [-85, 46], [-75, 44], [-67, 45], [-70, 42],
      [-75, 36], [-81, 25], [-83, 29], [-88, 30], [-94, 29], [-97, 26],
      [-105, 31], [-117, 32], [-124, 42], [-125, 49]
    ],
    '#2A4E31'
  );

  // Western US desert & Colorado plateau accent
  drawLandmass(
    [
      [-119, 41], [-112, 42], [-108, 37], [-105, 32], [-115, 32], [-119, 36]
    ],
    '#8C6E4A'
  );

  // Mexico & Central America
  drawLandmass(
    [
      [-117, 32], [-106, 31], [-97, 26], [-90, 21], [-87, 21], [-88, 16],
      [-83, 10], [-77, 8], [-80, 9], [-85, 13], [-93, 16], [-105, 20],
      [-110, 24], [-115, 30], [-117, 32]
    ],
    '#5C5A37'
  );

  // Baja California
  drawLandmass(
    [[-117, 32], [-114, 30], [-110, 24], [-111, 24], [-115, 31], [-117, 32]],
    '#7D623F'
  );

  // 3. South America (Lush Amazon Green, Brazilian Highlands, Andes Spine)
  drawLandmass(
    [
      [-77, 8], [-73, 12], [-60, 10], [-50, 5], [-35, -5], [-35, -15],
      [-40, -22], [-48, -28], [-53, -33], [-58, -35], [-65, -42], [-66, -54],
      [-73, -53], [-74, -45], [-71, -33], [-76, -18], [-80, -5], [-77, 8]
    ],
    '#134323'
  );

  // Amazon basin deepest emerald forest
  drawLandmass(
    [
      [-72, 2], [-60, 4], [-48, -2], [-45, -8], [-52, -15], [-65, -14],
      [-70, -8], [-72, 2]
    ],
    '#0B331A'
  );

  // Andes mountain ridge (warm earth brown)
  drawLandmass(
    [
      [-77, 6], [-76, -4], [-76, -15], [-70, -22], [-70, -34], [-73, -45],
      [-69, -54], [-67, -54], [-68, -45], [-67, -33], [-67, -22], [-73, -15],
      [-74, -4], [-77, 6]
    ],
    '#5A422D'
  );

  // 4. Africa (Sahara Desert Gold, Sahel Savanna, Congo Basin Green)
  // North Africa & Sahara Desert
  drawLandmass(
    [
      [-17, 21], [-13, 28], [-5, 36], [10, 37], [25, 32], [32, 31],
      [35, 27], [43, 12], [51, 12], [42, 4], [30, 8], [15, 12],
      [-5, 15], [-17, 21]
    ],
    '#B58D54'
  );
  // Central & Southern Africa (tropical green & savanna)
  drawLandmass(
    [
      [-17, 21], [-5, 15], [10, 5], [15, -5], [18, -20], [18, -34],
      [28, -34], [33, -26], [40, -10], [42, 4], [30, 8], [15, 12],
      [5, 4], [-12, 7], [-17, 15], [-17, 21]
    ],
    '#194223'
  );

  // 5. Europe & Western Eurasia (Temperate Green)
  drawLandmass(
    [
      [-10, 36], [-8, 43], [0, 44], [-3, 50], [2, 53], [8, 55],
      [15, 58], [25, 70], [40, 68], [55, 60], [45, 45], [35, 42],
      [25, 36], [15, 38], [5, 43], [-3, 40], [-10, 36]
    ],
    '#264E2D'
  );
  // UK & Ireland
  drawLandmass([[-10, 52], [-6, 55], [-6, 52], [-10, 52]], '#2A5A32');
  drawLandmass([[-5, 50], [-2, 58], [1, 53], [-5, 50]], '#2A5A32');

  // Subtle atmospheric cloud streaks (soft realism)
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.filter = 'blur(8px)';
  ctx.beginPath();
  ctx.ellipse(toX(-45), toY(35), 180, 25, -0.3, 0, Math.PI * 2);
  ctx.ellipse(toX(-60), toY(-25), 160, 22, 0.25, 0, Math.PI * 2);
  ctx.ellipse(toX(-100), toY(55), 200, 30, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// -------------------------------------------------------------------------------------------------
// 2. Crisp White Political Country Borders & Clean Labels Texture (Google Earth Style)
// -------------------------------------------------------------------------------------------------
function createBordersAndLabelsTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Thin, crisp white country boundaries with soft glow (like Google Earth satellite view)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.lineWidth = 1.35;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 2.5;

  const drawBorder = (pts: [number, number][], dash = false) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    if (dash) ctx.setLineDash([4, 3]);
    else ctx.setLineDash([]);
    ctx.moveTo(toX(pts[0][0]), toY(pts[0][1]));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(toX(pts[i][0]), toY(pts[i][1]));
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // --- NORTH AMERICA BORDERS ---
  // US - Canada Border (49th Parallel from Pacific to Great Lakes, then Maine)
  drawBorder([
    [-123.3, 49.0], [-115.0, 49.0], [-105.0, 49.0], [-95.1, 49.0], [-94.5, 48.6],
    [-89.5, 48.0], [-84.5, 46.5], [-84.0, 45.8], [-82.4, 43.0], [-83.1, 42.0],
    [-82.5, 41.7], [-79.0, 42.8], [-79.0, 43.5], [-76.5, 44.0], [-74.8, 45.0],
    [-71.5, 45.0], [-71.0, 45.3], [-70.0, 47.0], [-67.8, 47.4], [-67.0, 45.0],
    [-67.0, 44.5]
  ]);
  // Alaska - Canada (141st Meridian)
  drawBorder([
    [-141.0, 69.6], [-141.0, 60.3], [-135.0, 59.0], [-130.5, 55.0]
  ]);
  // US - Mexico (Tijuana on Pacific to Rio Grande curve at Gulf of Mexico)
  drawBorder([
    [-117.1, 32.5], [-114.7, 32.7], [-111.0, 31.3], [-108.2, 31.8], [-106.5, 31.8],
    [-104.5, 29.5], [-103.0, 29.0], [-101.5, 29.8], [-100.5, 28.5], [-99.5, 27.5],
    [-97.5, 26.0]
  ]);
  // Mexico - Guatemala / Belize
  drawBorder([
    [-92.2, 14.5], [-91.8, 15.5], [-91.0, 16.0], [-91.0, 17.8], [-89.2, 17.8], [-88.3, 18.5]
  ]);
  // Central America (Guatemala, Honduras, Nicaragua, Costa Rica, Panama)
  drawBorder([[-89.1, 14.4], [-88.3, 15.8]]);
  drawBorder([[-87.3, 13.0], [-86.5, 14.0], [-84.0, 14.9], [-83.2, 15.0]]);
  drawBorder([[-85.8, 11.2], [-85.0, 11.0], [-83.6, 10.7]]);
  drawBorder([[-83.0, 8.5], [-82.8, 9.5], [-82.5, 8.3]]);
  drawBorder([[-77.5, 7.2], [-77.2, 8.6]]); // Panama - Colombia

  // Caribbean Islands Outlines
  drawBorder([[-84.9, 21.8], [-82.0, 23.1], [-78.0, 22.0], [-74.2, 20.2], [-77.0, 19.9], [-81.0, 22.0], [-84.9, 21.8]]); // Cuba
  drawBorder([[-71.7, 19.9], [-71.8, 18.2]]); // Haiti - Dominican Rep
  drawBorder([[-67.2, 18.5], [-65.6, 18.5], [-65.6, 17.9], [-67.2, 17.9], [-67.2, 18.5]]); // Puerto Rico

  // --- SOUTH AMERICA BORDERS (Clear, High-Definition Country Lines) ---
  // Colombia - Venezuela
  drawBorder([[-73.0, 11.8], [-72.0, 9.0], [-67.5, 6.0], [-67.0, 2.0]]);
  // Colombia - Ecuador - Peru
  drawBorder([[-79.0, 1.4], [-77.0, 0.8], [-75.2, 0.0], [-70.0, -4.2]]);
  // Venezuela - Guyana - Suriname - French Guiana
  drawBorder([[-60.0, 8.5], [-60.5, 5.0], [-57.2, 2.0]]);
  drawBorder([[-57.2, 6.0], [-57.5, 2.0]]);
  drawBorder([[-54.0, 5.7], [-54.5, 2.2]]);
  drawBorder([[-51.6, 4.3], [-52.5, 2.0]]);
  // Peru - Brazil
  drawBorder([[-70.0, -4.2], [-73.5, -7.5], [-74.0, -9.5], [-69.5, -11.0]]);
  // Peru - Bolivia
  drawBorder([[-69.5, -11.0], [-69.0, -15.5], [-69.5, -17.5]]);
  // Bolivia - Brazil
  drawBorder([[-69.5, -11.0], [-65.0, -9.8], [-60.0, -16.0], [-58.0, -20.0]]);
  // Chile - Argentina (The iconic Andes Mountain Spine down to Tierra del Fuego)
  drawBorder([
    [-69.5, -17.5], [-67.0, -23.0], [-69.8, -30.0], [-70.0, -33.5], [-71.5, -42.0],
    [-73.5, -48.0], [-68.5, -55.0]
  ]);
  // Bolivia - Argentina / Paraguay
  drawBorder([[-67.0, -23.0], [-64.0, -22.0], [-62.0, -22.0], [-60.5, -19.5], [-58.0, -20.0]]);
  // Paraguay - Argentina - Brazil
  drawBorder([[-62.0, -22.0], [-57.5, -25.2], [-54.5, -25.5], [-54.0, -27.5]]);
  // Uruguay - Brazil - Argentina
  drawBorder([[-58.5, -34.0], [-58.0, -31.5], [-57.5, -30.2], [-53.5, -31.5], [-53.5, -33.8]]);

  // --- WESTERN EUROPE & NORTH AFRICA BORDERS (Visible on East Edge) ---
  // Pyrenees (France - Spain)
  drawBorder([[-1.8, 43.4], [0.5, 42.8], [3.2, 42.4]]);
  // Spain - Portugal
  drawBorder([[-8.5, 42.0], [-6.5, 42.0], [-7.0, 39.0], [-7.5, 37.2]]);
  // North Africa (Morocco, Algeria, Mauritania)
  drawBorder([[-2.2, 35.1], [-5.0, 32.0], [-8.6, 27.6]]);
  drawBorder([[-8.6, 27.6], [-12.0, 27.6], [-12.0, 21.0]]);
  drawBorder([[25.0, 31.5], [25.0, 22.0]]); // Egypt - Libya

  // --- GEOGRAPHIC TYPOGRAPHY (Matching User's Reference Screenshot) ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;

  // 1. "NORTH AMERICA" (clean bold white sans-serif with subtle dark halo)
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(8, 14, 24, 0.95)';

  ctx.strokeText('NORTH', toX(-88), toY(50));
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('NORTH', toX(-88), toY(50));

  ctx.strokeText('AMERICA', toX(-88), toY(45.5));
  ctx.fillText('AMERICA', toX(-88), toY(45.5));

  // 2. "SOUTH AMERICA" (clean bold white sans-serif with subtle dark halo)
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.strokeText('SOUTH', toX(-55), toY(-13));
  ctx.fillText('SOUTH', toX(-55), toY(-13));

  ctx.strokeText('AMERICA', toX(-55), toY(-18));
  ctx.fillText('AMERICA', toX(-55), toY(-18));

  // 3. "North Atlantic Ocean" (italic, elegant, subtle cyan-blue, angled across Atlantic)
  ctx.save();
  ctx.translate(toX(-40), toY(27));
  ctx.rotate(-22 * (Math.PI / 180));
  ctx.font = 'italic 500 15px Georgia, "Times New Roman", serif';
  ctx.lineWidth = 3.0;
  ctx.strokeStyle = 'rgba(5, 12, 28, 0.92)';
  ctx.strokeText('North Atlantic', 0, 0);
  ctx.fillStyle = 'rgba(186, 230, 253, 0.88)';
  ctx.fillText('North Atlantic', 0, 0);

  ctx.strokeText('Ocean', 0, 18);
  ctx.fillText('Ocean', 0, 18);
  ctx.restore();

  // 4. Subtle Pacific Ocean Label
  ctx.save();
  ctx.translate(toX(-135), toY(26));
  ctx.rotate(75 * (Math.PI / 180));
  ctx.font = 'italic 400 13px Georgia, serif';
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = 'rgba(5, 12, 28, 0.8)';
  ctx.strokeText('Pacific Ocean', 0, 0);
  ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
  ctx.fillText('Pacific Ocean', 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// -------------------------------------------------------------------------------------------------
// 3. Floating 3D AQI Pill Badge Sprite (Optional, activated via top control pill)
// -------------------------------------------------------------------------------------------------
function createAqiBadgeSprite(aqi: number, colorHex: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 44;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(8, 14, 26, 0.92)';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(4, 4, 92, 36, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(aqi), 50, 22);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.14, 0.065, 1);
  return sprite;
}

// =================================================================================================
// MAIN COMPONENT: Globe3D
// =================================================================================================
export function Globe3D({
  selectedLocation,
  onSelectLocation,
  currentAqi,
  scale,
  height = '660px',
  compactHud = false,
}: Globe3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showBorders, setShowBorders] = useState(true);
  const [showAqiTags, setShowAqiTags] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [continentFilter, setContinentFilter] = useState<string>('All');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [hoveredCity, setHoveredCity] = useState<GlobalCityAQI | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const bordersMeshRef = useRef<THREE.Mesh | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const aqiTagsGroupRef = useRef<THREE.Group | null>(null);
  const waveRingsRef = useRef<THREE.Mesh[]>([]);

  // Dragging & Orientation
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  // Track if this is user's first mount (keep Americas view until explicitly changed)
  const isFirstMountRef = useRef(true);

  const toggleAudio = useCallback(() => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    soundFx.setEnabled(next);
    if (next) soundFx.playCityLockChime();
  }, [isAudioEnabled]);

  // Jump camera directly to the Reference Americas & Atlantic View (matching user's screenshot)
  const snapToAmericas = useCallback(() => {
    soundFx.playClickTone();
    const initLon = -48;
    const initLat = 18;
    const initPhi = (90 - initLat) * (Math.PI / 180);
    const initTheta = (initLon + 180) * (Math.PI / 180);
    targetRotationRef.current.y = Math.PI / 2 - initTheta;
    targetRotationRef.current.x = initPhi - Math.PI / 2;
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 5.8);
    }
  }, []);

  // Jump camera to a specific city
  const jumpToCity = useCallback(
    (city: GlobalCityAQI | LocationInfo) => {
      soundFx.playCityLockChime();
      onSelectLocation(city);
      const phi = (90 - city.latitude) * (Math.PI / 180);
      const theta = (city.longitude + 180) * (Math.PI / 180);
      targetRotationRef.current.y = Math.PI / 2 - theta;
      targetRotationRef.current.x = phi - Math.PI / 2;
    },
    [onSelectLocation]
  );

  // Sync orientation when selectedLocation updates (only after initial mount)
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    const phi = (90 - selectedLocation.latitude) * (Math.PI / 180);
    const theta = (selectedLocation.longitude + 180) * (Math.PI / 180);
    targetRotationRef.current.y = Math.PI / 2 - theta;
    targetRotationRef.current.x = phi - Math.PI / 2;
  }, [selectedLocation]);

  // Toggle Borders visibility
  useEffect(() => {
    if (bordersMeshRef.current) {
      bordersMeshRef.current.visible = showBorders;
    }
  }, [showBorders]);

  // Toggle floating AQI tags visibility
  useEffect(() => {
    if (aqiTagsGroupRef.current) {
      aqiTagsGroupRef.current.visible = showAqiTags;
    }
  }, [showAqiTags]);

  // The directory is geographic only; live AQI is loaded after selecting a city.
  const filteredCities = useMemo(() => {
    return GLOBAL_CITIES_AQI.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.country.toLowerCase().includes(searchFilter.toLowerCase());
      const matchContinent = continentFilter === 'All' || c.continent === continentFilter;
      return matchSearch && matchContinent;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchFilter, continentFilter]);

  // -----------------------------------------------------------------------------------------------
  // Three.js Scene Setup (Mounts once, maintains state, zero flickering or black screens)
  // -----------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const h = container.clientHeight || (compactHud ? 176 : 660);

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Default orientation: Americas & North Atlantic View (Matching User Reference Image)
    const initLon = -48;
    const initLat = 18;
    const initPhi = (90 - initLat) * (Math.PI / 180);
    const initTheta = (initLon + 180) * (Math.PI / 180);
    targetRotationRef.current.y = Math.PI / 2 - initTheta;
    targetRotationRef.current.x = initPhi - Math.PI / 2;
    currentRotationRef.current.x = targetRotationRef.current.x;
    currentRotationRef.current.y = targetRotationRef.current.y;

    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 200);
    camera.position.set(0, 0, 5.8);
    cameraRef.current = camera;

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Space Background & Starfield
    const starsCount = 700;
    const starsGeo = new THREE.BufferGeometry();
    const starsPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      const rad = 25 + Math.random() * 40;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starsPos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      starsPos[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      starsPos[i * 3 + 2] = rad * Math.cos(phi);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
    });
    const starfield = new THREE.Points(starsGeo, starsMat);
    scene.add(starfield);

    // 4. Central Earth Planetary Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const globeRadius = 2.35;
    const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);

    // Instant procedural satellite fallback (guarantees NO black globe while high-res image loads)
    const proceduralTexture = createProceduralSatelliteTexture();
    const earthMaterial = new THREE.MeshBasicMaterial({
      map: proceduralTexture,
    });
    earthMaterialRef.current = earthMaterial;

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Load authentic NASA Blue Marble High-Res Satellite Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/assets/earth/earth-blue-marble.jpg',
      (loadedTex) => {
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.ClampToEdgeWrapping;
        loadedTex.generateMipmaps = true;
        loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTex.magFilter = THREE.LinearFilter;
        earthMaterial.map = loadedTex;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Falling back to procedural satellite Earth texture:', err);
      }
    );

    // 5. White Political Boundaries & Clean Typography Mesh
    const bordersTexture = createBordersAndLabelsTexture();
    const bordersGeometry = new THREE.SphereGeometry(globeRadius * 1.002, 64, 64);
    const bordersMaterial = new THREE.MeshBasicMaterial({
      map: bordersTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const bordersMesh = new THREE.Mesh(bordersGeometry, bordersMaterial);
    bordersMesh.visible = showBorders;
    globeGroup.add(bordersMesh);
    bordersMeshRef.current = bordersMesh;

    // 6. Atmospheric Rayleigh Glow Corona (Halo matching user reference screenshot)
    const atmoGeometry = new THREE.SphereGeometry(globeRadius * 1.036, 64, 64);
    const atmoMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.74 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          vec3 atmoSkyCyan = vec3(0.35, 0.72, 1.0);
          gl_FragColor = vec4(atmoSkyCyan, 1.0) * intensity * 1.4;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    globeGroup.add(atmoMesh);

    // 7. Interactive Flat Surface AQI Micro-Nodes
    const pinsGroup = new THREE.Group();
    globeGroup.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    const aqiTagsGroup = new THREE.Group();
    aqiTagsGroup.visible = showAqiTags;
    globeGroup.add(aqiTagsGroup);
    aqiTagsGroupRef.current = aqiTagsGroup;

    const waveRingsList: THREE.Mesh[] = [];

    GLOBAL_CITIES_AQI.forEach((city) => {
      const isSelected = city.name === selectedLocation.name;
      const hasReading = isSelected && currentAqi !== null;
      const pinColor = new THREE.Color(hasReading ? '#22C55E' : '#38BDF8');

      const pos = latLonToVector3(city.latitude, city.longitude, globeRadius);
      const normal = pos.clone().normalize();

      // Sleek surface glowing micro-circle (flat on the sphere surface)
      const dotRadius = isSelected ? 0.040 : 0.022;
      const dotGeo = new THREE.CircleGeometry(dotRadius, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        depthTest: true,
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.006)));
      dotMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      dotMesh.userData = { city };
      pinsGroup.add(dotMesh);

      // Selected target city gets an expanding pulse ring
      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(0.045, 0.08, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: pinColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.008)));
        ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        pinsGroup.add(ringMesh);
        waveRingsList.push(ringMesh);
      }

      if (hasReading) {
        const sprite = createAqiBadgeSprite(currentAqi, pinColor.getStyle());
        const spritePos = pos.clone().add(normal.clone().multiplyScalar(0.12));
        sprite.position.copy(spritePos);
        sprite.userData = { city };
        aqiTagsGroup.add(sprite);
      }
    });
    waveRingsRef.current = waveRingsList;

    // 8. Mouse Drag & Raycasting Controls
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        targetRotationRef.current.y += deltaX * 0.005;
        targetRotationRef.current.x += deltaY * 0.005;
        targetRotationRef.current.x = Math.max(
          -Math.PI / 2.2,
          Math.min(Math.PI / 2.2, targetRotationRef.current.x)
        );

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      } else {
        raycaster.setFromCamera(mouse, camera);
        const pinIntersects = raycaster.intersectObjects(pinsGroup.children);
        if (pinIntersects.length > 0 && pinIntersects[0].object.userData.city) {
          setHoveredCity(pinIntersects[0].object.userData.city);
          return;
        }
        setHoveredCity(null);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinsGroup.children);
      if (intersects.length > 0 && intersects[0].object.userData.city) {
        jumpToCity(intersects[0].object.userData.city);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.003;
      camera.position.z = Math.max(4.0, Math.min(8.5, camera.position.z));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 9. Animation Render Loop
    let frameId = 0;
    let lastTime = performance.now();
    let ringTimer = 0;

    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      ringTimer += delta;

      if (autoRotateRef.current && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.10 * delta;
      }

      currentRotationRef.current.x +=
        (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y +=
        (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      globeGroup.rotation.x = currentRotationRef.current.x;
      globeGroup.rotation.y = currentRotationRef.current.y;

      waveRingsRef.current.forEach((ring) => {
        const cycle = (ringTimer * 1.5) % 2.0;
        const scaleVal = 1.0 + cycle * 0.9;
        ring.scale.set(scaleVal, scaleVal, scaleVal);
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.85 * (1.0 - cycle / 2.0));
      });

      starfield.rotation.y += 0.005 * delta;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const newH = container.clientHeight || (compactHud ? 176 : 660);
      camera.aspect = w / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(w, newH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);

      renderer.dispose();
      earthGeometry.dispose();
      proceduralTexture.dispose();
      bordersTexture.dispose();
    };
  }, [compactHud, jumpToCity]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#162338] bg-[#030712] shadow-2xl group select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        style={{ height }}
        className="w-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Left: Clean NASA Satellite Earth Pill */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 bg-[#090E17]/85 border border-[#162338] px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5" />
          NASA Satellite Earth
        </span>
      </div>

      {/* Top Center: Clean Controls Pill (Only in full mode) */}
      {!compactHud && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#090E17]/90 border border-[#162338] p-1 rounded-2xl backdrop-blur-md shadow-xl text-xs">
          {/* Toggle Borders */}
          <button
            onClick={() => {
              soundFx.playClickTone();
              setShowBorders(!showBorders);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              showBorders
                ? 'bg-emerald-400 text-black shadow-sm font-bold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            title="Toggle Country Political Boundaries and Labels"
          >
            {showBorders ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Borders & Labels</span>
          </button>

          {/* Toggle AQI Tags */}
          <button
            onClick={() => {
              soundFx.playClickTone();
              setShowAqiTags(!showAqiTags);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              showAqiTags
                ? 'bg-emerald-400 text-black shadow-sm font-bold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            title="Toggle Floating AQI Number Badges"
          >
            <span>AQI Tags</span>
          </button>

          {/* Snap to Americas Reference View */}
          <button
            onClick={snapToAmericas}
            className="px-3 py-1 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            title="Reset to Americas / Atlantic View"
          >
            <span>Americas View</span>
          </button>
        </div>
      )}

      {/* Top Right: Compact City Directory Switcher (Only in full mode) */}
      {!compactHud && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => {
              soundFx.playClickTone();
              setShowDirectory(!showDirectory);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border backdrop-blur-md shadow-lg ${
              showDirectory
                ? 'bg-emerald-400 text-black border-emerald-400'
                : 'bg-[#090E17]/85 text-[#94A3B8] border-[#162338] hover:text-[#F8FAFC]'
            }`}
            title="Open Global Directory of All Places AQI"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Places ({GLOBAL_CITIES_AQI.length})</span>
          </button>

          <button
            onClick={toggleAudio}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              isAudioEnabled
                ? 'bg-emerald-400 text-black border-emerald-400'
                : 'bg-[#090E17]/85 text-[#94A3B8] border-[#162338] hover:text-[#F8FAFC]'
            }`}
            title="Toggle Audio Feedback"
          >
            {isAudioEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Hover Info Tooltip */}
      {hoveredCity && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-[#090E17]/95 border border-emerald-400/60 px-4 py-2 rounded-2xl text-xs text-[#F8FAFC] shadow-2xl font-mono flex items-center gap-3 pointer-events-none backdrop-blur-md">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-white">{hoveredCity.name}</strong>
              <span className="text-[#94A3B8]">({hoveredCity.country})</span>
              <span className="px-2 py-0.5 rounded bg-[#111C2D] text-emerald-400 font-bold">
                {hoveredCity.name === selectedLocation.name && currentAqi !== null
                  ? `AQI: ${currentAqi} (${scale})`
                  : 'Select this city to load its latest AQI'}
              </span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">
              Open-Meteo CAMS model estimate; not a ground-station reading.
            </div>
          </div>
        </div>
      )}

      {/* Global AQI Directory Slide-Over Drawer */}
      {showDirectory && !compactHud && (
        <div className="absolute inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#090E17]/95 border-l border-[#162338] shadow-2xl backdrop-blur-xl flex flex-col p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#162338]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-extrabold text-[#F8FAFC]">
                  Global AQI Telemetry
                </h4>
                <p className="text-[11px] text-[#94A3B8]">
                  All {GLOBAL_CITIES_AQI.length} planetary hubs
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDirectory(false)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2D] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative my-3">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search city or country..."
              className="w-full bg-[#0D1524] border border-[#162338] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Continent Filters & Sorting */}
          <div className="flex flex-wrap gap-1 mb-3">
            {['All', 'Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'].map(
              (cont) => (
                <button
                  key={cont}
                  onClick={() => setContinentFilter(cont)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                    continentFilter === cont
                      ? 'bg-emerald-400 text-black font-bold'
                      : 'bg-[#0D1524] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {cont}
                </button>
              )
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-2 px-1">
            <span>Showing {filteredCities.length} locations</span>
            <div className="flex items-center gap-1 font-mono">
              <button
                onClick={() => setSearchFilter('')}
                className="hover:text-[#F8FAFC] flex items-center gap-1 cursor-pointer"
              >
                <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                <span>Clear search</span>
              </button>
            </div>
          </div>

          {/* Cities List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredCities.map((city) => {
              const isSelected = selectedLocation.name === city.name;
              return (
                <div
                  key={city.name}
                  onClick={() => jumpToCity(city)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#152234] border-emerald-400'
                      : 'bg-[#0D1524] border-[#162338] hover:border-emerald-400/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs text-[#F8FAFC]">{city.name}</strong>
                      <span className="text-[10px] text-[#94A3B8]">({city.countryCode})</span>
                    </div>
                    <div className="text-[10px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
                      <span>{city.continent}</span>
                      <span>•</span>
                      <span className="text-[#94A3B8] font-mono">Select to load live AQI</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Dock: Auto-Rotate, Quick Regional Jumps, Reset (Only in full mode) */}
      {!compactHud && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#090E17]/90 border border-[#162338] rounded-2xl p-1.5 px-3.5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-center gap-2.5 text-xs">
          <button
            onClick={() => {
              soundFx.playClickTone();
              setAutoRotate(!autoRotate);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              autoRotate
                ? 'bg-emerald-400 text-black shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] bg-[#0D1524] border border-[#162338]'
            }`}
          >
            {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{autoRotate ? 'Orbiting' : 'Orbit'}</span>
          </button>

          {/* Regional Quick Jumps */}
          <div className="flex items-center gap-1 border-x border-[#162338] px-2.5">
            <button
              onClick={snapToAmericas}
              className="px-2 py-0.5 rounded-lg text-xs font-semibold text-[#F8FAFC] bg-[#152234] border border-emerald-400/40 hover:border-emerald-400 transition-colors cursor-pointer"
            >
              Americas
            </button>
            <button
              onClick={() => {
                soundFx.playClickTone();
                const phi = (90 - 45) * (Math.PI / 180);
                const theta = (-10 + 180) * (Math.PI / 180);
                targetRotationRef.current.y = Math.PI / 2 - theta;
                targetRotationRef.current.x = phi - Math.PI / 2;
              }}
              className="px-2 py-0.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#152234] transition-colors cursor-pointer"
            >
              Europe & Africa
            </button>
            <button
              onClick={() => {
                soundFx.playClickTone();
                const phi = (90 - 22) * (Math.PI / 180);
                const theta = (78 + 180) * (Math.PI / 180);
                targetRotationRef.current.y = Math.PI / 2 - theta;
                targetRotationRef.current.x = phi - Math.PI / 2;
              }}
              className="px-2 py-0.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#152234] transition-colors cursor-pointer"
            >
              Asia & India
            </button>
            <button
              onClick={() => {
                soundFx.playClickTone();
                const phi = (90 - 35) * (Math.PI / 180);
                const theta = (140 + 180) * (Math.PI / 180);
                targetRotationRef.current.y = Math.PI / 2 - theta;
                targetRotationRef.current.x = phi - Math.PI / 2;
              }}
              className="px-2 py-0.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#152234] transition-colors cursor-pointer"
            >
              East Asia / Pacific
            </button>
          </div>

          {/* Reset Camera Button */}
          <button
            onClick={snapToAmericas}
            title="Reset View"
            className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#152234] rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
