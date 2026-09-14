import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Satellite, 
  Radar, 
  Smartphone, 
  Database, 
  Sparkles, 
  Search, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert, 
  Droplets, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Activity,
  Cpu,
  Workflow,
  Clock
} from 'lucide-react';
import { SupabaseAutomationSchedulerView } from './SupabaseAutomationSchedulerView';
import { 
  NasaFirmsHotspot, 
  CopernicusDisturbance, 
  KoboFieldPatrolReport, 
  LiveIngestionItem,
  VectorRagSearchResult,
  RagIntelligenceSynthesis,
  ConnectorHealthStatus,
  AlertSeverity,
  S2ProductTile,
  S2TileBand,
  OrbitSchedule
} from '../types';
import { 
  LivePipelineService, 
  INITIAL_LIVE_FIRMS_HOTSPOTS, 
  INITIAL_LIVE_COPERNICUS_DISTURBANCES, 
  INITIAL_LIVE_KOBO_PATROL_REPORTS,
  SUPABASE_POSTGIS_PGVECTOR_SQL,
  INITIAL_S2_PRODUCT_TILES,
  INITIAL_S2_TILE_BANDS,
  INITIAL_ORBIT_SCHEDULES
} from '../services/liveDataPipelineService';
import { SATELLITE_API_CONNECTIONS } from '../data/satelliteApiDirectory';

interface LiveIngestionPipelineViewProps {
  onNavigateToMapWithCoords?: (lat: number, lng: number, zoom?: number) => void;
  onAddIncident?: (incident: any) => void;
}

export const LiveIngestionPipelineView: React.FC<LiveIngestionPipelineViewProps> = ({
  onNavigateToMapWithCoords,
  onAddIncident
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'AUTOMATION_SCHEDULER' | 'CONNECTORS' | 'SATELLITE_APIS' | 'RAG_STUDIO' | 'LIVE_FEED' | 'POSTGIS_SQL' | 'SENTINEL_S2'>('AUTOMATION_SCHEDULER');
  const [connectorStatus, setConnectorStatus] = useState<ConnectorHealthStatus | null>(null);
  const [firmsList, setFirmsList] = useState<NasaFirmsHotspot[]>(INITIAL_LIVE_FIRMS_HOTSPOTS);
  const [copernicusList, setCopernicusList] = useState<CopernicusDisturbance[]>(INITIAL_LIVE_COPERNICUS_DISTURBANCES);
  const [koboList, setKoboList] = useState<KoboFieldPatrolReport[]>(INITIAL_LIVE_KOBO_PATROL_REPORTS);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  
  // Sentinel-2 S2 State
  const [s2Tiles, setS2Tiles] = useState<S2ProductTile[]>(INITIAL_S2_PRODUCT_TILES);
  const [selectedTile, setSelectedTile] = useState<S2ProductTile | null>(null);
  const [selectedTileBands, setSelectedTileBands] = useState<S2TileBand[]>([]);
  const [orbitSchedules, setOrbitSchedules] = useState<OrbitSchedule[]>(INITIAL_ORBIT_SCHEDULES);
  const [orbitLogs, setOrbitLogs] = useState<string[]>([]);
  const [isSimulatingOrbit, setIsSimulatingOrbit] = useState<string | null>(null);

  // Query / Filter state for Sentinel-2
  const [s2FilterState, setS2FilterState] = useState<string>('ALL');
  const [s2FilterAnomaly, setS2FilterAnomaly] = useState<boolean>(false);
  const [s2QueryAoiWkt, setS2QueryAoiWkt] = useState<string>('POLYGON((-67.8 1.0, -60.0 1.0, -60.0 10.0, -67.8 10.0, -67.8 1.0))');
  const [s2QueryStartDate, setS2QueryStartDate] = useState<string>('2024-01-01');
  const [s2QueryEndDate, setS2QueryEndDate] = useState<string>('2026-12-31');
  const [s2QueryCloudPct, setS2QueryCloudPct] = useState<number>(20);
  const [isQueryingS2Catalog, setIsQueryingS2Catalog] = useState<boolean>(false);
  const [searchedS2Products, setSearchedS2Products] = useState<S2ProductTile[]>([]);
  const [isIngestingProductId, setIsIngestingProductId] = useState<string | null>(null);

  const [isSyncingFirms, setIsSyncingFirms] = useState(false);
  const [isScanningCopernicus, setIsScanningCopernicus] = useState(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Kobo Webhook Modal / Drawer state
  const [koboModalOpen, setKoboModalOpen] = useState(false);
  const [webhookOfficer, setWebhookOfficer] = useState('Capitán (GNB) Marcos Alfonzo');
  const [webhookUnit, setWebhookUnit] = useState('Comando Fluvial N° 63 - Puerto Ayacucho');
  const [webhookRiver, setWebhookRiver] = useState('Río Atabapo / Caño Guasare');
  const [webhookCategory, setWebhookCategory] = useState<'MINERIA_ILEGAL' | 'CONTAMINACION_MERCURIO' | 'PISTA_CLANDESTINA'>('MINERIA_ILEGAL');
  const [webhookLat, setWebhookLat] = useState('3.991');
  const [webhookLng, setWebhookLng] = useState('-67.682');
  const [webhookTurbidity, setWebhookTurbidity] = useState('88.5');
  const [webhookMercury, setWebhookMercury] = useState('0.042');
  const [webhookDredges, setWebhookDredges] = useState('2');
  const [webhookNarrative, setWebhookNarrative] = useState('Detección y abordaje de balsa dragona de 8 cilindros operando en canal principal. Presencia confirmada de mercurio en canaletas de sedimentación.');

  // Vector RAG State
  const [ragQuery, setRagQuery] = useState('Balsas y dragas con vertido de mercurio en el Río Atabapo y Parque Nacional Yapacana');
  const [ragCosineThreshold, setRagCosineThreshold] = useState(0.65);
  const [ragRadiusKm, setRagRadiusKm] = useState(50);
  const [isExecutingRag, setIsExecutingRag] = useState(false);
  const [ragResult, setRagResult] = useState<RagIntelligenceSynthesis | null>(null);

  // Live Feed Table Filter
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'NASA_FIRMS' | 'COPERNICUS_SAR' | 'KOBO_TOOLBOX'>('ALL');

  // Load connector status & S2 data
  useEffect(() => {
    LivePipelineService.getConnectorStatus().then(status => setConnectorStatus(status));
    LivePipelineService.getS2ProductTiles().then(tiles => setS2Tiles(tiles));
    LivePipelineService.getOrbitSchedules().then(scheds => setOrbitSchedules(scheds));
  }, []);

  // Trigger NASA FIRMS
  const handleFetchFirms = async () => {
    setIsSyncingFirms(true);
    try {
      const res = await LivePipelineService.triggerNasaFirmsFetch();
      if (res.items && res.items.length > 0) {
        setFirmsList(res.items);
      }
    } finally {
      setIsSyncingFirms(false);
    }
  };

  // Trigger Copernicus SAR
  const handleScanCopernicus = async () => {
    setIsScanningCopernicus(true);
    try {
      const res = await LivePipelineService.triggerCopernicusScan();
      if (res.items) {
        setCopernicusList(res.items);
      }
    } finally {
      setIsScanningCopernicus(false);
    }
  };

  // Submit Kobo Webhook
  const handleDispatchKoboWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingWebhook(true);
    try {
      const res = await LivePipelineService.dispatchKoboWebhook({
        officerName: webhookOfficer,
        patrolUnit: webhookUnit,
        riverOrSubBasin: webhookRiver,
        sectorName: webhookRiver,
        latitude: parseFloat(webhookLat) || 3.991,
        longitude: parseFloat(webhookLng) || -67.682,
        category: webhookCategory,
        severity: 'CRITICAL',
        mercuryDetectedPpm: parseFloat(webhookMercury) || 0.0,
        turbidityNtu: parseFloat(webhookTurbidity) || 50.0,
        dredgesConfiscatedCount: parseInt(webhookDredges) || 1,
        narrative: webhookNarrative,
        evidencePhotoCount: 4,
      });

      if (res.report) {
        setKoboList(prev => [res.report, ...prev]);
        setKoboModalOpen(false);
      }
    } finally {
      setIsSendingWebhook(false);
    }
  };

  // Run RAG query
  const handleExecuteRag = async () => {
    if (!ragQuery.trim()) return;
    setIsExecutingRag(true);
    try {
      const synthesis = await LivePipelineService.executeVectorRagQuery({
        query: ragQuery,
        filterLat: 3.991,
        filterLng: -67.682,
        radiusKm: ragRadiusKm,
        matchThreshold: ragCosineThreshold,
        maxMatches: 5
      });
      setRagResult(synthesis);
    } finally {
      setIsExecutingRag(false);
    }
  };

  // === Sentinel-2 Satellite Methods ===
  const handleQueryS2Catalog = async () => {
    setIsQueryingS2Catalog(true);
    setOrbitLogs(prev => [...prev, `[STAC/OData] Consultando catálogo Sentinel-2 para la Amazonía venezolana...`]);
    try {
      const results = await LivePipelineService.queryS2Metadata({
        aoiWkt: s2QueryAoiWkt,
        startDate: s2QueryStartDate,
        endDate: s2QueryEndDate,
        cloudPixelPct: s2QueryCloudPct
      });
      setSearchedS2Products(results);
      setOrbitLogs(prev => [...prev, `[STAC/OData] Encontrados ${results.length} mosaicos L2A que cumplen con el límite de nubosidad < ${s2QueryCloudPct}%`]);
    } catch (err: any) {
      setOrbitLogs(prev => [...prev, `[STAC/OData] Error consultando metadatos: ${err?.message || err}`]);
    } finally {
      setIsQueryingS2Catalog(false);
    }
  };

  const handleIngestS2Tile = async (productId: string) => {
    setIsIngestingProductId(productId);
    setOrbitLogs(prev => [
      ...prev,
      `[ngEO] Iniciando Fase B para el Producto ${productId}...`,
      `[ngEO] Solicitando empaquetado optimizado con flags ngEO_DO: {bands:[SCL, TCI], format:SAFE_COMPACT}`
    ]);
    try {
      const res = await LivePipelineService.ingestS2Tile(productId);
      if (res.success) {
        // Actualizar la lista local de tiles
        const updatedTiles = s2Tiles.map(t => t.productId === productId ? res.tile : t);
        setS2Tiles(updatedTiles);
        
        // Si no existía, agregarlo
        if (!s2Tiles.some(t => t.productId === productId)) {
          setS2Tiles(prev => [res.tile, ...prev]);
        }
        
        setOrbitLogs(prev => [
          ...prev,
          `[SAFE] Fase C: Descargada y extraída carpeta IMG_DATA.`,
          `[SAFE] MTD_TL.xml analizado: Footprint="${res.tile.footprintGeometry}", SensingTime="${res.tile.sensingTime}"`,
          `[Supabase] Fase D: Registro ingresado con éxito en public.s2_product_tile.`,
          `[Supabase] Registradas ${res.bands.length} bandas espectrales de alta resolución (SCL, TCI) en public.s2_tile_bands.`
        ]);
      }
    } catch (err: any) {
      setOrbitLogs(prev => [...prev, `[SAFE] Error en pipeline de ingesta: ${err?.message || err}`]);
    } finally {
      setIsIngestingProductId(null);
    }
  };

  const handleTriggerOrbitPass = async (scheduleId: string) => {
    setIsSimulatingOrbit(scheduleId);
    setOrbitLogs([]);
    try {
      const res = await LivePipelineService.triggerOrbitPass(scheduleId);
      if (res.success) {
        setOrbitLogs(res.logs);
        
        // Marcar el schedule como completado
        setOrbitSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, status: 'COMPLETED' } : s));
        
        // Si nos trajo un nuevo tile, agregarlo
        if (res.tileAdded) {
          const tile = res.tileAdded;
          setS2Tiles(prev => {
            if (prev.some(t => t.id === tile.id)) return prev;
            return [tile, ...prev];
          });
        }
      }
    } catch (err: any) {
      setOrbitLogs(prev => [...prev, `[Orbit] Error disparando órbita: ${err?.message || err}`]);
    } finally {
      setIsSimulatingOrbit(null);
    }
  };

  const handleSelectTile = async (tile: S2ProductTile) => {
    setSelectedTile(tile);
    try {
      const bands = await LivePipelineService.getS2TileBands(tile.id);
      setSelectedTileBands(bands);
    } catch (e) {
      setSelectedTileBands([]);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_POSTGIS_PGVECTOR_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const downloadSqlScript = () => {
    const blob = new Blob([SUPABASE_POSTGIS_PGVECTOR_SQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'centinela_orinoco_postgis_pgvector.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-[#070d14] text-slate-200 overflow-y-auto flex flex-col">
      {/* Header Banner */}
      <div className="bg-[#0b131e] border-b border-slate-800/80 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-500 p-[1px] shadow-lg shadow-sky-950/50">
              <div className="w-full h-full bg-[#0b131e] rounded-[11px] flex items-center justify-center">
                <Workflow className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide font-sans">
                  Pipeline de Ingesta en Vivo, PostGIS y pgvector RAG
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                  REAL-TIME ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Conectores en Vivo NASA FIRMS (3h), Copernicus Sentinel-1 SAR, Webhooks KoboToolbox e Inyección Vectorial HNSW
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2">
            <button
              id="btn-sync-firms"
              onClick={handleFetchFirms}
              disabled={isSyncingFirms}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 text-xs font-medium rounded-lg border border-amber-800 transition-all disabled:opacity-50"
            >
              <Flame className={`w-3.5 h-3.5 ${isSyncingFirms ? 'animate-spin' : ''}`} />
              <span>{isSyncingFirms ? 'Consultando FIRMS...' : 'Ingestar NASA FIRMS'}</span>
            </button>

            <button
              id="btn-scan-copernicus"
              onClick={handleScanCopernicus}
              disabled={isScanningCopernicus}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900/80 text-sky-300 text-xs font-medium rounded-lg border border-sky-800 transition-all disabled:opacity-50"
            >
              <Radar className={`w-3.5 h-3.5 ${isScanningCopernicus ? 'animate-spin' : ''}`} />
              <span>{isScanningCopernicus ? 'Escaneando SAR...' : 'Escanear Sentinel-1 SAR'}</span>
            </button>

            <button
              id="btn-scan-sentinel2"
              onClick={async () => {
                setActiveTab('SENTINEL_S2');
                handleQueryS2Catalog();
              }}
              disabled={isQueryingS2Catalog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-800 transition-all disabled:opacity-50"
            >
              <Satellite className={`w-3.5 h-3.5 ${isQueryingS2Catalog ? 'animate-spin' : ''}`} />
              <span>{isQueryingS2Catalog ? 'Escaneando S2...' : 'Escanear Sentinel 2 SAR2'}</span>
            </button>

            <button
              id="btn-open-kobo-modal"
              onClick={() => setKoboModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-md shadow-emerald-950/40 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Inyectar Minuta Kobo</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-4 max-w-7xl mx-auto border-t border-slate-800/60 pt-3 flex-wrap">
          <button
            id="tab-automation-scheduler"
            onClick={() => setActiveTab('AUTOMATION_SCHEDULER')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'AUTOMATION_SCHEDULER' 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-950/50 ring-1 ring-violet-400' 
                : 'text-violet-300 hover:text-white hover:bg-violet-950/40 border border-violet-900/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 animate-pulse text-violet-300" />
            <span>Automatización Supabase (Cron Satélites)</span>
          </button>

          <button
            onClick={() => setActiveTab('CONNECTORS')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'CONNECTORS' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Matriz de Conectores ({connectorStatus ? '4/4 Operativos' : 'Activos'})</span>
          </button>

          <button
            id="tab-satellite-apis"
            onClick={() => setActiveTab('SATELLITE_APIS')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'SATELLITE_APIS' 
                ? 'bg-cyan-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span>Directorio URLs Satelitales ({SATELLITE_API_CONNECTIONS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('RAG_STUDIO')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'RAG_STUDIO' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>RAG Espacial & Similitud pgvector</span>
          </button>

          <button
            onClick={() => setActiveTab('LIVE_FEED')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'LIVE_FEED' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Feed de Datos Ingestados ({firmsList.length + copernicusList.length + koboList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('POSTGIS_SQL')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'POSTGIS_SQL' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Script SQL PostGIS + pgvector</span>
          </button>

          <button
            onClick={() => setActiveTab('SENTINEL_S2')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'SENTINEL_S2' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-semibold' 
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/30'
            }`}
          >
            <Satellite className="w-3.5 h-3.5 animate-pulse" />
            <span>Satelite S2-Sentinel</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* TAB 0: AUTOMATION SCHEDULER */}
        {activeTab === 'AUTOMATION_SCHEDULER' && (
          <SupabaseAutomationSchedulerView 
            onNavigateToRag={() => setActiveTab('RAG_STUDIO')}
            onNavigateToSql={() => setActiveTab('POSTGIS_SQL')}
          />
        )}

        {/* TAB 1: CONNECTORS OVERVIEW */}
        {activeTab === 'CONNECTORS' && (
          <div className="space-y-6">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* NASA FIRMS */}
              <div className="bg-[#0e1622] border border-amber-900/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                      POLLING 3 HORAS
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">NASA FIRMS (EOSDIS)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    MODIS / VIIRS (NOAA-20 & SNPP) para detección de anomalías térmicas y campamentos de fundición.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Focos Activos:</span>
                    <span className="text-amber-400 font-bold">{firmsList.length} registrados</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>BBox:</span>
                    <span className="text-slate-300">[-73.5, 0.5, -59.5, 12.5]</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Embeddings:</span>
                    <span className="text-emerald-400">768-D Vectorized</span>
                  </div>
                </div>
              </div>

              {/* COPERNICUS SAR */}
              <div className="bg-[#0e1622] border border-sky-900/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center">
                      <Radar className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800 rounded">
                      ESA STAC CDSE
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">Copernicus Sentinel-1 / 2</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Radar SAR interferométrico (VV+VH) y óptico L2A para detección de aperturas de dosel y piscinas de aluvión.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Disturbios SAR:</span>
                    <span className="text-sky-400 font-bold">{copernicusList.length} polígonos</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Área Afectada:</span>
                    <span className="text-slate-300">295.8 Hectáreas</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Geometría:</span>
                    <span className="text-emerald-400">PostGIS ST_Polygon</span>
                  </div>
                </div>
              </div>

              {/* KOBO TOOLBOX */}
              <div className="bg-[#0e1622] border border-emerald-900/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                      REST WEBHOOK LISTENER
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">KoboToolbox & ODK</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Recepción de minutas de patrullaje fluvial, muestras de mercurio y guardería ambiental en tiempo real.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Minutas Recibidas:</span>
                    <span className="text-emerald-400 font-bold">{koboList.length} reportes</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Endpoint:</span>
                    <span className="text-slate-300">/api/webhooks/kobo</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fotos & Evidencias:</span>
                    <span className="text-emerald-400">12 URLs Indexadas</span>
                  </div>
                </div>
              </div>

              {/* POSTGIS + PGVECTOR */}
              <div className="bg-[#0e1622] border border-indigo-900/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                      POSTGIS + PGVECTOR
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">Supabase PostgreSQL</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Indexación espacial GIST para polígonos/puntos y embeddings semánticos 768-D con índice HNSW.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Índice Vectorial:</span>
                    <span className="text-indigo-300 font-bold">HNSW (Cosine)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Dimensión:</span>
                    <span className="text-slate-300">768 dimensiones</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Función RAG:</span>
                    <span className="text-emerald-400">match_spatial_rag()</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Diagram Box */}
            <div className="bg-[#0b131e] border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Flujo de Datos: Ingesta en Vivo $\rightarrow$ Vectorización $\rightarrow$ RAG Espacial $\rightarrow$ Sala GIS</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800">
                  <div className="text-sky-400 font-bold mb-2">1. FUENTES VIVAS</div>
                  <ul className="text-slate-300 space-y-1.5">
                    <li>• NASA FIRMS (VIIRS 375m)</li>
                    <li>• Copernicus Sentinel-1 SAR</li>
                    <li>• Webhooks ODK/KoboToolbox</li>
                  </ul>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800">
                  <div className="text-indigo-400 font-bold mb-2">2. INGESTION & EMBEDDING</div>
                  <ul className="text-slate-300 space-y-1.5">
                    <li>• Georreferenciación PostGIS</li>
                    <li>• Generación de Embeddings 768-D</li>
                    <li>• Extracción de Metadatos Hg/NTU</li>
                  </ul>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800">
                  <div className="text-emerald-400 font-bold mb-2">3. POSTGIS + PGVECTOR</div>
                  <ul className="text-slate-300 space-y-1.5">
                    <li>• Índices GIST (geom)</li>
                    <li>• Índices HNSW (vector_cosine)</li>
                    <li>• Búsqueda espacial ST_DWithin</li>
                  </ul>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800">
                  <div className="text-amber-400 font-bold mb-2">4. SALA GIS & GEMINI RAG</div>
                  <ul className="text-slate-300 space-y-1.5">
                    <li>• Renderizado en Mapa Táctico</li>
                    <li>• Dictamen Operacional Gemini</li>
                    <li>• Alertas de Interdicción Fluvial</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Live Preview Table */}
            <div className="bg-[#0b131e] border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Últimos Registros Ingestados en Tiempo Real</span>
                </h3>
                <button
                  onClick={() => setActiveTab('LIVE_FEED')}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>Ver Todos ({firmsList.length + copernicusList.length + koboList.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {/* FIRMS Sample */}
                {firmsList.slice(0, 2).map((item) => (
                  <div key={item.id} className="p-3 bg-[#0f172a] border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-amber-950 text-amber-400 border border-amber-800 rounded-md">
                        <Flame className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <div className="font-semibold text-white">{item.sectorName}</div>
                        <div className="text-[11px] text-slate-400">{item.subBasin} • {item.satellite} ({item.frpMw} MW)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-400">{item.postgisGeomText}</span>
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                        768-D EMBEDDED
                      </span>
                    </div>
                  </div>
                ))}

                {/* Kobo Sample */}
                {koboList.slice(0, 1).map((item) => (
                  <div key={item.id} className="p-3 bg-[#0f172a] border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md">
                        <Smartphone className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <div className="font-semibold text-white">{item.officerName} - {item.sectorName}</div>
                        <div className="text-[11px] text-slate-400">{item.patrolUnit} • Hg: {item.mercuryDetectedPpm} ppm • {item.turbidityNtu} NTU</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-400">{item.postgisGeomText}</span>
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                        WEBHOOK INGESTED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1.5: SATELLITE API CONNECTIONS DIRECTORY */}
        {activeTab === 'SATELLITE_APIS' && (
          <div className="space-y-6">
            <div className="bg-[#0b131e] border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
                    <Satellite className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Directorio de Conexiones Satelitales & URLs de Ingesta
                    </h3>
                    <p className="text-xs text-slate-400">
                      Endpoints oficiales configurados para la Amazonía Venezolana (Amazonas, Bolívar, Delta Amacuro y Guayana Esequiba).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 rounded-lg">
                    Bounding Box: [-68.5°, 0.5°] a [-58.5°, 10.2°]
                  </span>
                </div>
              </div>

              {/* Connections Cards Grid */}
              <div className="grid grid-cols-1 gap-4 mt-4">
                {SATELLITE_API_CONNECTIONS.map((conn) => {
                  const isCopied = copiedUrlId === conn.id;
                  return (
                    <div 
                      key={conn.id}
                      className="p-4 rounded-xl bg-[#070e17] border border-slate-800 hover:border-slate-700 transition-all shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{conn.name}</span>
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                              {conn.agency}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded">
                              {conn.spatialResolution}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                              {conn.updateFrequency}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{conn.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {conn.documentationUrl.startsWith('http') && (
                            <a
                              href={conn.documentationUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-cyan-400 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/50 rounded-lg transition-colors"
                            >
                              Docs Oficiales
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* URL Box */}
                      <div className="space-y-1.5 mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>ENDPOINT URL ACTIVO:</span>
                          <span className="text-cyan-400">Payload: {conn.payloadFormat}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2.5 bg-[#05090f] border border-slate-800 rounded-lg font-mono text-xs text-cyan-300 overflow-x-auto">
                          <span className="select-all flex-1 whitespace-nowrap">{conn.activeUrl}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(conn.activeUrl);
                              setCopiedUrlId(conn.id);
                              setTimeout(() => setCopiedUrlId(null), 2500);
                            }}
                            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 shrink-0 font-sans"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Copiado' : 'Copiar URL'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Bounding Box & Sample cURL */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/70 text-xs">
                        <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-mono block mb-1">COBERTURA AMAZONÍA VENEZOLANA & GUAYANA:</span>
                          <p className="font-mono text-[11px] text-slate-300">
                            W: {conn.amazonBoundingBox.west}° | S: {conn.amazonBoundingBox.south}° | E: {conn.amazonBoundingBox.east}° | N: {conn.amazonBoundingBox.north}°
                          </p>
                        </div>

                        <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-mono block mb-1">COMANDO CURL DE CONSULTA:</span>
                          <div className="font-mono text-[10px] text-slate-400 truncate select-all">
                            {conn.sampleCurlCommand}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VECTOR RAG & PGVECTOR STUDIO */}
        {activeTab === 'RAG_STUDIO' && (
          <div className="space-y-6">
            {/* Query Panel */}
            <div className="bg-[#0b131e] border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  Consulta de Inteligencia Ambiental (RAG Vectorial + PostGIS)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                El sistema transforma su consulta en un vector semántico (768 dimensiones) y ejecuta una búsqueda de similitud coseno combinada con la distancia geodésica PostGIS (<code className="text-emerald-400 font-mono">ST_DWithin</code>) sobre la base de datos Supabase.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    CONSULTA DE BÚSQUEDA SEMÁNTICA:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ragQuery}
                      onChange={(e) => setRagQuery(e.target.value)}
                      placeholder="Ej: Balsas mineras activas en Río Atabapo con vertido de mercurio..."
                      className="w-full bg-[#070d14] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
                    />
                    <button
                      id="btn-execute-rag-query"
                      onClick={handleExecuteRag}
                      disabled={isExecutingRag}
                      className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-md shadow flex items-center gap-1.5 disabled:opacity-50 transition-all"
                    >
                      <Search className={`w-3.5 h-3.5 ${isExecutingRag ? 'animate-spin' : ''}`} />
                      <span>{isExecutingRag ? 'Vectorizando y Consultando...' : 'Ejecutar RAG'}</span>
                    </button>
                  </div>
                </div>

                {/* Preset Queries */}
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="text-slate-400 font-mono">Consultas Tácticas Frecuentes:</span>
                  <button
                    onClick={() => setRagQuery('Balsas y dragas con vertido de mercurio en Río Atabapo')}
                    className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-800 text-sky-300 rounded border border-slate-700 transition-colors"
                  >
                    Dragas en Atabapo (Hg)
                  </button>
                  <button
                    onClick={() => setRagQuery('Deforestación y aperturas SAR en Cerro Yapacana')}
                    className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-800 text-amber-300 rounded border border-slate-700 transition-colors"
                  >
                    Radar SAR en Yapacana
                  </button>
                  <button
                    onClick={() => setRagQuery('Pistas clandestinas y tambores de combustible en Alto Ventuari')}
                    className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-800 text-emerald-300 rounded border border-slate-700 transition-colors"
                  >
                    Pistas Clandestinas Ventuari
                  </button>
                  <button
                    onClick={() => setRagQuery('Contaminación y sedimentación de sedimentos en Río Caroní e Icabarú')}
                    className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-800 text-indigo-300 rounded border border-slate-700 transition-colors"
                  >
                    Sedimentación en Caroní
                  </button>
                </div>

                {/* Parameters Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/60 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Umbral de Similitud Coseno (pgvector):</span>
                      <span className="text-sky-400 font-bold">{Math.round(ragCosineThreshold * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.40"
                      max="0.95"
                      step="0.05"
                      value={ragCosineThreshold}
                      onChange={(e) => setRagCosineThreshold(parseFloat(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Radio Espacial PostGIS (ST_DWithin):</span>
                      <span className="text-emerald-400 font-bold">{ragRadiusKm} km</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      value={ragRadiusKm}
                      onChange={(e) => setRagRadiusKm(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RAG Results Display */}
            {ragResult && (
              <div className="space-y-6">
                {/* Top Matches Cards */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Registros Recuperados por Similitud Coseno & Filtro PostGIS ({ragResult.topMatches.length} Coincidencias)</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ragResult.topMatches.map((match) => (
                      <div key={match.id} className="bg-[#0e1622] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              match.source === 'KOBO_TOOLBOX' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              match.source === 'NASA_FIRMS' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              match.source === 'COPERNICUS_SAR' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                              'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            }`}>
                              {match.source}
                            </span>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className="text-emerald-400 font-bold">
                                Similitud: {Math.round(match.cosineSimilarity * 100)}%
                              </span>
                              {match.distanceKmFromQueryTarget !== undefined && (
                                <span className="text-slate-400">
                                  • {match.distanceKmFromQueryTarget} km
                                </span>
                              )}
                            </div>
                          </div>

                          <h5 className="font-semibold text-white text-xs mb-1">{match.title}</h5>
                          <p className="text-[11px] text-slate-300 line-clamp-3 mb-2">{match.contentSnippet}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>{match.postgisGeometry}</span>
                          {onNavigateToMapWithCoords && (
                            <button
                              onClick={() => onNavigateToMapWithCoords(match.latitude, match.longitude, 12)}
                              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-sans font-medium"
                            >
                              <span>Ver en Mapa</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gemini Synthesized Intelligence Report */}
                <div className="bg-[#0b131e] border border-sky-900/50 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Dictamen de Inteligencia Geoespacial RAG</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Generado por Gemini 3.7 Flash con vector store PostgreSQL</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-800 text-xs font-mono font-bold">
                      AMENAZA: CRÍTICA
                    </span>
                  </div>

                  {/* Threat Matrix Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-6">
                    <div className="bg-[#070d14] p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-500 text-[10px]">RIESGO DEFORESTACIÓN:</div>
                      <div className="text-amber-400 font-bold mt-0.5">{ragResult.threatMatrix.deforestationRisk}</div>
                    </div>
                    <div className="bg-[#070d14] p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-500 text-[10px]">EXPOSICIÓN MERCURIO:</div>
                      <div className="text-red-400 font-bold mt-0.5">{ragResult.threatMatrix.mercuryExposureRisk}</div>
                    </div>
                    <div className="bg-[#070d14] p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-500 text-[10px]">TERRITORIOS ANCESTRALES:</div>
                      <div className="text-sky-400 font-bold mt-0.5">{ragResult.threatMatrix.indigenousTerritoryOverlap}</div>
                    </div>
                    <div className="bg-[#070d14] p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-500 text-[10px]">ZONA INTERDICCIÓN:</div>
                      <div className="text-emerald-400 font-bold mt-0.5">{ragResult.threatMatrix.immediateInterdictionZone}</div>
                    </div>
                  </div>

                  {/* Markdown Content */}
                  <div className="prose prose-invert max-w-none text-xs text-slate-200 leading-relaxed space-y-3">
                    <div className="whitespace-pre-line font-sans">
                      {ragResult.synthesisMarkdown}
                    </div>
                  </div>

                  {/* Tactical Directive Box */}
                  <div className="mt-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-white">RECOMENDACIÓN OPERATIVA DIRECTA</div>
                        <p className="text-xs text-emerald-200 mt-0.5">{ragResult.tacticalRecommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE INGESTED FEED INSPECTOR */}
        {activeTab === 'LIVE_FEED' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0b131e] p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Filtrar por Fuente:</span>
                <div className="flex items-center gap-1 bg-[#070d14] p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setFeedFilter('ALL')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      feedFilter === 'ALL' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({firmsList.length + copernicusList.length + koboList.length})
                  </button>
                  <button
                    onClick={() => setFeedFilter('NASA_FIRMS')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      feedFilter === 'NASA_FIRMS' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    NASA FIRMS ({firmsList.length})
                  </button>
                  <button
                    onClick={() => setFeedFilter('COPERNICUS_SAR')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      feedFilter === 'COPERNICUS_SAR' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Copernicus SAR ({copernicusList.length})
                  </button>
                  <button
                    onClick={() => setFeedFilter('KOBO_TOOLBOX')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      feedFilter === 'KOBO_TOOLBOX' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kobo Webhooks ({koboList.length})
                  </button>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Almacenamiento: <span className="text-emerald-400 font-bold">PostGIS + pgvector (Sincronizado)</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#0b131e] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070d14] text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Fuente / Misión</th>
                      <th className="py-3 px-4">Sector / Subcuenca</th>
                      <th className="py-3 px-4">Coordenadas PostGIS</th>
                      <th className="py-3 px-4">Métricas Críticas</th>
                      <th className="py-3 px-4">Vector 768-D</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {/* FIRMS rows */}
                    {(feedFilter === 'ALL' || feedFilter === 'NASA_FIRMS') && firmsList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-amber-950 text-amber-400 border border-amber-800">
                              <Flame className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <div className="font-semibold text-white">{item.satellite}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.acqDate} {item.acqTime}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{item.sectorName}</div>
                          <div className="text-[11px] text-slate-400">{item.subBasin}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                          {item.postgisGeomText}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="text-amber-400 font-bold">{item.frpMw} MW FRP</span>
                          <span className="text-slate-400"> • {item.brightnessTempK} K</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                            INDEXED (768-D)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {onNavigateToMapWithCoords && (
                            <button
                              onClick={() => onNavigateToMapWithCoords(item.latitude, item.longitude, 12)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-xs font-mono"
                            >
                              Ver Mapa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Copernicus rows */}
                    {(feedFilter === 'ALL' || feedFilter === 'COPERNICUS_SAR') && copernicusList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-sky-950 text-sky-400 border border-sky-800">
                              <Radar className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <div className="font-semibold text-white">{item.mission}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{item.sectorName}</div>
                          <div className="text-[11px] text-slate-400">{item.subBasin}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                          {item.postgisGeomText.slice(0, 24)}...
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="text-red-400 font-bold">{item.affectedAreaHa} Ha</span>
                          <span className="text-slate-400"> • {item.backscatterDiffDb} dB</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                            INDEXED (768-D)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {onNavigateToMapWithCoords && (
                            <button
                              onClick={() => onNavigateToMapWithCoords(item.latitude, item.longitude, 12)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-xs font-mono"
                            >
                              Ver Mapa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Kobo rows */}
                    {(feedFilter === 'ALL' || feedFilter === 'KOBO_TOOLBOX') && koboList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              <Smartphone className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <div className="font-semibold text-white">{item.source}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.submissionTime}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{item.officerName}</div>
                          <div className="text-[11px] text-slate-400">{item.sectorName} ({item.patrolUnit})</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                          {item.postgisGeomText}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="text-red-400 font-bold">{item.mercuryDetectedPpm} ppm Hg</span>
                          <span className="text-slate-400"> • {item.turbidityNtu} NTU</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                            INDEXED (768-D)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {onNavigateToMapWithCoords && (
                            <button
                              onClick={() => onNavigateToMapWithCoords(item.latitude, item.longitude, 12)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-xs font-mono"
                            >
                              Ver Mapa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SQL SCRIPT & SCHEMA */}
        {activeTab === 'POSTGIS_SQL' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0b131e] p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">
                  Esquema de Migración SQL: PostGIS + pgvector (HNSW) para Supabase
                </h3>
                <p className="text-xs text-slate-400">
                  Incluye creación de tablas con campos geométricos, vector(768), índices HNSW y la función RPC de búsqueda espacial <code className="text-emerald-400 font-mono">match_spatial_environmental_rag()</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copySqlToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado al Portapapeles' : 'Copiar SQL'}</span>
                </button>

                <button
                  onClick={downloadSqlScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .sql</span>
                </button>
              </div>
            </div>

            <div className="bg-[#05090e] border border-slate-800 rounded-xl p-4 overflow-x-auto">
              <pre className="text-[11px] font-mono text-slate-300 leading-relaxed select-all">
                {SUPABASE_POSTGIS_PGVECTOR_SQL}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 5: SENTINEL-2 LIVE PIPELINE & PGVECTOR RAG */}
        {activeTab === 'SENTINEL_S2' && (
          <div className="space-y-6">
            {/* Phase Diagram Flow (Anti-Slop Modern Design) */}
            <div className="bg-[#0b131e] border border-slate-800/80 rounded-xl p-5 shadow-xl">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Arquitectura de Ingesta Sentinel-2 (L2A compactSAFE - 4 Fases)
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Diagrama de secuencia de la ingesta en vivo conectada al satélite Sentinel-2 para el monitoreo automatizado de la Amazonía Venezolana.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
                {/* Phase 1 */}
                <div className="bg-[#070d14] border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">FASE A</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800">Query STAC</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">Búsqueda de Catálogo</h4>
                    <p className="text-[11px] text-slate-400">
                      Query espacial sobre el AOI (Amazonía) y filtrado de nubes &lt; 20% usando Copernicus STAC & OData API.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-slate-500 truncate">
                    dataspace.copernicus.eu
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="bg-[#070d14] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">FASE B</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800">ngEO_DO</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">Resolución de URIs</h4>
                    <p className="text-[11px] text-slate-400">
                      Generación de URI optimizada con parámetros de descarga parcial <code className="text-emerald-300">bands=[SCL,TCI]</code> y formato compacto.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-slate-500">
                    SAFE_COMPACT mode
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="bg-[#070d14] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">FASE C</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800">Download</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">Descarga y Extracción</h4>
                    <p className="text-[11px] text-slate-400">
                      Descarga compactada, mapeo de jp2 de bandas espectrales y validación del XML de metadatos del mosaico.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-emerald-400">
                    Extracting IMG_DATA
                  </div>
                </div>

                {/* Phase 4 */}
                <div className="bg-[#070d14] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">FASE D</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800">PostGIS</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">Persistencia y Vectores</h4>
                    <p className="text-[11px] text-slate-400">
                      Inserción del footprint espacial vía <code className="text-emerald-400">ST_GeomFromText</code> y embeddings de reporte a pgvector para RAG híbrido.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-emerald-400">
                    Supabase HNSW index
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Live Orbit Schedules & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column: Orbit trigger */}
              <div className="lg:col-span-5 bg-[#0b131e] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-teal-400" />
                    Pasada de Órbita S2 (Sincronización Automatizada)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Simule el sobrevuelo satelital y dispare el pipeline de ingesta conectado a la cola de eventos Kafka.
                  </p>

                  <div className="space-y-3">
                    {orbitSchedules.map(sched => (
                      <div key={sched.id} className="p-3.5 bg-[#070d14] border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white">{sched.satellite}</span>
                            <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-slate-900 text-slate-400">
                              {sched.targetRegion}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-400 font-mono">{sched.nextPassTime}</p>
                          <p className="text-[10px] text-slate-500 mt-1">Kafka: {sched.kafkaTopic}</p>
                        </div>

                        <button
                          onClick={() => handleTriggerOrbitPass(sched.id)}
                          disabled={isSimulatingOrbit !== null}
                          className="px-2.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow disabled:opacity-50"
                        >
                          {isSimulatingOrbit === sched.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <Satellite className="w-3 h-3" />
                              <span>Simular Órbita</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Conexión directa activa con el Copernicus Data Space Catalogue API.</span>
                  </div>
                </div>
              </div>

              {/* Right column: Terminal log output */}
              <div className="lg:col-span-7 bg-[#05090e] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col h-[320px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-xs text-slate-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-sky-400" />
                    CONSOLA DEL PIPELINE EN TIEMPO REAL
                  </h3>
                  <button
                    onClick={() => setOrbitLogs([])}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-300"
                  >
                    Limpiar Consola
                  </button>
                </div>

                <div className="flex-1 bg-black p-4 rounded-lg overflow-y-auto font-mono text-[11px] text-emerald-400/90 space-y-1 leading-relaxed border border-slate-900 select-text">
                  {orbitLogs.length === 0 ? (
                    <div className="text-slate-500 italic flex items-center justify-center h-full text-center px-4">
                      Esperando telemetría... Dispare un itinerario de órbita para ver la secuencia SAFE compact.
                    </div>
                  ) : (
                    orbitLogs.map((log, index) => {
                      let color = 'text-emerald-400/90';
                      if (log.includes('[Error]')) color = 'text-red-400';
                      else if (log.includes('[Supabase]')) color = 'text-sky-400';
                      else if (log.includes('[pgvector]')) color = 'text-indigo-350';
                      else if (log.includes('[OData]')) color = 'text-amber-300';
                      return (
                        <div key={index} className={color}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Phase A Search / Catalog API manual exploration */}
            <div className="bg-[#0b131e] border border-slate-800 rounded-xl p-5 shadow-xl">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-sky-400" />
                Explorador del Catálogo Copernicus S2-MSI (Búsqueda Manual)
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Formule un query geográfico y temporal directo sobre la base del Copernicus Data Space para verificar mosaicos disponibles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">RANGO INICIO:</label>
                  <input
                    type="date"
                    value={s2QueryStartDate}
                    onChange={(e) => setS2QueryStartDate(e.target.value)}
                    className="w-full bg-[#070d14] border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">RANGO FIN:</label>
                  <input
                    type="date"
                    value={s2QueryEndDate}
                    onChange={(e) => setS2QueryEndDate(e.target.value)}
                    className="w-full bg-[#070d14] border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">NUBOSIDAD MÁXIMA (%):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={s2QueryCloudPct}
                      onChange={(e) => setS2QueryCloudPct(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <span className="text-xs font-mono font-bold text-sky-400 w-8">{s2QueryCloudPct}%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">ÁREA DE INTERÉS (AOI WKT):</label>
                  <input
                    type="text"
                    value={s2QueryAoiWkt}
                    onChange={(e) => setS2QueryAoiWkt(e.target.value)}
                    className="w-full bg-[#070d14] border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-sky-500 truncate"
                    title={s2QueryAoiWkt}
                  />
                </div>
              </div>

              <div className="flex justify-end mb-4">
                <button
                  onClick={handleQueryS2Catalog}
                  disabled={isQueryingS2Catalog}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                >
                  {isQueryingS2Catalog ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>{isQueryingS2Catalog ? 'Consultando API Copernicus...' : 'Buscar Mosaicos en Catálogo'}</span>
                </button>
              </div>

              {searchedS2Products.length > 0 && (
                <div className="bg-[#070d14] rounded-lg border border-slate-800 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Resultados STAC Encontrados</span>
                    <span className="text-[10px] font-mono text-sky-400">{searchedS2Products.length} productos</span>
                  </div>
                  <div className="overflow-x-auto max-h-[180px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/20 text-[10px] font-mono text-slate-400">
                          <th className="py-2 px-4">ID PRODUCTO</th>
                          <th className="py-2 px-4">SATÉLITE</th>
                          <th className="py-2 px-4">TÉMINO REGISTRO</th>
                          <th className="py-2 px-4">NUBOSIDAD</th>
                          <th className="py-2 px-4">ESTADO</th>
                          <th className="py-2 px-4 text-right">INGESTA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                        {searchedS2Products.map(prod => (
                          <tr key={prod.id} className="hover:bg-slate-800/20">
                            <td className="py-2 px-4 font-mono text-[11px] text-sky-400">{prod.productId}</td>
                            <td className="py-2 px-4 font-mono">{prod.satelliteCode}</td>
                            <td className="py-2 px-4 font-mono">{prod.sensingTime}</td>
                            <td className="py-2 px-4 font-mono">{prod.cloudPixelPct}%</td>
                            <td className="py-2 px-4">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                s2Tiles.some(t => t.productId === prod.productId && t.downloadStatus === 'COMPLETED')
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : 'bg-amber-950 text-amber-400'
                              }`}>
                                {s2Tiles.some(t => t.productId === prod.productId && t.downloadStatus === 'COMPLETED') ? 'INGESTADO' : 'PENDIENTE'}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right">
                              <button
                                onClick={() => handleIngestS2Tile(prod.productId)}
                                disabled={isIngestingProductId === prod.productId || s2Tiles.some(t => t.productId === prod.productId && t.downloadStatus === 'COMPLETED')}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-white rounded text-[10px] font-semibold disabled:opacity-40"
                              >
                                {isIngestingProductId === prod.productId ? 'Ingestando...' : 'Ingestar (Fases B-D)'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* S2 Product Tiles Table Views */}
            <div className="bg-[#0b131e] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Registros Históricos y Recientes de Ingesta S2 (Supabase)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mosaicos Sentinel-2 procesados con su estatus de descarga parcial compacta y evaluación espectral.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 mr-2">ESTADO:</label>
                    <select
                      value={s2FilterState}
                      onChange={(e) => setS2FilterState(e.target.value)}
                      className="bg-[#070d14] border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">Todos los Estados</option>
                      <option value="Amazonas">Amazonas</option>
                      <option value="Bolivar">Bolívar</option>
                      <option value="Delta Amacuro">Delta Amacuro</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300 bg-[#070d14] px-3 py-1 rounded border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s2FilterAnomaly}
                      onChange={(e) => setS2FilterAnomaly(e.target.checked)}
                      className="rounded bg-[#070d14] border-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Solo Anomalías</span>
                  </label>
                </div>
              </div>

              {/* Table of Tiles */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-mono text-slate-400">
                      <th className="py-3 px-4">ID TILE / SATÉLITE</th>
                      <th className="py-3 px-4">ESTADO FEDERAL</th>
                      <th className="py-3 px-4">FECHA SENSING</th>
                      <th className="py-3 px-4 font-mono">CLOUD %</th>
                      <th className="py-3 px-4">ANOMALÍA DETECTADA</th>
                      <th className="py-3 px-4">ÁREA AFECTADA</th>
                      <th className="py-3 px-4 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                    {s2Tiles
                      .filter(t => s2FilterState === 'ALL' || t.state.toLowerCase() === s2FilterState.toLowerCase())
                      .filter(t => !s2FilterAnomaly || t.anomalyDetected)
                      .map(tile => {
                        const isSelected = selectedTile?.id === tile.id;
                        return (
                          <React.Fragment key={tile.id}>
                            <tr
                              onClick={() => handleSelectTile(tile)}
                              className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${
                                isSelected ? 'bg-emerald-950/30 border-l-2 border-emerald-500' : ''
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="p-1 rounded bg-slate-900 text-slate-400">
                                    <Satellite className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <div className="font-semibold text-white">{tile.tileId}</div>
                                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]" title={tile.productId}>
                                      {tile.productId}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium text-slate-200">{tile.state}</span>
                                <div className="text-[10px] text-slate-400 font-mono">Satélite {tile.satelliteCode}</div>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                                {tile.sensingTime.replace('T', ' ').slice(0, 16)} UTC
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                                {tile.cloudPixelPct}%
                              </td>
                              <td className="py-3 px-4">
                                {tile.anomalyDetected ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-300 border border-red-900/60 flex items-center gap-1 w-fit">
                                    <AlertTriangle className="w-3 h-3 text-red-400" />
                                    <span>{tile.anomalyType}</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-900/40 w-fit">
                                    ESTABLE
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-red-400 font-bold">
                                {tile.affectedAreaHa > 0 ? `${tile.affectedAreaHa} Ha` : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {onNavigateToMapWithCoords && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const lat = tile.state === 'Amazonas' ? 3.99 : tile.state === 'Bolivar' ? 6.5 : 8.8;
                                        const lng = tile.state === 'Amazonas' ? -67.6 : tile.state === 'Bolivar' ? -64.5 : -61.5;
                                        onNavigateToMapWithCoords(lat, lng, 10);
                                      }}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded text-[10px] font-mono transition-colors"
                                    >
                                      Ver Mapa
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Collapsible Details Row */}
                            {isSelected && (
                              <tr>
                                <td colSpan={7} className="bg-slate-900/60 px-6 py-4 border-t border-b border-slate-800">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left: Metadata */}
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                                        DETALLES E HISTORIAL DEL MOSAICO
                                      </h4>
                                      <p className="text-xs text-slate-300 leading-relaxed bg-[#070d14] p-3 rounded-lg border border-slate-800">
                                        {tile.description}
                                      </p>

                                      <div className="text-[11px] font-mono space-y-1.5 text-slate-400">
                                        <div>
                                          <span className="text-slate-500">Footprint WKT:</span>{' '}
                                          <code className="text-slate-300 block bg-[#070d14] p-1.5 rounded text-[10px] truncate" title={tile.footprintGeometry}>
                                            {tile.footprintGeometry}
                                          </code>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">ngEO URI de descarga parcial:</span>{' '}
                                          <code className="text-emerald-400 block bg-[#070d14] p-1.5 rounded text-[10px] truncate" title={tile.ngeoUri}>
                                            {tile.ngeoUri}
                                          </code>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Registrado en: <strong className="text-slate-300">{tile.createdAt.replace('T', ' ').slice(0, 16)}</strong></span>
                                          <span>Status de Descarga: <strong className="text-emerald-400">{tile.downloadStatus}</strong></span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: Spectral bands jp2 mapped */}
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                                        BANDAS ESPECTRALES DEL PRODUCTO (jp2)
                                      </h4>
                                      <p className="text-[11px] text-slate-400">
                                        Bandas espectrales descargadas bajo el formato parcial <code className="text-emerald-300">SAFE_COMPACT</code>:
                                      </p>

                                      <div className="space-y-2">
                                        {selectedTileBands.length === 0 ? (
                                          <div className="text-slate-500 text-xs italic">Cargando bandas de Sentinel-2...</div>
                                        ) : (
                                          selectedTileBands.map(band => (
                                            <div key={band.id} className="p-2.5 bg-[#070d14] rounded border border-slate-800 flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-mono font-bold border border-slate-800">
                                                  {band.bandName}
                                                </span>
                                                <div>
                                                  <div className="text-[11px] text-slate-300 font-mono truncate max-w-[200px]" title={band.filePath}>
                                                    {band.filePath.split('/').pop()}
                                                  </div>
                                                  <div className="text-[10px] text-slate-500">Resolución: {band.resolutionM} metros</div>
                                                </div>
                                              </div>
                                              <span className="text-[10px] font-mono text-slate-400">
                                                {(band.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                                              </span>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Simular Inyección Webhook KoboToolbox */}
      {koboModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b131e] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Smartphone className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Inyección de Minuta de Campo (Webhook Kobo / ODK)
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">POST a /api/webhooks/kobo</span>
                </div>
              </div>
              <button
                onClick={() => setKoboModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchKoboWebhook} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">OFICIAL AL MANDO:</label>
                  <input
                    type="text"
                    value={webhookOfficer}
                    onChange={(e) => setWebhookOfficer(e.target.value)}
                    required
                    className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">UNIDAD / COMANDO:</label>
                  <input
                    type="text"
                    value={webhookUnit}
                    onChange={(e) => setWebhookUnit(e.target.value)}
                    required
                    className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">RÍO / SECTOR:</label>
                  <input
                    type="text"
                    value={webhookRiver}
                    onChange={(e) => setWebhookRiver(e.target.value)}
                    required
                    className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">LATITUD:</label>
                  <input
                    type="text"
                    value={webhookLat}
                    onChange={(e) => setWebhookLat(e.target.value)}
                    required
                    className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">LONGITUD:</label>
                  <input
                    type="text"
                    value={webhookLng}
                    onChange={(e) => setWebhookLng(e.target.value)}
                    required
                    className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">MERCURIO (PPM):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={webhookMercury}
                    onChange={(e) => setWebhookMercury(e.target.value)}
                    className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">TURBIDEZ (NTU):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={webhookTurbidity}
                    onChange={(e) => setWebhookTurbidity(e.target.value)}
                    className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">DRAGAS RETENIDAS:</label>
                  <input
                    type="number"
                    value={webhookDredges}
                    onChange={(e) => setWebhookDredges(e.target.value)}
                    className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">MINUTA Y NARRATIVA OPERACIONAL:</label>
                <textarea
                  rows={3}
                  value={webhookNarrative}
                  onChange={(e) => setWebhookNarrative(e.target.value)}
                  className="w-full bg-[#070d14] border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setKoboModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSendingWebhook}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-2 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingWebhook ? 'Despachando Webhook...' : 'Inyectar al Pipeline'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
