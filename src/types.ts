export type ViewMode = 
  | 'MAP_SITUATION'
  | 'LIVE_PIPELINE'
  | 'SCIENTIFIC_CORPUS'
  | 'SAR_RADAR_ANOMALIES'
  | 'SYNTHETIC_TELEMETRY'
  | 'TELEMETRY'
  | 'INCIDENTS'
  | 'SUPABASE_CONSOLE'
  | 'AI_INTELLIGENCE'
  | 'BULLETIN_GENERATOR';

export type BaseLayerType = 'satellite' | 'dark' | 'topo';

export interface VisibleLayersState {
  venezuela: boolean;
  states: boolean;
  municipalities: boolean;
  rivers: boolean;
  sectors: boolean;
  basin: boolean;
  mining: boolean;
  heat: boolean;
  hydro: boolean;
  protected: boolean;
  incidents: boolean;
  sentinelS2: boolean;
  scientific: boolean;
  amazonasBolivarDelta: boolean;
}

export type IngestionSource = 'NASA_FIRMS' | 'COPERNICUS_SAR' | 'KOBO_TOOLBOX' | 'ODK_COLLECT';

export interface NasaFirmsHotspot {
  id: string;
  source: 'NASA_FIRMS';
  satellite: 'VIIRS-NOAA20' | 'VIIRS-SNPP' | 'MODIS-AQUA' | 'MODIS-TERRA';
  latitude: number;
  longitude: number;
  brightnessTempK: number;
  frpMw: number; // Fire Radiative Power in Megawatts
  confidence: 'low' | 'nominal' | 'high';
  acqDate: string;
  acqTime: string;
  dayNight: 'D' | 'N';
  subBasin: string;
  sectorName: string;
  postgisGeomText: string; // ST_AsText(geom) -> POINT(lng lat)
  embeddingGenerated: boolean;
  embeddingDim?: number;
  rawJson?: any;
}

export interface CopernicusDisturbance {
  id: string;
  source: 'COPERNICUS_SAR';
  mission: 'SENTINEL_1_SAR' | 'SENTINEL_2_MSI';
  sectorName: string;
  subBasin: string;
  latitude: number;
  longitude: number;
  polygon: [number, number][]; // Coordinates [lat, lng]
  backscatterDiffDb: number; // Sentinel-1 polarization drop
  coherenceLossPercent: number;
  opticalNdviDropPercent: number;
  affectedAreaHa: number;
  presumedActivity: 'MINERIA_ALUVION_BALSAS' | 'DEFORESTACION_REPENTINA' | 'PISCINA_RELAVES_LODO' | 'PISTA_CLANDESTINA_EXPANSION';
  severity: AlertSeverity;
  postgisGeomText: string; // ST_AsText(geom) -> POLYGON(...)
  embeddingGenerated: boolean;
  embeddingDim?: number;
}

export interface KoboFieldPatrolReport {
  id: string;
  source: 'KOBO_TOOLBOX' | 'ODK_COLLECT';
  formId: string;
  submissionTime: string;
  officerName: string;
  patrolUnit: string;
  riverOrSubBasin: string;
  sectorName: string;
  latitude: number;
  longitude: number;
  category: 'MINERIA_ILEGAL' | 'DEFORESTACION' | 'CONTAMINACION_MERCURIO' | 'PISTA_CLANDESTINA' | 'PATRULLAJE_DE_RUTINA';
  severity: AlertSeverity;
  mercuryDetectedPpm?: number;
  turbidityNtu?: number;
  dredgesConfiscatedCount?: number;
  arrestsCount?: number;
  fuelConfiscatedLiters?: number;
  narrative: string;
  evidencePhotoCount: number;
  postgisGeomText: string;
  embeddingGenerated: boolean;
  embeddingDim?: number;
}

export interface LiveIngestionItem {
  id: string;
  source: IngestionSource;
  title: string;
  timestamp: string;
  sector: string;
  subBasin: string;
  latitude: number;
  longitude: number;
  summary: string;
  severity: AlertSeverity;
  postgisGeom: string;
  embeddingStatus: 'SYNCHRONIZED' | 'PENDING' | 'LOCAL_VECTOR';
  embeddingVectorPreview?: number[];
  attributes: Record<string, any>;
}

export interface VectorRagSearchResult {
  id: string;
  source: IngestionSource | 'SCIENTIFIC_CORPUS';
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  distanceKmFromQueryTarget?: number;
  cosineSimilarity: number; // 0.0 - 1.0
  contentSnippet: string;
  severity: AlertSeverity;
  postgisGeometry: string;
}

export interface RagIntelligenceSynthesis {
  query: string;
  timestamp: string;
  matchesFoundCount: number;
  topMatches: VectorRagSearchResult[];
  synthesisMarkdown: string;
  tacticalRecommendation: string;
  threatMatrix: {
    deforestationRisk: string;
    mercuryExposureRisk: string;
    indigenousTerritoryOverlap: string;
    immediateInterdictionZone: string;
  };
}

export interface ConnectorHealthStatus {
  nasaFirms: {
    status: 'CONNECTED' | 'POLLING_OK' | 'RATE_LIMITED' | 'CONFIGURED';
    lastSync: string;
    totalRecords: number;
    intervalHours: number;
    activeSatellites: string[];
    endpointUrl: string;
  };
  copernicusSar: {
    status: 'CONNECTED' | 'STAC_ACTIVE' | 'CDSE_READY';
    lastSync: string;
    totalDisturbances: number;
    missions: string[];
    endpointUrl: string;
  };
  koboWebhook: {
    status: 'LISTENING' | 'ACTIVE';
    lastSubmission: string;
    totalSubmissions: number;
    webhookPath: string;
  };
  supabasePostgis: {
    status: 'CONNECTED' | 'LOCAL_FALLBACK';
    postgisVersion: string;
    pgvectorVersion: string;
    vectorDimension: number;
    hnswIndexed: boolean;
  };
}

export interface ScientificArticle {
  id: string;
  title: string;
  authors: string;
  year: number;
  source: string;
  abstract: string;
  fullText?: string;
  primaryBasin: string;
  peerReviewed?: boolean;
  classificationReason?: string;
  docType?: 'pdf' | 'url' | 'doi' | 'text';
  doi?: string;
  investigationSites: {
    name: string;
    latitude: number;
    longitude: number;
    findings: string;
    heavyMetalsPpm?: number;
    turbidityNtu?: number;
    deforestationHa?: number;
    ethnicTerritory?: string;
    sampleType?: string;
  }[];
  tags: string[];
}

export interface SarRadarAnomaly {
  id: string;
  code: string;
  sectorName: string;
  basin: string;
  latitude: number;
  longitude: number;
  baselineDate: string; // Sentinel-1 previous pass
  currentPassDate: string; // Sentinel-1 recent pass
  coherenceLossPercent: number; // Coherence drop indicative of ground disturbance
  sarBackscatterChangeDb: number; // Backscatter differential (dB)
  presumedActivity: 'MINERIA_ALUVION_BALSAS' | 'DEFORESTACION_REPENTINA' | 'PISCINA_RELAVES_LODO' | 'PISTA_CLANDESTINA_EXPANSION';
  severity: AlertSeverity;
  affectedSurfaceHa: number;
  opticalNdviDropPercent: number;
  dredgePresenceProbability: number; // 0-100%
  status: 'SUSPICIOUS' | 'CONFIRMED_INTERDICTION' | 'REJECTED_NATURAL';
  notes: string;
}

export interface SyntheticTelemetryConfig {
  basinId: string;
  basinName: string;
  nodeCount: number;
  centerLat: number;
  centerLng: number;
  dispersionRadiusKm: number;
  seasonalRegime: 'ESTIAJE' | 'CRECIDA_INVIERNO' | 'TRANSICION';
  includeHeavyMetalSpike: boolean;
  miningTurbidityShock: boolean;
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: [number, number][][][];
}

export interface GeoJSONFeature<G = GeoJSONPoint | GeoJSONPolygon | GeoJSONMultiPolygon, P = Record<string, any>> {
  type: 'Feature';
  id?: string | number;
  geometry: G;
  properties: P;
}

export interface GeoJSONFeatureCollection<F = GeoJSONFeature> {
  type: 'FeatureCollection';
  features: F[];
}

export interface HeatAnomaly {
  id: string;
  satellite: 'VIIRS-NOAA20' | 'VIIRS-SNPP' | 'MODIS-AQUA' | 'MODIS-TERRA';
  latitude: number;
  longitude: number;
  brightnessTempK: number;
  frpMw: number; // Fire Radiative Power (MW)
  confidence: 'nominal' | 'high' | 'low';
  acqDate: string;
  acqTime: string;
  dayNight: 'D' | 'N';
  sector: string;
  subBasin: string;
}

export interface MiningCluster {
  id: string;
  name: string;
  basin: string;
  latitude: number;
  longitude: number;
  polygon?: [number, number][];
  estimatedHectares: number;
  activityType: 'aluvion_balsa' | 'cielo_abierto' | 'monitoreo_radar_sar';
  severity: AlertSeverity;
  dredgeCountEstimate: number;
  deforestationRate: string;
  firstDetected: string;
  lastVerified: string;
  abraeOverlap?: string;
  indigenousCommunityOverlap?: string;
}

export interface HydrologicalStation {
  id: string;
  name: string;
  river: string;
  coordinates: [number, number];
  currentLevelM: number;
  normalLevelM: number;
  alertLevelM: number;
  criticalLevelM: number;
  flowRateM3s: number;
  turbidityNtu: number;
  ph: number;
  dissolvedOxygenMgL: number;
  mercuryEstimatedPpm: number;
  status: 'OPTIMAL' | 'ELEVATED' | 'ALERT_CRECIDA' | 'ESTIAJE_CRITICO';
  lastTelemetry: string;
}

export interface ProtectedArea {
  id: string;
  name: string;
  category: 'PARQUE_NACIONAL' | 'RESERVA_BIOSFERA' | 'MONUMENTO_NATURAL' | 'TERRITORIO_INDIGENA' | 'RESERVA_FORESTAL';
  surfaceHa: number;
  ethnicGroup?: string;
  coordinates: [number, number][];
  threatIndex: number; // 0-100
  color: string;
}

export interface IncidentReport {
  id: string;
  code: string;
  title: string;
  category: 'MINERIA_ILEGAL' | 'DEFORESTACION' | 'CONTAMINACION_MERCURIO' | 'PISTA_CLANDESTINA' | 'CRECIDA_SUBITA' | 'ALTERCADO_TERRITORIAL';
  severity: AlertSeverity;
  status: 'ACTIVO' | 'EN_VERIFICACION' | 'OPERATIVO_EN_CURSO' | 'RESUELTO' | 'ARCHIVADO';
  latitude: number;
  longitude: number;
  locationName: string;
  description: string;
  reportedBy: string;
  timestamp: string;
  assignedUnit?: string;
  evidenceCount?: number;
}

export interface SupabaseRpcStatus {
  name: string;
  description: string;
  returns: string;
  sampleParams: Record<string, any>;
  lastStatus: 'idle' | 'success' | 'error' | 'pending';
  executionTimeMs?: number;
  responsePreview?: any;
}

// === Sentinel-2 Satellite Ingestion types ===
export interface S2ProductTile {
  id: string;
  productId: string;
  tileId: string; // Grid tile coordinate (e.g. T19PHC, T20PHD, T20PJD)
  satelliteCode: 'S2A' | 'S2B' | 'S2C' | 'S2D';
  sensingTime: string;
  cloudPixelPct: number;
  footprintGeometry: string; // Polygon WKT
  wktText: string;
  downloadStatus: 'PENDING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED';
  ngeoUri: string;
  createdAt: string;
  state: 'Amazonas' | 'Bolivar' | 'Delta Amacuro';
  anomalyDetected: boolean;
  anomalyType?: 'MINERIA_ILEGAL' | 'DEFORESTACION' | 'ESTABLE' | 'SEDIMENTACION';
  affectedAreaHa?: number;
  description?: string;
}

export interface S2TileBand {
  id: string;
  productTileId: string;
  bandName: 'SCL' | 'TCI' | 'B02' | 'B03' | 'B04' | 'B08';
  resolutionM: 10 | 20 | 60;
  filePath: string; // Simulating MinIO / S3 paths (e.g. s3://sentinel-products/.../SCL_20m.jp2)
  fileSizeBytes: number;
  createdAt: string;
}

export interface OrbitSchedule {
  id: string;
  satellite: 'S2A' | 'S2B' | 'S2C' | 'S2D';
  nextPassTime: string;
  targetRegion: string; // Amazonas, Bolivar, Delta Amacuro
  expectedDurationMin: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'IDLE';
  kafkaTopic: string;
}

// === Automated Satellite Scheduler & Supabase Ingestion Types ===
export interface SatelliteScheduledTask {
  key: string; // 'NASA_FIRMS' | 'SENTINEL_1_SAR' | 'SENTINEL_2_MSI' | 'HYDRO_TELEMETRY'
  name: string;
  satelliteMission: string;
  agency: string;
  nominalCadenceText: string;
  nominalIntervalHours: number;
  intervalSeconds: number;
  lastRunAt: string | null;
  nextRunAt: string;
  countdownSeconds: number;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  totalIngested: number;
  supabaseTable: string;
  vectorReady: boolean;
  lastMessage?: string;
}

export interface SchedulerLogEntry {
  id: string;
  timestamp: string;
  taskKey: string;
  satelliteMission: string;
  status: 'SUCCESS' | 'ERROR' | 'RUNNING' | 'WARNING';
  recordsCount: number;
  supabaseSynced: boolean;
  message: string;
  vectorChunkId?: string;
}

export interface SchedulerStatusResponse {
  isRunning: boolean;
  mode: 'PRODUCTION_CADENCE' | 'ACCELERATED_DEMO';
  supabaseConnected: boolean;
  supabaseHost?: string;
  activeTasks: SatelliteScheduledTask[];
  recentLogs: SchedulerLogEntry[];
  totalSatelliteEventsIngested: number;
  vectorRagDocsCount: number;
}

// === Zone Predictive & Perceptive Analytics Types ===
export interface RagIndicatorItem {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  status: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  sourceDatabase: string;
  sourceMission: string;
  description: string;
}

export interface ExplicitDataSource {
  category: string;
  table: string;
  sensorOrProvider: string;
  recordsFound: number;
  description: string;
}

export interface AIModelConfigClient {
  index: number;
  id: string;
  displayName: string;
  family: string;
  dailyQueryQuota: number;
  dailyQueriesUsed: number;
  estimatedTokensUsed: number;
  status: 'ACTIVE' | 'AVAILABLE' | 'TOKENS_EXHAUSTED' | 'QUOTA_EXHAUSTED' | 'COOLING_DOWN';
  lastUsedAt?: string;
  lastError?: string;
}

export interface GeneratingCartographicEvent {
  type: 'MINING_CLUSTER' | 'THERMAL_ANOMALY' | 'HYDRO_ALERT' | 'PROTECTED_AREA' | 'INCIDENT' | 'SENTINEL2_DETECTION' | 'SCIENTIFIC_STUDY';
  typeLabel: string;
  title: string;
  coordinates: { lat: number; lng: number };
  satelliteCoordinates?: string;
  satelliteSensor: string;
  severity?: string;
  description: string;
  details?: any;
}

export interface ZoneAnalyticsResult {
  zoneName: string;
  coordinates: { lat: number; lng: number };
  satelliteLocation?: {
    latitude: number;
    longitude: number;
    formatted: string;
    geohashOrSector?: string;
  };
  generatingEvent?: GeneratingCartographicEvent;
  systemIdentifier?: string;
  evaluationPeriod?: string;
  confidencePercentage?: number;
  issuedAtVenezuela?: string;
  prescriptiveRecommendations?: string[];
  analysisMarkdown: string;
  verdict: 'MINERIA_ILEGAL_CONFIRMADA' | 'MINERIA_PERMISADA_ARCO_MINERO' | 'ZONA_CONSERVACION_SIN_MINERIA';
  verdictLabel: string;
  verdictSummary: string;
  perceptiveSummary: string;
  predictiveSummary: string;
  ragIndicators: RagIndicatorItem[];
  explicitDataSources: ExplicitDataSource[];
  aiExecution: {
    modelUsed: string;
    modelDisplayName: string;
    modelIndex: number;
    engineType: 'gemini_multimodel' | 'tactical_contingency';
    poolStatus: AIModelConfigClient[];
    executionSteps: Array<{
      modelId: string;
      displayName: string;
      index: number;
      attemptTimestamp: string;
      status: string;
      errorMessage?: string;
    }>;
  };
  timestamp: string;
}

