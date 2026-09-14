import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  X,
  Layers, 
  Flame, 
  Pickaxe, 
  Droplets, 
  Shield, 
  AlertTriangle, 
  Maximize2, 
  Crosshair, 
  Sparkles, 
  Download, 
  Eye, 
  EyeOff,
  Compass,
  FileSpreadsheet,
  Globe,
  Flag,
  MapPin,
  Waves,
  Building2,
  Navigation,
  Satellite,
  BookOpen
} from 'lucide-react';
import { 
  HeatAnomaly, 
  MiningCluster, 
  HydrologicalStation, 
  ProtectedArea, 
  IncidentReport,
  VisibleLayersState,
  BaseLayerType,
  ScientificArticle,
  ZoneAnalyticsResult
} from '../types';
import { GeospatialLayerToolbar } from './GeospatialLayerToolbar';
import { ZoneAnalyticsModal } from './ZoneAnalyticsModal';
import { MOCK_ORINOCO_BASIN_GEOJSON } from '../data/mockGeoJSON';
import { VENEZUELA_FULL_BOUNDARY_GEOJSON, VENEZUELA_STRATEGIC_LANDMARKS } from '../data/venezuelaGeoJSON';
import { 
  VENEZUELA_STATES_GEOJSON, 
  VENEZUELA_MUNICIPALITIES_GEOJSON, 
  VENEZUELA_NAMED_RIVERS_GEOJSON, 
  VENEZUELA_STRATEGIC_SECTORS 
} from '../data/venezuelaTerritorialData';
import { SupabaseRpcService } from '../lib/supabaseClient';

interface TacticalMapProps {
  heatAnomalies: HeatAnomaly[];
  miningClusters: MiningCluster[];
  hydrologicalStations: HydrologicalStation[];
  protectedAreas: ProtectedArea[];
  incidents: IncidentReport[];
  scientificArticles?: ScientificArticle[];
  mapFocusCoords?: {
    lat: number;
    lng: number;
    zoom?: number;
    selectFeature?: {
      type: 'scientific';
      data: any;
    };
  } | null;
  onClearMapFocus?: () => void;
  onTriggerAiAnalysis: (context: {
    zoneName: string;
    coordinates: any;
    thermalAnomalies: any;
    miningAlerts: any;
    waterQuality?: any;
    protectedAreaOverlap?: string;
  }) => void;
  onOpenNewIncident: (coords?: { lat: number; lng: number }) => void;
  onOpenAiDrawer?: () => void;
  onOpenSatelliteApis?: () => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  heatAnomalies,
  miningClusters,
  hydrologicalStations,
  protectedAreas,
  incidents,
  scientificArticles = [],
  mapFocusCoords = null,
  onClearMapFocus,
  onTriggerAiAnalysis,
  onOpenNewIncident,
  onOpenAiDrawer,
  onOpenSatelliteApis,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(6);

  const layerGroupsRef = useRef<{
    venezuela?: L.LayerGroup;
    states?: L.LayerGroup;
    municipalities?: L.LayerGroup;
    rivers?: L.LayerGroup;
    sectors?: L.LayerGroup;
    basin?: L.GeoJSON;
    heat?: L.LayerGroup;
    mining?: L.LayerGroup;
    hydro?: L.LayerGroup;
    protected?: L.LayerGroup;
    incidents?: L.LayerGroup;
    sentinelS2?: L.LayerGroup;
    scientific?: L.LayerGroup;
    amazonasBolivarDelta?: L.LayerGroup;
    selectionHighlight?: L.LayerGroup;
  }>({});

  // Base tile layers
  const baseTileLayersRef = useRef<{
    dark?: L.TileLayer;
    satellite?: L.TileLayer;
    topo?: L.TileLayer;
  }>({});

  // Active state
  const [activeBaseLayer, setActiveBaseLayer] = useState<BaseLayerType>('satellite');
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayersState>({
    venezuela: true,
    states: false,
    municipalities: true,
    rivers: true,
    sectors: true,
    basin: false,
    protected: true,
    mining: true,
    heat: true,
    hydro: true,
    incidents: true,
    sentinelS2: true,
    scientific: true,
    amazonasBolivarDelta: true,
  });

  const [officialGisData, setOfficialGisData] = useState<any>(null);
  const [loadingOfficialGis, setLoadingOfficialGis] = useState<boolean>(false);

  const handleToggleLayer = (layerKey: keyof VisibleLayersState) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const [selectedFeature, setSelectedFeature] = useState<{
    type: 'heat' | 'mining' | 'hydro' | 'protected' | 'incident' | 'sentinelS2' | 'scientific';
    data: any;
    latlng?: [number, number];
  } | null>(null);

  const [popupScreenPos, setPopupScreenPos] = useState<{
    x: number;
    y: number;
    placement: 'right' | 'left' | 'bottom' | 'top';
  } | null>(null);

  // Helper to extract geographical coordinates from any feature type
  const getFeatureLatLng = (feature: { type: string; data: any; latlng?: [number, number] } | null): [number, number] | null => {
    if (!feature) return null;
    if (feature.latlng && typeof feature.latlng[0] === 'number' && typeof feature.latlng[1] === 'number' && !isNaN(feature.latlng[0]) && !isNaN(feature.latlng[1])) {
      return feature.latlng;
    }
    const d = feature.data;
    if (!d) return null;
    if (typeof d.latitude === 'number' && typeof d.longitude === 'number' && !isNaN(d.latitude) && !isNaN(d.longitude)) {
      return [d.latitude, d.longitude];
    }
    if (typeof d.lat === 'number' && typeof d.lng === 'number' && !isNaN(d.lat) && !isNaN(d.lng)) {
      return [d.lat, d.lng];
    }
    if (Array.isArray(d.center) && d.center.length >= 2 && typeof d.center[0] === 'number' && typeof d.center[1] === 'number' && !isNaN(d.center[0]) && !isNaN(d.center[1])) {
      return [d.center[0], d.center[1]];
    }
    if (Array.isArray(d.coordinates) && d.coordinates.length >= 2) {
      if (typeof d.coordinates[0] === 'number' && typeof d.coordinates[1] === 'number' && !isNaN(d.coordinates[0]) && !isNaN(d.coordinates[1])) {
        if (feature.type === 'hydro') {
          return [d.coordinates[1], d.coordinates[0]];
        }
        return [d.coordinates[0], d.coordinates[1]];
      }
      if (Array.isArray(d.coordinates[0])) {
        let sumLat = 0;
        let sumLng = 0;
        let validPts = 0;
        d.coordinates.forEach((pt: any) => {
          if (Array.isArray(pt) && typeof pt[0] === 'number' && typeof pt[1] === 'number' && !isNaN(pt[0]) && !isNaN(pt[1])) {
            sumLng += pt[0];
            sumLat += pt[1];
            validPts++;
          }
        });
        if (validPts > 0) {
          return [sumLat / validPts, sumLng / validPts];
        }
      }
    }
    return null;
  };

  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);

  // Zone Predictive & Perceptive Analytics state
  const [hasClickedAnalyze, setHasClickedAnalyze] = useState<boolean>(false);
  const [isZoneAnalyticsModalOpen, setIsZoneAnalyticsModalOpen] = useState<boolean>(false);
  const [zoneAnalyticsResult, setZoneAnalyticsResult] = useState<ZoneAnalyticsResult | null>(null);
  const [isZoneAnalyticsLoading, setIsZoneAnalyticsLoading] = useState<boolean>(false);

  const handleExecuteZonePredictiveAnalytics = async (contextPayload: any) => {
    setHasClickedAnalyze(true);
    setIsZoneAnalyticsLoading(true);
    setIsZoneAnalyticsModalOpen(true);

    try {
      const response = await fetch('/api/ai/zone-predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ZoneAnalyticsResult = await response.json();
      setZoneAnalyticsResult(data);
    } catch (err: any) {
      console.warn('Error al invocar analítica predictiva de zona, intentando ruta alternativa:', err);
      try {
        const fallbackRes = await fetch('/api/ai/analyze-zone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contextPayload),
        });
        const fallbackData = await fallbackRes.json();
        setZoneAnalyticsResult(fallbackData);
      } catch (err2) {
        console.error('Fallo total de analítica:', err2);
      }
    } finally {
      setIsZoneAnalyticsLoading(false);
    }
  };

  // Close the popup/panel when losing focus (clicking/touching outside)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!selectedFeature) return;
      const target = event.target as HTMLElement;
      
      // If the user clicks inside the active panel or modal, ignore
      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }
      if (target.closest('#analitica-de-la-zona-modal-overlay')) {
        return;
      }
      
      // If the user clicks map markers, tools or AI trigger, ignore so they can click other items
      if (
        target.closest('.custom-mining-icon') ||
        target.closest('.custom-heat-icon') ||
        target.closest('.custom-hydro-icon') ||
        target.closest('.custom-incident-icon') ||
        target.closest('.custom-sentinels2-icon') ||
        target.closest('.custom-scientific-icon') ||
        target.closest('.leaflet-marker-icon') ||
        target.closest('.leaflet-interactive') ||
        target.closest('#btn-ai-analyze-feature') ||
        target.closest('#analitica-de-la-zona')
      ) {
        return;
      }

      // Lose focus: dismiss selected panel
      setSelectedFeature(null);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [selectedFeature]);

  // Dynamic calculation of popup position near the clicked zone/icon
  useEffect(() => {
    if (!selectedFeature || !mapInstanceRef.current) {
      setPopupScreenPos(null);
      return;
    }

    const map = mapInstanceRef.current;
    const coords = getFeatureLatLng(selectedFeature);
    if (!coords || typeof coords[0] !== 'number' || typeof coords[1] !== 'number' || isNaN(coords[0]) || isNaN(coords[1])) {
      setPopupScreenPos(null);
      return;
    }

    // Auto-pan if the marker is too close to the borders of the viewport
    if (mapContainerRef.current) {
      try {
        const containerRect = mapContainerRef.current.getBoundingClientRect();
        const pt = map.latLngToContainerPoint(L.latLng(coords[0], coords[1]));
        if (
          pt.x < 120 ||
          pt.x > containerRect.width - 120 ||
          pt.y < 90 ||
          pt.y > containerRect.height - 90
        ) {
          map.panTo(L.latLng(coords[0], coords[1]), { animate: true, duration: 0.35 });
        }
      } catch (e) {
        // Map transform error guard
      }
    }

    const updatePosition = () => {
      if (!map || !mapContainerRef.current) return;
      try {
        const container = mapContainerRef.current;
        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const currentCoords = getFeatureLatLng(selectedFeature);
        if (!currentCoords || typeof currentCoords[0] !== 'number' || typeof currentCoords[1] !== 'number' || isNaN(currentCoords[0]) || isNaN(currentCoords[1])) return;

        const pt = map.latLngToContainerPoint(L.latLng(currentCoords[0], currentCoords[1]));
        const cardWidth = Math.min(384, rect.width - 24);
        const cardEstimatedHeight = 440;

        // Mobile fallback: position nicely docked at bottom of map view
        if (rect.width < 640) {
          setPopupScreenPos({
            x: Math.max(12, (rect.width - cardWidth) / 2),
            y: Math.max(12, rect.height - Math.min(cardEstimatedHeight, rect.height - 24) - 12),
            placement: 'bottom',
          });
          return;
        }

        let x = pt.x;
        let placement: 'right' | 'left' | 'bottom' | 'top' = 'right';

        // Check horizontal clearance
        if (pt.x + 24 + cardWidth <= rect.width - 16) {
          x = pt.x + 24;
          placement = 'right';
        } else if (pt.x - 24 - cardWidth >= 16) {
          x = pt.x - cardWidth - 24;
          placement = 'left';
        } else {
          x = Math.max(16, Math.min(rect.width - cardWidth - 16, pt.x - cardWidth / 2));
          placement = 'bottom';
        }

        // Vertical positioning: vertically align with clicked point, clamped strictly within map container
        let y = pt.y - 70;
        y = Math.max(12, Math.min(rect.height - cardEstimatedHeight - 12, y));

        setPopupScreenPos({
          x,
          y,
          placement,
        });
      } catch (err) {
        // Map instance might be transitioning
      }
    };

    updatePosition();

    map.on('move', updatePosition);
    map.on('zoom', updatePosition);
    map.on('viewreset', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
      map.off('viewreset', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [selectedFeature]);

  // Tactical beacon highlighting for the clicked zone
  useEffect(() => {
    const selGroup = layerGroupsRef.current?.selectionHighlight;
    if (!selGroup) return;
    selGroup.clearLayers();

    if (!selectedFeature) return;

    const coords = getFeatureLatLng(selectedFeature);
    if (!coords || typeof coords[0] !== 'number' || typeof coords[1] !== 'number' || isNaN(coords[0]) || isNaN(coords[1])) return;

    // Glowing target marker
    const outerPulse = L.circleMarker([coords[0], coords[1]], {
      radius: 22,
      color: '#38bdf8',
      weight: 2,
      fillColor: '#0284c7',
      fillOpacity: 0.18,
      dashArray: '4, 4',
    });

    const innerCenter = L.circleMarker([coords[0], coords[1]], {
      radius: 4.5,
      color: '#ffffff',
      weight: 1.5,
      fillColor: '#38bdf8',
      fillOpacity: 0.95,
    });

    selGroup.addLayer(outerPulse);
    selGroup.addLayer(innerCenter);
  }, [selectedFeature]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on Venezuela and the Orinoco Basin
    const map = L.map(mapContainerRef.current, {
      center: [6.5, -64.8],
      zoom: 6,
      minZoom: 4,
      maxZoom: 17,
      zoomControl: false,
    });

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Tile providers: High-performance, 100% Free & No API Key Required
    const satelliteTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and GIS User Community',
        maxZoom: 18,
      }
    );

    // Esri Dark Gray Canvas - Military Tactical Dark GIS, No API Key, No Watermarks
    const darkTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
        maxZoom: 16,
      }
    );

    const topoTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN',
        maxZoom: 17,
      }
    );

    baseTileLayersRef.current = {
      satellite: satelliteTile,
      dark: darkTile,
      topo: topoTile,
    };

    // Default layer: Satellite
    satelliteTile.addTo(map);

    // Initialize layer groups
    layerGroupsRef.current = {
      venezuela: L.layerGroup().addTo(map),
      states: L.layerGroup().addTo(map),
      municipalities: L.layerGroup().addTo(map),
      rivers: L.layerGroup().addTo(map),
      sectors: L.layerGroup().addTo(map),
      heat: L.layerGroup().addTo(map),
      mining: L.layerGroup().addTo(map),
      hydro: L.layerGroup().addTo(map),
      protected: L.layerGroup().addTo(map),
      incidents: L.layerGroup().addTo(map),
      sentinelS2: L.layerGroup().addTo(map),
      scientific: L.layerGroup().addTo(map),
      amazonasBolivarDelta: L.layerGroup().addTo(map),
      selectionHighlight: L.layerGroup().addTo(map),
    };

    // Add Basin boundary GeoJSON (Accurate Hydrological Boundary - Zero Fill)
    const basinLayer = L.geoJSON(MOCK_ORINOCO_BASIN_GEOJSON as any, {
      style: {
        color: '#0284c7',
        weight: 2.2,
        dashArray: '5, 5',
        fill: false,
        fillOpacity: 0,
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(
          `<b>💧 ${feature.properties.name}</b><br/><span style="font-size: 11px;">Área: ${feature.properties.areaKm2.toLocaleString()} km² • Descarga: ${feature.properties.averageDischargeM3s.toLocaleString()} m³/s</span><br/><span style="font-size: 10px; color: #7dd3fc;">Venezuela (65%) | Colombia (35%)</span>`,
          { sticky: true, className: 'tactical-tooltip' }
        );
      }
    }).addTo(map);
    layerGroupsRef.current.basin = basinLayer;

    // Track zoom level changes for dynamic territorial labeling
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Handle map click for selection mode or recording incidents
    map.on('click', (e: L.LeafletMouseEvent) => {
      setSelectedCoordinates([e.latlng.lat, e.latlng.lng]);
    });

    mapInstanceRef.current = map;

    // ResizeObserver to prevent layout glitch inside containers
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle external focus triggers (e.g. from Scientific Corpus Page "Ver en mapa")
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapFocusCoords) return;

    // Guard against invalid coordinates to prevent Leaflet LatLng crash
    if (
      typeof mapFocusCoords.lat !== 'number' ||
      typeof mapFocusCoords.lng !== 'number' ||
      isNaN(mapFocusCoords.lat) ||
      isNaN(mapFocusCoords.lng)
    ) {
      if (onClearMapFocus) onClearMapFocus();
      return;
    }

    // 1. Force the scientific layer to be visible so sites are visible on the map
    if (!visibleLayers.scientific) {
      setVisibleLayers(prev => ({ ...prev, scientific: true }));
    }

    // 2. Center/Fly map to location
    map.flyTo([mapFocusCoords.lat, mapFocusCoords.lng], mapFocusCoords.zoom || 9, { duration: 1.2 });

    // 3. Auto-select/highlight the feature to open the inspection drawer
    if (mapFocusCoords.selectFeature) {
      setSelectedFeature(mapFocusCoords.selectFeature);
    }

    // 4. Clear the trigger in parent state so it doesn't loop
    if (onClearMapFocus) {
      onClearMapFocus();
    }
  }, [mapFocusCoords, onClearMapFocus, visibleLayers.scientific]);

  // Update Base Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(baseTileLayersRef.current).forEach((layer) => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    const targetLayer = baseTileLayersRef.current[activeBaseLayer];
    if (targetLayer) {
      targetLayer.addTo(map);
    }
  }, [activeBaseLayer]);

  // Render Venezuela Sovereignty and Border Landmarks (Beacons) - No badly drawn partial silhouette lines
  useEffect(() => {
    const group = layerGroupsRef.current.venezuela;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.venezuela) return;

    // Add Sovereignty and Border Landmarks (White Beacon Nodes)
    VENEZUELA_STRATEGIC_LANDMARKS.forEach((landmark) => {
      const landmarkIcon = L.divIcon({
        className: 'custom-sovereignty-icon',
        html: `
          <div class="relative flex items-center justify-center w-5 h-5">
            <span class="absolute w-5 h-5 rounded-full bg-white/40 animate-ping"></span>
            <div class="w-3 h-3 rounded-full bg-white border border-slate-950 shadow-[0_0_10px_rgba(255,255,255,1)] flex items-center justify-center">
              <div class="w-1 h-1 rounded-full bg-sky-600"></div>
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([landmark.lat, landmark.lng], { icon: landmarkIcon });
      marker.bindTooltip(
        `<b>Unidad de Soberanía: ${landmark.name}</b><br/><span style="font-size: 10px; font-family: monospace; color: #7dd3fc;">[${landmark.lat.toFixed(3)}°N, ${landmark.lng.toFixed(3)}°W]</span>`,
        { direction: 'top', className: 'tactical-tooltip' }
      );
      group.addLayer(marker);
    });
  }, [visibleLayers.venezuela]);

  // Render State Internal Boundaries (High-Precision Tenuous White Lines)
  useEffect(() => {
    const group = layerGroupsRef.current.states;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.states) return;

    const sourceData = officialGisData || VENEZUELA_STATES_GEOJSON;

    // Calculate dynamic weight and opacity based on zoom level to ensure high-visibility and crispness
    const dynamicWeight = Math.max(2.0, Math.min(3.2, 2.0 + (currentZoom - 5) * 0.25));
    const dynamicOpacity = Math.max(0.80, Math.min(0.95, 0.80 + (currentZoom - 5) * 0.03));

    // High-contrast black halo backing line to ensure white borders stand out vividly over any map base
    const stateShadowLayer = L.geoJSON(sourceData as any, {
      style: {
        color: '#000000',
        weight: dynamicWeight + 1.8,
        opacity: 0.45,
        fill: false,
        fillOpacity: 0,
      },
      interactive: false,
    });
    group.addLayer(stateShadowLayer);

    // Highly visible, crisp solid white boundary line (continuous)
    const statesLayer = L.geoJSON(sourceData as any, {
      style: {
        color: '#ffffff',
        weight: dynamicWeight,
        opacity: dynamicOpacity,
        fill: false,
        fillOpacity: 0,
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties?.shapeName || feature.properties?.nombre || 'Estado';
        layer.bindTooltip(
          `<b>Estado ${name}</b><br/><span style="font-size: 10px; color: #cbd5e1;">Límite Político-Territorial Oficial</span>`,
          { sticky: true, className: 'tactical-tooltip' }
        );
      }
    });
    group.addLayer(statesLayer);

    // State Labels rendered dynamically at appropriate zoom levels (zoom >= 5)
    if (currentZoom >= 5 && currentZoom <= 10) {
      const STATE_CENTROIDS: Record<string, [number, number]> = {
        'Amazonas': [3.10, -65.80],
        'Bolívar': [6.30, -63.40],
        'Delta Amacuro': [8.70, -61.20],
        'Anzoátegui': [9.00, -64.40],
        'Monagas': [9.50, -63.15],
        'Apure': [7.10, -68.80],
        'Guárico': [8.90, -66.40],
        'Sucre': [10.40, -63.20],
        'Guayana Esequiba': [5.20, -59.35],
      };

      sourceData.features.forEach((state: any) => {
        const name = state.properties?.shapeName || state.properties?.nombre;
        const coords = (name && STATE_CENTROIDS[name]) || state.properties?.centroid;
        if (!coords || typeof coords[0] !== 'number' || typeof coords[1] !== 'number' || isNaN(coords[0]) || isNaN(coords[1])) return;

        const isEsequiba = name && name.toLowerCase().includes('esequib');
        const labelIcon = L.divIcon({
          className: 'state-map-label',
          html: `<span>${isEsequiba ? 'Guayana Esequiba' : name}</span>`,
          iconSize: isEsequiba ? [160, 22] : [120, 20],
          iconAnchor: isEsequiba ? [80, 11] : [60, 10],
        });

        const labelMarker = L.marker([coords[0], coords[1]], { 
          icon: labelIcon, 
          interactive: false,
          zIndexOffset: 100 
        });
        group.addLayer(labelMarker);
      });
    }
  }, [visibleLayers.states, currentZoom, officialGisData]);

  // Load official GeoJSON table immediately on mount or when boundary layers are requested
  useEffect(() => {
    if (!officialGisData && !loadingOfficialGis) {
      setLoadingOfficialGis(true);

      // Primary source: /venezuela_estados.geojson (full 26 official states GeoJSON table including Guayana Esequiba)
      fetch('/venezuela_estados.geojson')
        .then((res) => {
          if (!res.ok) throw new Error('Local GeoJSON fallback');
          return res.json();
        })
        .then((data) => {
          setOfficialGisData(data);
          setLoadingOfficialGis(false);
          console.log('[Centinela GIS] Tabla GeoJSON de límites de Venezuela cargada con éxito:', data.features?.length, 'estados');
        })
        .catch((err) => {
          console.warn('[Centinela GIS] Fallo local, consultando API /api/limites:', err);
          fetch('/api/limites')
            .then((r) => r.json())
            .then((data) => {
              setOfficialGisData(data);
              setLoadingOfficialGis(false);
            })
            .catch((apiErr) => {
              console.warn('[Centinela GIS] Usando respaldo territorial:', apiErr);
              setOfficialGisData(VENEZUELA_STATES_GEOJSON);
              setLoadingOfficialGis(false);
            });
        });
    }
  }, [officialGisData, loadingOfficialGis]);

  // Render authentic state borders and internal delimitation lines from GeoJSON table
  useEffect(() => {
    const group = layerGroupsRef.current.amazonasBolivarDelta;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.amazonasBolivarDelta) return;

    // Use fetched official high-precision dataset if available, otherwise fallback to local dataset
    const sourceData = officialGisData || VENEZUELA_STATES_GEOJSON;

    // Draw authentic boundary lines from the GeoJSON table
    const backingLayer = L.geoJSON(sourceData as any, {
      style: {
        color: '#000000',
        weight: 3.5,
        opacity: 0.40,
        fill: false,
        fillOpacity: 0,
        className: 'non-scaling-stroke'
      },
      interactive: false,
    });
    group.addLayer(backingLayer);

    // Highly visible, crisp solid white boundary line (static weight of 1.5px, 100% opacity, non-scaling-stroke)
    const boundariesLayer = L.geoJSON(sourceData as any, {
      style: {
        color: '#ffffff',
        weight: 1.5,
        opacity: 1.0,
        fill: false,
        fillOpacity: 0,
        className: 'non-scaling-stroke'
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties?.shapeName || feature.properties?.nombre || feature.properties?.NAME_1 || 'Estado';
        const isEsequiba = name.toLowerCase().includes('esequib');
        layer.bindTooltip(
          `<b>${isEsequiba ? 'Estado Guayana Esequiba' : `Estado: ${name}`}</b><br/><span style="font-size: 10px; color: #cbd5e1;">${isEsequiba ? 'Límite Histórico Soberano (Acuerdo de Ginebra de 1966)' : 'Límite Geodésico Oficial (Fronteras Internas)'}</span>`,
          { sticky: true, className: 'tactical-tooltip' }
        );
      }
    });
    group.addLayer(boundariesLayer);

    // State Name Labels directly on the map matching the design reference
    const STATE_CENTROIDS: Record<string, [number, number]> = {
      'Amazonas': [3.10, -65.80],
      'Bolívar': [6.30, -63.40],
      'Delta Amacuro': [8.70, -61.20],
      'Anzoátegui': [9.00, -64.40],
      'Monagas': [9.50, -63.15],
      'Apure': [7.10, -68.80],
      'Guárico': [8.90, -66.40],
      'Sucre': [10.40, -63.20],
      'Guayana Esequiba': [5.20, -59.35]
    };

    // Render labels for the regional states and any state with defined coordinates
    Object.entries(STATE_CENTROIDS).forEach(([stateName, coords]) => {
      const isEsequiba = stateName.toLowerCase().includes('esequib');
      const labelIcon = L.divIcon({
        className: 'state-map-label',
        html: `<span>${stateName}</span>`,
        iconSize: isEsequiba ? [160, 24] : [140, 24],
        iconAnchor: isEsequiba ? [80, 12] : [70, 12]
      });

      const marker = L.marker(coords, {
        icon: labelIcon,
        interactive: false,
        zIndexOffset: 300
      });
      group.addLayer(marker);
    });
  }, [visibleLayers.amazonasBolivarDelta, officialGisData]);

  // Render Municipality Boundaries and Labels (zoom >= 7)
  useEffect(() => {
    const group = layerGroupsRef.current.municipalities;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.municipalities) return;

    // Municipal boundaries render when zoom >= 7 for high clarity
    if (currentZoom >= 7) {
      const muniLayer = L.geoJSON(VENEZUELA_MUNICIPALITIES_GEOJSON as any, {
        style: {
          color: '#cbd5e1',
          weight: 0.9,
          opacity: 0.4,
          dashArray: '2, 3',
          fillOpacity: 0,
        },
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(
            `<b>Municipio ${feature.properties.shapeName}</b><br/><span style="font-size: 10px; color: #94a3b8;">Jurisdicción Municipal ADM2</span>`,
            { sticky: true, className: 'tactical-tooltip' }
          );
        }
      });
      group.addLayer(muniLayer);

      // Municipality name tags rendered at closer zoom (zoom >= 8)
      if (currentZoom >= 8) {
        VENEZUELA_MUNICIPALITIES_GEOJSON.features.forEach((muni) => {
          const centroid = muni.properties.centroid;
          if (!centroid || typeof centroid[0] !== 'number' || typeof centroid[1] !== 'number' || isNaN(centroid[0]) || isNaN(centroid[1])) return;

          const labelIcon = L.divIcon({
            className: 'muni-map-label',
            html: `<span>${muni.properties.shapeName}</span>`,
            iconSize: [100, 16],
            iconAnchor: [50, 8],
          });

          const labelMarker = L.marker([centroid[0], centroid[1]], {
            icon: labelIcon,
            interactive: false,
            zIndexOffset: 50,
          });
          group.addLayer(labelMarker);
        });
      }
    }
  }, [visibleLayers.municipalities, currentZoom]);

  // Render Named River Networks & Fluvial Labels
  useEffect(() => {
    const group = layerGroupsRef.current.rivers;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.rivers) return;

    // Draw main river centerlines
    const riversLayer = L.geoJSON(VENEZUELA_NAMED_RIVERS_GEOJSON as any, {
      style: (feature) => {
        const isMain = feature?.properties?.name === 'Río Orinoco';
        return {
          color: '#38bdf8',
          weight: isMain ? 3.5 : 2.2,
          opacity: 0.85,
        };
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(
          `<b>🌊 ${feature.properties.name}</b><br/><span style="font-size: 11px; color: #bae6fd;">Longitud: ${feature.properties.lengthKm} km</span><br/><span style="font-size: 10px; color: #94a3b8;">${feature.properties.description}</span>`,
          { sticky: true, className: 'tactical-tooltip' }
        );
      }
    });
    group.addLayer(riversLayer);

    // River name labels at midpoint of each river path (zoom >= 6)
    if (currentZoom >= 6) {
      VENEZUELA_NAMED_RIVERS_GEOJSON.features.forEach((river) => {
        const coords = river.geometry.coordinates;
        if (!coords || coords.length === 0) return;
        const midIdx = Math.floor(coords.length / 2);
        const midPt = coords[midIdx]; // [lng, lat]
        if (!midPt || typeof midPt[0] !== 'number' || typeof midPt[1] !== 'number' || isNaN(midPt[0]) || isNaN(midPt[1])) return;

        const labelIcon = L.divIcon({
          className: 'river-map-label',
          html: `<span><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>${river.properties.name}</span>`,
          iconSize: [120, 20],
          iconAnchor: [60, 10],
        });

        const labelMarker = L.marker([midPt[1], midPt[0]], {
          icon: labelIcon,
          interactive: false,
          zIndexOffset: 120,
        });
        group.addLayer(labelMarker);
      });
    }
  }, [visibleLayers.rivers, currentZoom]);

  // Render Strategic Sectors & Poblados (zoom >= 7)
  useEffect(() => {
    const group = layerGroupsRef.current.sectors;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.sectors) return;

    if (currentZoom >= 7) {
      VENEZUELA_STRATEGIC_SECTORS.forEach((sec) => {
        if (typeof sec.lat !== 'number' || typeof sec.lng !== 'number' || isNaN(sec.lat) || isNaN(sec.lng)) return;
        const sectorIcon = L.divIcon({
          className: 'sector-map-label',
          html: `<span><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${sec.name}</span>`,
          iconSize: [130, 20],
          iconAnchor: [65, 10],
        });

        const marker = L.marker([sec.lat, sec.lng], { icon: sectorIcon, zIndexOffset: 90 });
        marker.bindTooltip(
          `<b>📍 ${sec.name}</b><br/>Estado: ${sec.state}<br/>Municipio: ${sec.municipality}<br/><span style="font-size: 10px; color: #94a3b8;">${sec.strategicImportance}</span>`,
          { direction: 'top', className: 'tactical-tooltip' }
        );
        group.addLayer(marker);
      });
    }
  }, [visibleLayers.sectors, currentZoom]);

  // Render Basin Boundary
  useEffect(() => {
    const basin = layerGroupsRef.current.basin;
    const map = mapInstanceRef.current;
    if (!basin || !map) return;

    if (visibleLayers.basin) {
      if (!map.hasLayer(basin)) {
        basin.addTo(map);
      }
    } else {
      if (map.hasLayer(basin)) {
        map.removeLayer(basin);
      }
    }
  }, [visibleLayers.basin]);

  // Render Protected Areas
  useEffect(() => {
    const group = layerGroupsRef.current.protected;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.protected) return;

    protectedAreas.forEach((area) => {
      const latlngs = (area.coordinates || [])
        .filter((c) => Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number' && !isNaN(c[0]) && !isNaN(c[1]))
        .map((c) => [c[1], c[0]] as [number, number]);
      if (latlngs.length < 3) return;

      const polygon = L.polygon(latlngs, {
        color: area.color,
        weight: 2,
        fillColor: area.color,
        fillOpacity: 0.18,
      });

      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature({ type: 'protected', data: area, latlng: [e.latlng.lat, e.latlng.lng] });
        setSelectedCoordinates([e.latlng.lat, e.latlng.lng]);
      });

      polygon.bindTooltip(`<b>${area.name}</b><br/><span style="font-size: 11px;">${area.category} • Riesgo: ${area.threatIndex}%</span>`, {
        sticky: true,
        className: 'tactical-tooltip',
      });

      group.addLayer(polygon);
    });
  }, [protectedAreas, visibleLayers.protected]);

  // Render Mining Clusters
  useEffect(() => {
    const group = layerGroupsRef.current.mining;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.mining) return;

    miningClusters.forEach((cluster) => {
      if (typeof cluster.latitude !== 'number' || typeof cluster.longitude !== 'number' || isNaN(cluster.latitude) || isNaN(cluster.longitude)) return;
      const isCritical = cluster.severity === 'CRITICAL';
      
      const customIcon = L.divIcon({
        className: 'custom-mining-icon',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <span class="absolute w-7 h-7 rounded-full ${isCritical ? 'bg-red-600/50 pulse-critical' : 'bg-amber-600/50'}"></span>
            <div class="w-5 h-5 rounded-full bg-slate-900 border-2 ${isCritical ? 'border-red-500 text-red-400' : 'border-amber-500 text-amber-400'} flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"/><path d="M15 13 9 7l4-4 6 6-4 4Z"/><path d="m21.5 2.5-1.9 1.9"/></svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([cluster.latitude, cluster.longitude], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature({ type: 'mining', data: cluster, latlng: [cluster.latitude, cluster.longitude] });
        setSelectedCoordinates([cluster.latitude, cluster.longitude]);
      });

      marker.bindTooltip(`<b>${cluster.name}</b><br/>⛏️ ${cluster.estimatedHectares} ha • ${cluster.dredgeCountEstimate} dragas`, {
        direction: 'top',
        className: 'tactical-tooltip',
      });

      group.addLayer(marker);
    });
  }, [miningClusters, visibleLayers.mining]);

  // Render Heat Anomalies (VIIRS/MODIS)
  useEffect(() => {
    const group = layerGroupsRef.current.heat;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.heat) return;

    heatAnomalies.forEach((heat) => {
      if (typeof heat.latitude !== 'number' || typeof heat.longitude !== 'number' || isNaN(heat.latitude) || isNaN(heat.longitude)) return;
      const isHigh = heat.confidence === 'high' || heat.brightnessTempK > 345;
      
      const customIcon = L.divIcon({
        className: 'custom-heat-icon',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <span class="absolute w-6 h-6 rounded-full bg-amber-500/40 pulse-thermal"></span>
            <div class="w-4 h-4 rounded-full bg-amber-600 border border-amber-300 text-white flex items-center justify-center shadow-md">
              <span style="font-size: 9px; font-weight: bold;">🔥</span>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([heat.latitude, heat.longitude], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature({ type: 'heat', data: heat, latlng: [heat.latitude, heat.longitude] });
        setSelectedCoordinates([heat.latitude, heat.longitude]);
      });

      marker.bindTooltip(`<b>Foco Térmico ${heat.satellite}</b><br/>Temp: ${heat.brightnessTempK} K • FRP: ${heat.frpMw} MW`, {
        direction: 'top',
        className: 'tactical-tooltip',
      });

      group.addLayer(marker);
    });
  }, [heatAnomalies, visibleLayers.heat]);

  // Render Hydrological Stations
  useEffect(() => {
    const group = layerGroupsRef.current.hydro;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.hydro) return;

    hydrologicalStations.forEach((station) => {
      if (!Array.isArray(station.coordinates) || typeof station.coordinates[0] !== 'number' || typeof station.coordinates[1] !== 'number' || isNaN(station.coordinates[0]) || isNaN(station.coordinates[1])) return;
      const isAlert = station.status === 'ALERT_CRECIDA' || station.status === 'ELEVATED';
      
      const customIcon = L.divIcon({
        className: 'custom-hydro-icon',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <div class="w-5 h-5 rounded-full ${isAlert ? 'bg-sky-500 border-2 border-amber-400 text-white' : 'bg-slate-900 border-2 border-sky-400 text-sky-300'} flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([station.coordinates[1], station.coordinates[0]], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature({ type: 'hydro', data: station, latlng: [station.coordinates[1], station.coordinates[0]] });
        setSelectedCoordinates([station.coordinates[1], station.coordinates[0]]);
      });

      marker.bindTooltip(`<b>${station.name}</b><br/>Nivel: ${station.currentLevelM}m (Alerta: ${station.alertLevelM}m)<br/>Turbidez: ${station.turbidityNtu} NTU`, {
        direction: 'top',
        className: 'tactical-tooltip',
      });

      group.addLayer(marker);
    });
  }, [hydrologicalStations, visibleLayers.hydro]);

  // Render Scientific Investigation Sites (Corpus)
  useEffect(() => {
    const group = layerGroupsRef.current.scientific;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.scientific) return;

    scientificArticles.forEach((article) => {
      if (!article.investigationSites) return;

      article.investigationSites.forEach((site) => {
        if (typeof site.latitude !== 'number' || typeof site.longitude !== 'number' || isNaN(site.latitude) || isNaN(site.longitude)) return;
        // Cadaster icons representing the land plot/scientific findings
        const customIcon = L.divIcon({
          className: 'custom-scientific-icon',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8">
              <span class="absolute w-8 h-8 rounded-lg bg-teal-500/25 pulse-scientific border border-teal-400/40"></span>
              <div class="w-6 h-6 rounded bg-slate-950 border border-teal-400 text-teal-300 flex items-center justify-center shadow-md text-xs font-mono font-bold">
                ⛯
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([site.latitude, site.longitude], { icon: customIcon });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedFeature({
            type: 'scientific',
            data: {
              ...site,
              articleId: article.id,
              articleTitle: article.title,
              authors: article.authors,
              year: article.year,
              source: article.source,
              peerReviewed: article.peerReviewed,
              tags: article.tags,
              abstract: article.abstract
            },
            latlng: [site.latitude, site.longitude]
          });
          setSelectedCoordinates([site.latitude, site.longitude]);
        });

        marker.bindTooltip(`<b>${site.name}</b><br/>📚 ${article.title.slice(0, 45)}...<br/><span style="font-size: 10px; color: #2dd4bf;">Cadastro Científico • Georreferenciado</span>`, {
          direction: 'top',
          className: 'tactical-tooltip',
        });

        group.addLayer(marker);
      });
    });
  }, [scientificArticles, visibleLayers.scientific]);

  // Render Incidents
  useEffect(() => {
    const group = layerGroupsRef.current.incidents;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.incidents) return;

    incidents.forEach((inc) => {
      if (typeof inc.latitude !== 'number' || typeof inc.longitude !== 'number' || isNaN(inc.latitude) || isNaN(inc.longitude)) return;
      const customIcon = L.divIcon({
        className: 'custom-incident-icon',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <span class="absolute w-7 h-7 rounded-full bg-red-500/40 pulse-critical"></span>
            <div class="w-5 h-5 rounded-full bg-red-700 border-2 border-white text-white flex items-center justify-center shadow-lg font-bold text-[10px]">
              !
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature({ type: 'incident', data: inc, latlng: [inc.latitude, inc.longitude] });
        setSelectedCoordinates([inc.latitude, inc.longitude]);
      });

      marker.bindTooltip(`<b>${inc.code}: ${inc.title}</b><br/>Estado: ${inc.status}`, {
        direction: 'top',
        className: 'tactical-tooltip',
      });

      group.addLayer(marker);
    });
  }, [incidents, visibleLayers.incidents]);

  // Render Sentinel-2 Desertification & Forest Loss Detections
  useEffect(() => {
    const group = layerGroupsRef.current.sentinelS2;
    if (!group) return;
    group.clearLayers();

    if (!visibleLayers.sentinelS2) return;

    // Rich mock Sentinel-2 detections in the Venezuelan Amazon
    const s2Detections = [
      {
        id: 's2-det-yapacana',
        title: 'Variación de Desertificación Boscosa - Yapacana (S2)',
        satellite: 'Sentinel-2C (MSI)',
        date: '2026-08-30',
        sensingTime: '2026-08-30T14:15:00Z',
        cloudCover: 8.4,
        areaHa: 112.5,
        center: [3.78, -66.85] as [number, number],
        perimeter: [
          [3.79, -66.86],
          [3.80, -66.84],
          [3.77, -66.83],
          [3.76, -66.85]
        ] as [number, number][],
        analysis: 'Remoción severa del dosel forestal y sustitución por arenas expuestas y pozas de sedimentación. Alta firma de reflectancia en el infrarrojo de onda corta (SWIR), confirmando actividad de minería ilegal de aluvión sobre caños riparios en el sector norte de Yapacana.'
      },
      {
        id: 's2-det-caura',
        title: 'Variación de Desertificación Boscosa - Eje Alto Caura (S2)',
        satellite: 'Sentinel-2B',
        date: '2026-08-25',
        sensingTime: '2026-08-25T14:22:00Z',
        cloudCover: 12.1,
        areaHa: 78.2,
        center: [6.15, -64.48] as [number, number],
        perimeter: [
          [6.16, -64.49],
          [6.17, -64.46],
          [6.13, -64.46],
          [6.14, -64.49]
        ] as [number, number][],
        analysis: 'Patrón de fragmentación forestal lineal (vías de penetración) para transporte de combustible e insumos mineros. Pérdida crítica de biomasa en selva húmeda tropical perennifolia asociada a campamentos provisionales de minería de oro.'
      },
      {
        id: 's2-det-claritas',
        title: 'Variación de Desertificación Boscosa - Las Claritas / Km 88 (S2)',
        satellite: 'Sentinel-2A',
        date: '2026-08-20',
        sensingTime: '2026-08-20T14:05:00Z',
        cloudCover: 4.8,
        areaHa: 145.0,
        center: [6.92, -62.15] as [number, number],
        perimeter: [
          [6.93, -62.16],
          [6.94, -62.14],
          [6.90, -62.13],
          [6.91, -62.16]
        ] as [number, number][],
        analysis: 'Expansión descontrolada de frentes de minería a cielo abierto. Degradación total de la capa orgánica del suelo, colmatación de afluentes locales por lodos altamente turbios y acumulación de piscinas de relaves de mercurio detectadas ópticamente.'
      }
    ];

    s2Detections.forEach((det) => {
      if (!Array.isArray(det.center) || typeof det.center[0] !== 'number' || typeof det.center[1] !== 'number' || isNaN(det.center[0]) || isNaN(det.center[1])) return;
      // 1. Draw perimeter polygon
      const polygon = L.polygon(det.perimeter, {
        color: '#10b981', // emerald-500
        weight: 2.5,
        dashArray: '4, 4',
        fillColor: '#047857', // emerald-700
        fillOpacity: 0.22,
      });

      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature({ type: 'sentinelS2', data: det, latlng: [e.latlng.lat, e.latlng.lng] });
        setSelectedCoordinates([e.latlng.lat, e.latlng.lng]);
      });

      polygon.bindTooltip(`<b>${det.title}</b><br/>🌲 ${det.areaHa} ha afectadas`, {
        sticky: true,
        className: 'tactical-tooltip',
      });

      group.addLayer(polygon);

      // 2. Draw custom cartographic icon representing Sentinel-2 detection
      const customIcon = L.divIcon({
        className: 'custom-sentinels2-icon',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <span class="absolute w-7 h-7 rounded-full bg-emerald-500/30 pulse-critical"></span>
            <div class="w-5.5 h-5.5 rounded-full bg-slate-900 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="m18 18-3-3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(det.center, { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature({ type: 'sentinelS2', data: det, latlng: [det.center[0], det.center[1]] });
        setSelectedCoordinates([det.center[0], det.center[1]]);
      });

      marker.bindTooltip(`<b>Detección Sentinel-2</b><br/>${det.title}<br/>Gravedad: CRÍTICA`, {
        direction: 'top',
        className: 'tactical-tooltip',
      });

      group.addLayer(marker);
    });
  }, [visibleLayers.sentinelS2]);

  // Fly to Macrocuenca view
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([5.8, -65.2], 6, { duration: 1.2 });
    }
  };

  // Fly to Full Venezuela & Guayana Esequiba view
  const handleFocusVenezuela = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([6.5, -64.8], 6, { duration: 1.2 });
    }
  };

  // Fly to feature location
  const handleFlyTo = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 10, { duration: 1 });
    }
  };

  // Export current active view to GeoJSON file
  const handleExportGeoJSON = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        ...miningClusters.map((m) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [m.longitude, m.latitude] },
          properties: { ...m, featureClass: 'MINING_CLUSTER' },
        })),
        ...heatAnomalies.map((h) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [h.longitude, h.latitude] },
          properties: { ...h, featureClass: 'HEAT_ANOMALY' },
        })),
        ...hydrologicalStations.map((s) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.coordinates[0], s.coordinates[1]] },
          properties: { ...s, featureClass: 'HYDRO_STATION' },
        })),
        ...incidents.map((i) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [i.longitude, i.latitude] },
          properties: { ...i, featureClass: 'TACTICAL_INCIDENT' },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `centinela_orinoco_gis_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-[#070b10]">
      {/* Horizontal Geospatial Layers & Filter Toolbar (Eligible, with counts, beside actions) */}
      <GeospatialLayerToolbar
        visibleLayers={visibleLayers}
        onToggleLayer={handleToggleLayer}
        activeBaseLayer={activeBaseLayer}
        onChangeBaseLayer={setActiveBaseLayer}
        miningCount={miningClusters.length}
        heatCount={heatAnomalies.length}
        hydroCount={hydrologicalStations.length}
        protectedCount={protectedAreas.length}
        incidentsCount={incidents.length}
        scientificCount={scientificArticles.reduce((acc, curr) => acc + (curr.investigationSites?.length || 0), 0)}
        onFocusVenezuela={handleFocusVenezuela}
        onExportGeoJSON={handleExportGeoJSON}
        onOpenSatelliteApis={onOpenSatelliteApis}
      />

      {/* Map Container & Anchored Overlay Area */}
      <div className="relative w-full flex-1 overflow-hidden">
        <div 
          ref={mapContainerRef} 
          id="tactical-leaflet-map" 
          className="w-full h-full z-0 cursor-crosshair relative"
        />

        {/* Anchored Selected Feature Inspection Window (Positioned near clicked zone/icon) */}
        {selectedFeature && (
          <div 
            ref={panelRef}
            style={
              popupScreenPos
                ? {
                    left: `${popupScreenPos.x}px`,
                    top: `${popupScreenPos.y}px`,
                    width: 'min(384px, calc(100% - 24px))',
                    maxHeight: 'calc(100% - 24px)',
                  }
                : {
                    right: '16px',
                    top: '16px',
                    width: 'min(384px, calc(100% - 24px))',
                    maxHeight: 'calc(100% - 24px)',
                  }
            }
            className="absolute flex flex-col bg-[#0c1420]/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/90 text-slate-200 z-30 transition-all duration-100 ease-out overflow-hidden"
          >
            {/* Sticky Header: Never scrolls off */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-slate-950/70 shrink-0">
              <div className="flex items-center gap-2">
                {selectedFeature.type === 'mining' && <Pickaxe className="w-4 h-4 text-red-400" />}
                {selectedFeature.type === 'heat' && <Flame className="w-4 h-4 text-amber-400" />}
                {selectedFeature.type === 'hydro' && <Droplets className="w-4 h-4 text-sky-400" />}
                {selectedFeature.type === 'protected' && <Shield className="w-4 h-4 text-emerald-400" />}
                {selectedFeature.type === 'incident' && <AlertTriangle className="w-4 h-4 text-purple-400" />}
                {selectedFeature.type === 'sentinelS2' && <Satellite className="w-4 h-4 text-emerald-400" />}
                {selectedFeature.type === 'scientific' && <BookOpen className="w-4 h-4 text-teal-400" />}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  {selectedFeature.type === 'mining' && 'Cluster de Minería Ilegal'}
                  {selectedFeature.type === 'heat' && 'Anomalía Térmica Satelital'}
                  {selectedFeature.type === 'hydro' && 'Estación Hidrométrica'}
                  {selectedFeature.type === 'protected' && 'Área Protegida / ABRAE'}
                  {selectedFeature.type === 'incident' && 'Reporte de Incidente'}
                  {selectedFeature.type === 'sentinelS2' && 'Análisis Satelital Sentinel-2'}
                  {selectedFeature.type === 'scientific' && 'Registro Corpus Científico'}
                </span>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-all flex items-center justify-center"
                title="Cerrar panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Content: Shows full info cleanly without clipping */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs scrollbar-thin scrollbar-thumb-slate-700">
              {/* Target Location Indicator */}
              {(() => {
                const coords = getFeatureLatLng(selectedFeature);
                if (!coords) return null;
                return (
                  <div className="flex items-center justify-between bg-[#070b10] px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-sky-400 font-semibold">
                      <Crosshair className="w-3 h-3 text-sky-400" />
                      Ubicación Geográfica
                    </span>
                    <span className="text-slate-300">
                      {coords[0].toFixed(4)}°N, {coords[1].toFixed(4)}°W
                    </span>
                  </div>
                );
              })()}
            {/* Mining Cluster Details */}
            {selectedFeature.type === 'mining' && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedFeature.data.name}</h3>
                  <p className="text-slate-400 text-[11px]">{selectedFeature.data.basin}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#070b10] p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Impacto Est.</span>
                    <p className="text-sm font-bold text-red-400 font-mono">{selectedFeature.data.estimatedHectares} ha</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Dragas Activas</span>
                    <p className="text-sm font-bold text-amber-400 font-mono">~{selectedFeature.data.dredgeCountEstimate} balsas</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Deforestación</span>
                    <p className="text-xs font-medium text-slate-300">{selectedFeature.data.deforestationRate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Severidad</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-mono text-[10px] border border-red-800">
                      {selectedFeature.data.severity}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <p className="text-slate-300">
                    <span className="text-slate-500">Traslape ABRAE:</span> {selectedFeature.data.abraeOverlap || 'Ninguno'}
                  </p>
                  <p className="text-slate-300">
                    <span className="text-slate-500">Pueblo Indígena:</span> {selectedFeature.data.indigenousCommunityOverlap || 'Ninguno'}
                  </p>
                  <p className="text-slate-400 font-mono text-[10px]">
                    Coords: {selectedFeature.data.latitude.toFixed(4)}°N, {selectedFeature.data.longitude.toFixed(4)}°W
                  </p>
                </div>
              </>
            )}

            {/* Heat Anomaly Details */}
            {selectedFeature.type === 'heat' && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedFeature.data.id} - {selectedFeature.data.sector}</h3>
                  <p className="text-slate-400 text-[11px]">{selectedFeature.data.subBasin}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#070b10] p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Temp. Brillo</span>
                    <p className="text-sm font-bold text-amber-400 font-mono">{selectedFeature.data.brightnessTempK} K</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Potencia FRP</span>
                    <p className="text-sm font-bold text-orange-400 font-mono">{selectedFeature.data.frpMw} MW</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Satélite</span>
                    <p className="text-xs font-mono text-slate-300">{selectedFeature.data.satellite}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Confianza</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800">
                      {selectedFeature.data.confidence}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Adquisición: {selectedFeature.data.acqDate} {selectedFeature.data.acqTime} ({selectedFeature.data.dayNight === 'D' ? 'Paso Diurno' : 'Paso Nocturno'})
                </div>
              </>
            )}

            {/* Hydrological Station Details */}
            {selectedFeature.type === 'hydro' && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedFeature.data.name}</h3>
                  <p className="text-slate-400 text-[11px]">{selectedFeature.data.river}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#070b10] p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Nivel Actual</span>
                    <p className="text-sm font-bold text-sky-400 font-mono">{selectedFeature.data.currentLevelM} m</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Cota de Alerta</span>
                    <p className="text-sm font-bold text-amber-400 font-mono">{selectedFeature.data.alertLevelM} m</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Turbidez (NTU)</span>
                    <p className="text-xs font-bold text-slate-300 font-mono">{selectedFeature.data.turbidityNtu} NTU</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Mercurio Est.</span>
                    <p className="text-xs font-bold text-rose-400 font-mono">{selectedFeature.data.mercuryEstimatedPpm} ppm</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Estado de Estación:</span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-sky-950 text-sky-300 border border-sky-800">
                    {selectedFeature.data.status}
                  </span>
                </div>
              </>
            )}

            {/* Protected Area Details */}
            {selectedFeature.type === 'protected' && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedFeature.data.name}</h3>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                    {selectedFeature.data.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#070b10] p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Superficie</span>
                    <p className="text-sm font-bold text-emerald-400 font-mono">
                      {selectedFeature.data.surfaceHa.toLocaleString()} ha
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Índice Amenaza</span>
                    <p className="text-sm font-bold text-amber-400 font-mono">{selectedFeature.data.threatIndex} / 100</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300">
                  <span className="text-slate-500">Poblaciones:</span> {selectedFeature.data.ethnicGroup}
                </p>
              </>
            )}

             {/* Incident Details */}
            {selectedFeature.type === 'incident' && (
              <>
                <div>
                  <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 text-[10px] font-mono border border-red-800">
                    {selectedFeature.data.code}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">{selectedFeature.data.title}</h3>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed bg-[#070b10] p-2 rounded border border-slate-800">
                  {selectedFeature.data.description}
                </p>

                <div className="space-y-1 text-[11px]">
                  <p className="text-slate-400">Unidad asignada: <span className="text-slate-200">{selectedFeature.data.assignedUnit || 'En despacho'}</span></p>
                  <p className="text-slate-400">Reportado por: <span className="text-slate-200">{selectedFeature.data.reportedBy}</span></p>
                  <p className="text-slate-500 font-mono text-[10px]">{selectedFeature.data.timestamp}</p>
                </div>
              </>
            )}

            {/* Sentinel-2 Details */}
            {selectedFeature.type === 'sentinelS2' && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">{selectedFeature.data.title}</h3>
                  <p className="text-emerald-400 font-medium text-[11px] mt-0.5">{selectedFeature.data.satellite}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#070b10] p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Área Degradada</span>
                    <p className="text-sm font-bold text-emerald-400 font-mono">
                      {selectedFeature.data.areaHa} ha
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Cob. de Nubes</span>
                    <p className="text-sm font-bold text-amber-400 font-mono">{selectedFeature.data.cloudCover}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Patrón</span>
                    <p className="text-xs font-semibold text-rose-400">MINERÍA ILEGAL</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Gravedad</span>
                    <div>
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-mono text-[10px] border border-red-800">
                        CRÍTICA
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed bg-[#070b10] p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 font-bold font-mono text-[10px] uppercase">Análisis de Variación S2:</span><br />
                  {selectedFeature.data.analysis}
                </p>

                <div className="text-[11px] text-slate-400 font-mono">
                  Adquisición: {selectedFeature.data.date} (Sensing: UTC {selectedFeature.data.sensingTime.slice(11, 19)})
                </div>
              </>
            )}

            {/* Scientific Details */}
            {selectedFeature.type === 'scientific' && (
              <>
                <div>
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 text-[9px] font-mono border border-teal-800 uppercase font-bold">
                      📚 Corpus Científico
                    </span>
                    {selectedFeature.data.peerReviewed ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-mono border border-emerald-800 uppercase font-bold">
                        Arbitrado / Indexado
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[9px] font-mono border border-amber-800 uppercase font-bold">
                        No Arbitrado / No Indexado
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">{selectedFeature.data.name}</h3>
                  <p className="text-slate-400 text-[10px] italic mt-0.5">{selectedFeature.data.authors} ({selectedFeature.data.year})</p>
                </div>

                <div className="bg-[#070b10] p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-teal-400 font-bold uppercase font-mono">Hallazgos Clave del Estudio:</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed italic">
                    "{selectedFeature.data.findings}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#070b10] p-2 rounded-lg border border-slate-800/80 font-mono text-[10px]">
                  <div className="col-span-2">
                    <span className="text-slate-500 uppercase">Estudio:</span>
                    <p className="text-slate-200 font-bold truncate" title={selectedFeature.data.articleTitle}>{selectedFeature.data.articleTitle}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase">Cuenca Principal:</span>
                    <p className="text-slate-200 font-bold">{selectedFeature.data.primaryBasin || 'Amazonas / Bolívar'}</p>
                  </div>
                  {selectedFeature.data.heavyMetalsPpm !== undefined && (
                    <div>
                      <span className="text-slate-500 uppercase">Mercurio (Hg):</span>
                      <p className="text-rose-400 font-bold">{selectedFeature.data.heavyMetalsPpm} ppm</p>
                    </div>
                  )}
                  {selectedFeature.data.turbidityNtu !== undefined && (
                    <div>
                      <span className="text-slate-500 uppercase">Turbidez:</span>
                      <p className="text-amber-400 font-bold">{selectedFeature.data.turbidityNtu} NTU</p>
                    </div>
                  )}
                </div>
              </>
            )}

            </div>

            {/* Sticky Action Footer: always visible and accessible */}
            <div className="p-3 border-t border-slate-800/90 bg-slate-950/70 shrink-0 flex items-center gap-2">
              <button
                id="analitica-de-la-zona"
                data-testid="analitica-de-la-zona"
                name="Analítica de la Zona"
                onClick={() => {
                  const f = selectedFeature;
                  if (!f) return;
                  setHasClickedAnalyze(true);
                  
                  let coords = { lat: 5.0, lng: -65.0 };
                  let zoneName = '';
                  let overlap = '';
                  let generatingEvent: any = null;

                  if (f.type === 'mining') {
                    coords = { lat: f.data.latitude, lng: f.data.longitude };
                    zoneName = f.data.name;
                    overlap = f.data.abraeOverlap || f.data.basin;
                    const satCoords = `${coords.lat >= 0 ? coords.lat.toFixed(5) + '° N' : Math.abs(coords.lat).toFixed(5) + '° S'}, ${coords.lng >= 0 ? coords.lng.toFixed(5) + '° E' : Math.abs(coords.lng).toFixed(5) + '° W'} (Datum WGS-84 / SIRGAS-REGVEN)`;
                    generatingEvent = {
                      type: 'MINING_CLUSTER',
                      typeLabel: 'Cluster de Minería de Aluvión',
                      title: f.data.name,
                      coordinates: coords,
                      satelliteCoordinates: satCoords,
                      satelliteSensor: 'Copernicus Sentinel-1 SAR & Sentinel-2 MSI L2A',
                      severity: f.data.severity || 'CRITICAL',
                      description: `Frente minero aluvial "${f.data.name}" en cuenca ${f.data.basin}. Afectación: ${f.data.estimatedHectares} Ha, ${f.data.activeBarges || 0} balsas dragas operativas.`,
                      details: f.data,
                    };
                  } else if (f.type === 'scientific') {
                    coords = { lat: f.data.latitude, lng: f.data.longitude };
                    zoneName = f.data.name;
                    overlap = f.data.ethnicTerritory || 'Cuenca del Orinoco - Área de Investigación Científica';
                    const satCoords = `${coords.lat >= 0 ? coords.lat.toFixed(5) + '° N' : Math.abs(coords.lat).toFixed(5) + '° S'}, ${coords.lng >= 0 ? coords.lng.toFixed(5) + '° E' : Math.abs(coords.lng).toFixed(5) + '° W'} (Datum WGS-84 / SIRGAS-REGVEN)`;
                    generatingEvent = {
                      type: 'SCIENTIFIC_STUDY',
                      typeLabel: 'Sitio de Estudio del Corpus Científico',
                      title: f.data.articleTitle || f.data.name,
                      coordinates: coords,
                      satelliteCoordinates: satCoords,
                      satelliteSensor: 'Corpus Científico Cuenca del Orinoco (PostGIS + pgvector)',
                      severity: 'ALTO',
                      description: `Estudio "${f.data.articleTitle || f.data.name}" (${f.data.authors || 'Investigador'}, ${f.data.year || 2026}). Hallazgos: ${f.data.findings || 'Evaluación ecotoxicológica e hidroquímica'}.`,
                      details: f.data,
                    };
                  } else if (f.type === 'heat') {
                    coords = { lat: f.data.latitude, lng: f.data.longitude };
                    zoneName = `Sector ${f.data.sector}`;
                    overlap = f.data.basin;
                    const satCoords = `${coords.lat >= 0 ? coords.lat.toFixed(5) + '° N' : Math.abs(coords.lat).toFixed(5) + '° S'}, ${coords.lng >= 0 ? coords.lng.toFixed(5) + '° E' : Math.abs(coords.lng).toFixed(5) + '° W'} (Datum WGS-84 / SIRGAS-REGVEN)`;
                    generatingEvent = {
                      type: 'THERMAL_ANOMALY',
                      typeLabel: 'Foco Térmico Satelital (NASA FIRMS)',
                      title: `Anomalía Térmica en ${f.data.sector}`,
                      coordinates: coords,
                      satelliteCoordinates: satCoords,
                      satelliteSensor: 'NASA LANCE / VIIRS NOAA-20 & Suomi-NPP (375m I-Band)',
                      severity: f.data.confidence > 80 ? 'CRITICAL' : 'HIGH',
                      description: `Foco de calor de alta intensidad. Temp. Brillo: ${f.data.brightnessKelvin} K, FRP: ${f.data.frpMegaWatts} MW, Confiabilidad: ${f.data.confidence}%.`,
                      details: f.data,
                    };
                  } else if (f.type === 'hydro') {
                    coords = { lat: f.data.coordinates[1], lng: f.data.coordinates[0] };
                    zoneName = f.data.name;
                    overlap = f.data.basin;
                    const satCoords = `${coords.lat >= 0 ? coords.lat.toFixed(5) + '° N' : Math.abs(coords.lat).toFixed(5) + '° S'}, ${coords.lng >= 0 ? coords.lng.toFixed(5) + '° E' : Math.abs(coords.lng).toFixed(5) + '° W'} (Datum WGS-84 / SIRGAS-REGVEN)`;
                    generatingEvent = {
                      type: 'HYDRO_ALERT',
                      typeLabel: 'Estación Telemétrica Hidrológica Fluvial',
                      title: f.data.name,
                      coordinates: coords,
                      satelliteCoordinates: satCoords,
                      satelliteSensor: 'Red Telemétrica In Situ & Sondas Multiparamétricas Fluviales',
                      severity: f.data.status === 'CRITICO' ? 'CRITICAL' : 'HIGH',
                      description: `Estación telemétrica en río ${f.data.river}. Nivel: ${f.data.currentLevelM}m, Turbidez: ${f.data.turbidityNtu} NTU, Mercurio estimado: ${f.data.mercuryEstimatedPpm} ppm.`,
                      details: f.data,
                    };
                  } else if (f.type === 'protected') {
                    const featCoords = getFeatureLatLng(f);
                    coords = featCoords ? { lat: featCoords[0], lng: featCoords[1] } : { lat: 5.0, lng: -65.0 };
                    zoneName = f.data.name;
                    overlap = f.data.name;
                    const satCoords = `${coords.lat >= 0 ? coords.lat.toFixed(5) + '° N' : Math.abs(coords.lat).toFixed(5) + '° S'}, ${coords.lng >= 0 ? coords.lng.toFixed(5) + '° E' : Math.abs(coords.lng).toFixed(5) + '° W'} (Datum WGS-84 / SIRGAS-REGVEN)`;
                    generatingEvent = {
                      type: 'PROTECTED_AREA',
                      typeLabel: 'Área Natural Protegida (ABRAE)',
                      title: f.data.name,
                      coordinates: coords,
                      satelliteCoordinates: satCoords,
                      satelliteSensor: 'Cartografía Oficial Instituto Geográfico Simón Bolívar / INPARQUES',
                      severity: 'REGIMEN_ESTRICTO',
                      description: `${f.data.name} (${f.data.designation || 'Área Bajo Régimen de Administración Especial'}). Superficie: ${f.data.surfaceHa?.toLocaleString() || f.data.hectares?.toLocaleString() || 'N/A'} Ha. Riesgo: ${f.data.threatIndex || 0}%.`,
                      details: f.data,
                    };
                  } else if (f.type === 'incident') {
                    coords = { lat: f.data.latitude, lng: f.data.longitude };
                    zoneName = f.data.locationName;
                    overlap = f.data.title;
                    const satCoords = `${coords.lat >= 0 ? coords.lat.toFixed(5) + '° N' : Math.abs(coords.lat).toFixed(5) + '° S'}, ${coords.lng >= 0 ? coords.lng.toFixed(5) + '° E' : Math.abs(coords.lng).toFixed(5) + '° W'} (Datum WGS-84 / SIRGAS-REGVEN)`;
                    generatingEvent = {
                      type: 'INCIDENT',
                      typeLabel: 'Incidente Táctico / Minuta Operacional',
                      title: f.data.title,
                      coordinates: coords,
                      satelliteCoordinates: satCoords,
                      satelliteSensor: 'Minuta de Campo Guardería Ambiental / KoboToolbox / DGCIM',
                      severity: f.data.severity || 'CRITICAL',
                      description: `${f.data.title} en ${f.data.locationName}. Categoría: ${f.data.category}. Estado: ${f.data.status}. ${f.data.description || ''}`,
                      details: f.data,
                    };
                  } else if (f.type === 'sentinelS2') {
                    coords = { lat: f.data.center[0], lng: f.data.center[1] };
                    zoneName = f.data.title;
                    overlap = 'Área Forestal / Cobertura Boscosa de la Cuenca';
                    const satCoords = `${coords.lat >= 0 ? coords.lat.toFixed(5) + '° N' : Math.abs(coords.lat).toFixed(5) + '° S'}, ${coords.lng >= 0 ? coords.lng.toFixed(5) + '° E' : Math.abs(coords.lng).toFixed(5) + '° W'} (Datum WGS-84 / SIRGAS-REGVEN)`;
                    generatingEvent = {
                      type: 'SENTINEL2_DETECTION',
                      typeLabel: 'Detección Multiespectral de Deforestación Sentinel-2',
                      title: f.data.title,
                      coordinates: coords,
                      satelliteCoordinates: satCoords,
                      satelliteSensor: 'Copernicus Sentinel-2 MSI (Bandas NIR/SWIR B8/B11/B12 L2A)',
                      severity: 'CRITICAL',
                      description: `Pérdida de cobertura de bosque primario y piscinas de dragado aluvial en ${f.data.title}. Superficie afectada: ${f.data.areaHa} Ha.`,
                      details: f.data,
                    };
                  }

                  const formattedGpsZone = `${coords.lat >= 0 ? coords.lat.toFixed(5) + '° N' : Math.abs(coords.lat).toFixed(5) + '° S'}, ${coords.lng >= 0 ? coords.lng.toFixed(5) + '° E' : Math.abs(coords.lng).toFixed(5) + '° W'} (Datum WGS-84 / SIRGAS-REGVEN)`;

                  const contextPayload = {
                    zoneName: zoneName || 'Sector Táctico Identificado',
                    coordinates: coords,
                    generatingEvent: generatingEvent || {
                      type: 'EVENTO_CARTOGRAFICO',
                      typeLabel: 'Evento Cartográfico Táctico',
                      title: zoneName || 'Evento Detectado',
                      coordinates: coords,
                      satelliteCoordinates: formattedGpsZone,
                      satelliteSensor: 'Constelación Satelital Híbrida (VIIRS / Sentinel-1 / Sentinel-2 / Red In Situ)',
                      severity: 'ALERTA_ACTIVA',
                      description: 'Detección en cartografía táctica geoespacial',
                    },
                    satelliteCoordinates: formattedGpsZone,
                    satelliteLocation: {
                      latitude: coords.lat,
                      longitude: coords.lng,
                      formatted: formattedGpsZone,
                      geohashOrSector: zoneName,
                    },
                    thermalAnomalies: heatAnomalies.filter((h) => Math.abs(h.latitude - coords.lat) < 1.5 && Math.abs(h.longitude - coords.lng) < 1.5),
                    miningAlerts: miningClusters.filter((m) => Math.abs(m.latitude - coords.lat) < 1.5 && Math.abs(m.longitude - coords.lng) < 1.5),
                    waterQuality: f.type === 'hydro' ? {
                      turbidity: f.data.turbidityNtu,
                      mercuryPpm: f.data.mercuryEstimatedPpm,
                      level: f.data.currentLevelM,
                      status: f.data.status,
                    } : f.type === 'scientific' ? {
                      turbidity: f.data.turbidityNtu || 0,
                      mercuryPpm: f.data.heavyMetalsPpm || 0,
                      studyFindings: f.data.findings,
                      studyAuthors: f.data.authors,
                      studyTitle: f.data.articleTitle,
                      peerReviewed: f.data.peerReviewed,
                    } : undefined,
                    protectedAreaOverlap: overlap,
                    featureData: f.data,
                    featureType: f.type,
                  };

                  setSelectedFeature(null);
                  onTriggerAiAnalysis(contextPayload);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-lg font-medium text-xs shadow-lg shadow-sky-950/50 transition-all border border-sky-400/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
                <span className="font-semibold tracking-wide">Analítica de la Zona</span>
              </button>
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-semibold text-xs border border-slate-700/40 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zone Predictive and Perceptive Analytics Modal */}
      <ZoneAnalyticsModal
        isOpen={isZoneAnalyticsModalOpen}
        onClose={() => setIsZoneAnalyticsModalOpen(false)}
        result={zoneAnalyticsResult}
        isLoading={isZoneAnalyticsLoading}
        onRefresh={() => {
          if (selectedFeature) {
            const f = selectedFeature;
            const featCoords = getFeatureLatLng(f);
            const coords = featCoords ? { lat: featCoords[0], lng: featCoords[1] } : { lat: 5.0, lng: -65.0 };
            handleExecuteZonePredictiveAnalytics({
              zoneName: f.data?.name || f.data?.title || f.data?.locationName || 'Sector Cuenca',
              coordinates: coords,
            });
          }
        }}
        onCenterMap={(coords) => {
          if (mapInstanceRef.current && coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' && !isNaN(coords.lat) && !isNaN(coords.lng)) {
            mapInstanceRef.current.setView([coords.lat, coords.lng], 10, { animate: true });
          }
        }}
        onGenerateIncident={(res) => {
          if (res?.coordinates && typeof res.coordinates.lat === 'number' && typeof res.coordinates.lng === 'number' && !isNaN(res.coordinates.lat) && !isNaN(res.coordinates.lng)) {
            onOpenNewIncident({ lat: res.coordinates.lat, lng: res.coordinates.lng });
          }
          setIsZoneAnalyticsModalOpen(false);
        }}
      />

      {/* Bottom Coordinate & Metric Ticker */}
      <div className="absolute bottom-2 left-2 right-12 sm:bottom-3 sm:left-4 sm:right-16 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 sm:gap-4 bg-[#080d14]/90 backdrop-blur-md border border-slate-800 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-mono text-slate-300 shadow-xl pointer-events-auto max-w-full overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold shrink-0">
            <Compass className="w-3.5 h-3.5" />
            <span>AMAZONÍA VENEZOLANA: [0.5°N - 10.5°N | 68.5°W - 58.5°W]</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="text-slate-400 shrink-0">
            {selectedCoordinates ? (
              <span>PUNTO: <strong className="text-emerald-400">{selectedCoordinates[0].toFixed(4)}°N, {selectedCoordinates[1].toFixed(4)}°W</strong></span>
            ) : (
              <span className="hidden sm:inline">Haga clic en el mapa para inspección táctica</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
