export interface SatelliteApiConnection {
  id: string;
  name: string;
  agency: string;
  category: 'THERMAL_INFRARED' | 'SAR_RADAR' | 'MULTISPECTRAL_OPTICAL' | 'FOREST_ALERTS' | 'REGIONAL_BASIN' | 'INTERNAL_PIPELINE';
  sensorMissions: string[];
  activeUrl: string;
  baseUrlTemplate: string;
  documentationUrl: string;
  updateFrequency: string;
  spatialResolution: string;
  amazonBoundingBox: {
    west: number;
    south: number;
    east: number;
    north: number;
    bboxString: string;
  };
  authType: 'MAP_KEY_PARAM' | 'BEARER_TOKEN_OAUTH2' | 'BASIC_AUTH' | 'PUBLIC_NO_AUTH' | 'INTERNAL_PROXY';
  description: string;
  payloadFormat: 'CSV' | 'GEOJSON' | 'JSON' | 'NETCDF' | 'GEOTIFF';
  sampleCurlCommand: string;
  queryParameters: {
    name: string;
    description: string;
    example: string;
  }[];
}

/**
 * Directorio Oficial de APIs de Conexiones Satelitales utilizadas en Centinela Orinoco
 * Enfocadas en el monitoreo de la Amazonía Venezolana y Guayana (Amazonas, Bolívar, Delta Amacuro, Esequibo)
 */
export const SATELLITE_API_CONNECTIONS: SatelliteApiConnection[] = [
  {
    id: 'NASA_FIRMS_VIIRS_NOAA20',
    name: 'NASA FIRMS - VIIRS NOAA-20 NRT Fire & Thermal Anomalies API',
    agency: 'NASA Earthdata / LANCE FIRMS',
    category: 'THERMAL_INFRARED',
    sensorMissions: ['VIIRS (Suomi-NPP & NOAA-20)', 'MODIS (Terra & Aqua)'],
    activeUrl: 'https://firms.modaps.eosdis.nasa.gov/api/country/csv/[API_KEY]/VIIRS_NOAA20_NRT/VEN/1',
    baseUrlTemplate: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{WEST,SOUTH,EAST,NORTH}/{DAY_RANGE}',
    documentationUrl: 'https://firms.modaps.eosdis.nasa.gov/api/data_specs/',
    updateFrequency: 'Cada 3 horas (NRT - Near Real Time)',
    spatialResolution: '375 metros (I-Band 375m VIIRS)',
    amazonBoundingBox: {
      west: -68.5,
      south: 0.5,
      east: -58.5,
      north: 10.2,
      bboxString: '-68.5,0.5,-58.5,10.2',
    },
    authType: 'MAP_KEY_PARAM',
    description: 'Ingesta continua de anomalías térmicas y focos de calor activos causados por hornos de fundición minera, deforestación por tala y quema y campamentos en la selva.',
    payloadFormat: 'CSV',
    sampleCurlCommand: 'curl -X GET "https://firms.modaps.eosdis.nasa.gov/api/area/csv/YOUR_MAP_KEY/VIIRS_NOAA20_NRT/-68.5,0.5,-58.5,10.2/1"',
    queryParameters: [
      { name: 'MAP_KEY', description: 'Clave de acceso gratuita emitida por NASA Earthdata LANCE', example: 'd8a39f1c7e...' },
      { name: 'SOURCE', description: 'Sensor satelital (VIIRS_NOAA20_NRT, VIIRS_SNPP_NRT, MODIS_NRT)', example: 'VIIRS_NOAA20_NRT' },
      { name: 'AREA_COORDINATES', description: 'Bounding Box geográfico [W,S,E,N] de la Amazonía venezolana', example: '-68.5,0.5,-58.5,10.2' },
      { name: 'DAY_RANGE', description: 'Número de días retrospectivos a consultar (1 a 10)', example: '1' }
    ]
  },
  {
    id: 'NASA_FIRMS_WMS_GEOJSON',
    name: 'NASA FIRMS WMS / OGC GeoServices Layer',
    agency: 'NASA GIBS (Global Imagery Browse Services)',
    category: 'THERMAL_INFRARED',
    sensorMissions: ['VIIRS 375m Active Fire', 'MODIS Thermal Anomaly 1km'],
    activeUrl: 'https://firms.modaps.eosdis.nasa.gov/mapserver/wms/firms/[API_KEY]/?SERVICE=WMS&REQUEST=GetMap&LAYERS=fires_viirs_noaa20_24&BBOX=-68.5,0.5,-58.5,10.2&WIDTH=1024&HEIGHT=768&FORMAT=image/png',
    baseUrlTemplate: 'https://firms.modaps.eosdis.nasa.gov/mapserver/wms/firms/{MAP_KEY}/',
    documentationUrl: 'https://firms.modaps.eosdis.nasa.gov/web-services/',
    updateFrequency: 'Tiempo casi real (Streaming WMS/WFS)',
    spatialResolution: '375m / Vectorial',
    amazonBoundingBox: {
      west: -68.5,
      south: 0.5,
      east: -58.5,
      north: 10.2,
      bboxString: '-68.5,0.5,-58.5,10.2',
    },
    authType: 'MAP_KEY_PARAM',
    description: 'Servicio Web Cartográfico OGC (WMS/WFS) para renderizado rasterizado superpuesto sobre capas tácticas Leaflet y QGIS.',
    payloadFormat: 'GEOJSON',
    sampleCurlCommand: 'curl -X GET "https://firms.modaps.eosdis.nasa.gov/api/v2/nrt/fire_alerts/geojson?country=VEN&date_range=1&key=YOUR_MAP_KEY"',
    queryParameters: [
      { name: 'LAYERS', description: 'Capa seleccionada (fires_viirs_noaa20_24, fires_modis_24)', example: 'fires_viirs_noaa20_24' },
      { name: 'BBOX', description: 'Coordenadas del visor espacial', example: '-68.5,0.5,-58.5,10.2' },
      { name: 'CRS', description: 'Sistema de referencia de coordenadas', example: 'EPSG:4326' }
    ]
  },
  {
    id: 'COPERNICUS_CDSE_SENTINEL1_SAR',
    name: 'Copernicus Data Space Ecosystem (CDSE) - Sentinel-1 SAR Catalogue API',
    agency: 'Agencia Espacial Europea (ESA) / Unión Europea',
    category: 'SAR_RADAR',
    sensorMissions: ['Sentinel-1A / Sentinel-1C (Banda C SAR, Polarización Dual VV+VH)'],
    activeUrl: 'https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel1/search.json?box=-68.5,0.5,-58.5,10.2&productType=GRD&sensorMode=IW',
    baseUrlTemplate: 'https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel1/search.json?{QUERY_PARAMS}',
    documentationUrl: 'https://dataspace.copernicus.eu/analyse/apis/opensearch',
    updateFrequency: 'Cada 6 a 12 días por pasada orbital',
    spatialResolution: '10 metros (GRD Ground Range Detected - Interferometric Wide)',
    amazonBoundingBox: {
      west: -68.5,
      south: 0.5,
      east: -58.5,
      north: 10.2,
      bboxString: '-68.5,0.5,-58.5,10.2',
    },
    authType: 'BEARER_TOKEN_OAUTH2',
    description: 'Catálogo e índice de pasadas de radar de apertura sintética (SAR). Penetra la nubosidad perpetua de la selva amazónica para detectar desmonte, pistas clandestinas y dragado aluvial.',
    payloadFormat: 'JSON',
    sampleCurlCommand: 'curl -X GET "https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel1/search.json?box=-68.5,0.5,-58.5,10.2&productType=GRD&startDate=2026-08-01T00:00:00Z"',
    queryParameters: [
      { name: 'box', description: 'Bounding box en grados decimales [W,S,E,N]', example: '-68.5,0.5,-58.5,10.2' },
      { name: 'productType', description: 'Nivel de procesamiento (GRD, SLC, OCN)', example: 'GRD' },
      { name: 'sensorMode', description: 'Modo del sensor (IW = Interferometric Wide Swath)', example: 'IW' },
      { name: 'polarisation', description: 'Polarización dual radar (VV+VH)', example: 'VV VH' }
    ]
  },
  {
    id: 'COPERNICUS_SENTINEL_HUB_PROCESS',
    name: 'Sentinel Hub Process API (Copernicus CDSE Statistical & Custom Script Engine)',
    agency: 'ESA / Planet / Sinergise',
    category: 'SAR_RADAR',
    sensorMissions: ['Sentinel-1 SAR Backscatter', 'Sentinel-2 L2A Optical NDVI/NDRE'],
    activeUrl: 'https://sh.dataspace.copernicus.eu/api/v1/process',
    baseUrlTemplate: 'https://sh.dataspace.copernicus.eu/api/v1/process',
    documentationUrl: 'https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html',
    updateFrequency: 'Bajo demanda (Procesamiento analítico en la nube)',
    spatialResolution: '10 metros',
    amazonBoundingBox: {
      west: -68.5,
      south: 0.5,
      east: -58.5,
      north: 10.2,
      bboxString: '-68.5,0.5,-58.5,10.2',
    },
    authType: 'BEARER_TOKEN_OAUTH2',
    description: 'API de procesamiento en tiempo real para generar ortofotos SAR calibradas en decibelios (gamma0 / sigma0) y máscaras de deforestación mediante scripts Evalscript.',
    payloadFormat: 'GEOTIFF',
    sampleCurlCommand: 'curl -X POST "https://sh.dataspace.copernicus.eu/api/v1/process" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d \'{"input":{"bounds":{"bbox":[-66.9,3.6,-66.6,3.9]}}}\'',
    queryParameters: [
      { name: 'Authorization', description: 'Token de sesión OAuth2 obtenido en identity.dataspace.copernicus.eu', example: 'Bearer eyJhbGciOi...' },
      { name: 'evalscript', description: 'Script JavaScript para cálculo de retrodispersión dB o NDVI', example: '//version=3\nfunction evaluatePixel(s){return [s.VV, s.VH];}' }
    ]
  },
  {
    id: 'INPE_QUEIMADAS_AMAZONIA',
    name: 'INPE Programa Queimadas - API Monitoramento de Focos e Cicatrizes da Amazônia',
    agency: 'Instituto Nacional de Pesquisas Espaciais (INPE - Brasil)',
    category: 'REGIONAL_BASIN',
    sensorMissions: ['AQUA_M-T', 'TERRA_M-T', 'NPP-375', 'NOAA-20', 'GOES-16'],
    activeUrl: 'https://queimadas.dgi.inpe.br/api/focos/?pais_id=233',
    baseUrlTemplate: 'https://queimadas.dgi.inpe.br/api/focos/?pais_id={PAIS_ID}&estado_id={ESTADO_ID}',
    documentationUrl: 'https://queimadas.dgi.inpe.br/queimadas/portal/informacoes/perguntas-frequentes/',
    updateFrequency: 'Cada 1 hora (Integración regional cuenca amazónica)',
    spatialResolution: '375m a 1km',
    amazonBoundingBox: {
      west: -68.5,
      south: 0.5,
      east: -58.5,
      north: 10.2,
      bboxString: '-68.5,0.5,-58.5,10.2',
    },
    authType: 'PUBLIC_NO_AUTH',
    description: 'API abierta del INPE para la vigilancia transfronteriza de la Panamazonía, correlacionando datos térmicos del sur de Venezuela (Amazonas y Bolívar) con la cuenca norte de Brasil y Colombia.',
    payloadFormat: 'JSON',
    sampleCurlCommand: 'curl -X GET "https://queimadas.dgi.inpe.br/api/focos/?pais_id=233"',
    queryParameters: [
      { name: 'pais_id', description: 'Código de país oficial (233 = Venezuela)', example: '233' },
      { name: 'horas', description: 'Ventana de horas pasadas', example: '24' }
    ]
  },
  {
    id: 'GFW_GLAD_DEFORESTATION_ALERTS',
    name: 'Global Forest Watch (GFW) - Integrated Deforestation Alerts API',
    agency: 'World Resources Institute (WRI) / University of Maryland (UMD)',
    category: 'FOREST_ALERTS',
    sensorMissions: ['GLAD-L (Landsat)', 'GLAD-S2 (Sentinel-2)', 'RADD (Radar SAR Alert)'],
    activeUrl: 'https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query?sql=SELECT count(*) FROM data WHERE country=\'VEN\'',
    baseUrlTemplate: 'https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query?sql={SQL_QUERY}',
    documentationUrl: 'https://www.globalforestwatch.org/help/developers/',
    updateFrequency: 'Semanal / Diaria',
    spatialResolution: '10 a 30 metros',
    amazonBoundingBox: {
      west: -68.5,
      south: 0.5,
      east: -58.5,
      north: 10.2,
      bboxString: '-68.5,0.5,-58.5,10.2',
    },
    authType: 'BEARER_TOKEN_OAUTH2',
    description: 'Alertas tempranas de pérdida de cobertura de bosque primario que combinan radar SAR y sensores ópticos sobre áreas protegidas (ABRAE).',
    payloadFormat: 'JSON',
    sampleCurlCommand: 'curl -X GET "https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query?sql=SELECT * FROM data WHERE latitude BETWEEN 0.5 AND 10.0 AND longitude BETWEEN -68.5 AND -58.5 LIMIT 100"',
    queryParameters: [
      { name: 'sql', description: 'Consulta SQL espacial compatible con PostGIS', example: 'SELECT * FROM data WHERE country=\'VEN\' AND adm1=\'Amazonas\'' }
    ]
  },
  {
    id: 'COPERNICUS_CDSE_SENTINEL2_MSI',
    name: 'Copernicus Data Space Ecosystem (CDSE) - Sentinel-2 MSI L2A Multispectral API',
    agency: 'Agencia Espacial Europea (ESA) / Unión Europea',
    category: 'MULTISPECTRAL_OPTICAL',
    sensorMissions: ['Sentinel-2A / Sentinel-2B / Sentinel-2C (Multispectral Instrument - 13 Bandas Espectrales)'],
    activeUrl: 'https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=OData.CSC.Intersects(area=geography\'SRID=4326;POLYGON((-67.5 3.5, -61.5 3.5, -61.5 9.5, -67.5 9.5, -67.5 3.5))\') and Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq \'cloudCover\' and att/Value le 20.0)',
    baseUrlTemplate: 'https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter={SPATIAL_INTERSECTION} and {CLOUD_COVER_FILTER}',
    documentationUrl: 'https://dataspace.copernicus.eu/analyse/apis/odata',
    updateFrequency: 'Cada 5 días por pasada orbital',
    spatialResolution: '10 metros (Bandas B02, B03, B04, B08), 20 metros (B11, B12, SCL)',
    amazonBoundingBox: {
      west: -67.5,
      south: 3.5,
      east: -61.5,
      north: 9.5,
      bboxString: '-67.5,3.5,-61.5,9.5',
    },
    authType: 'BEARER_TOKEN_OAUTH2',
    description: 'Catálogo de imágenes ópticas multiespectrales para la evaluación de cobertura de bosque primario, turbidez de cuerpos de agua por lavado de oro (sedimentos) y clasificación de escenas (SCL) en la Amazonía venezolana.',
    payloadFormat: 'JSON',
    sampleCurlCommand: 'curl -X GET "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=OData.CSC.Intersects(area=geography\'SRID=4326;POLYGON((-67.5 3.5, -66.5 3.5, -66.5 4.5, -67.5 4.5, -67.5 3.5))\')"',
    queryParameters: [
      { name: 'OData.CSC.Intersects', description: 'Intersección geográfica utilizando objetos geography OGC WKT', example: 'geography\'SRID=4326;POLYGON(...)\'' },
      { name: 'cloudCover', description: 'Porcentaje máximo de cobertura de nubes permitido', example: '20.0' },
      { name: 'sensingStartDate', description: 'Filtro temporal para fecha de inicio de captura satelital', example: '2026-08-01T00:00:00.000Z' }
    ]
  },
  {
    id: 'CENTINELA_INTERNAL_INGESTION_PROXY',
    name: 'Centinela Orinoco Ingestion Engine & PostGIS Dispatcher (Backend Proxy)',
    agency: 'Centinela Orinoco Local Pipeline / Node Express Server',
    category: 'INTERNAL_PIPELINE',
    sensorMissions: ['Proxy Multi-Sensor NASA FIRMS', 'Proxy ESA Copernicus SAR', 'Webhook KoboToolbox / ODK'],
    activeUrl: '/api/ingestion/nasa-firms/fetch',
    baseUrlTemplate: '/api/ingestion/{SOURCE}/fetch',
    documentationUrl: '/api/health',
    updateFrequency: 'Pipeline en tiempo real con disparadores automáticos y manuales',
    spatialResolution: 'Geometrías nativas PostGIS (Point / Polygon WGS84 EPSG:4326)',
    amazonBoundingBox: {
      west: -68.5,
      south: 0.5,
      east: -58.5,
      north: 10.2,
      bboxString: '-68.5,0.5,-58.5,10.2',
    },
    authType: 'INTERNAL_PROXY',
    description: 'Rutas de API internas del servidor de Centinela Orinoco que protegen las credenciales de NASA y Copernicus, ejecutan indexación espacial PostGIS y generan embeddings vectoriales con Gemini 3.x.',
    payloadFormat: 'JSON',
    sampleCurlCommand: 'curl -X POST "http://localhost:3000/api/ingestion/nasa-firms/fetch"',
    queryParameters: [
      { name: 'POST /api/ingestion/nasa-firms/fetch', description: 'Ejecuta sondeo y almacenamiento en PostGIS de focos VIIRS/MODIS', example: '{}' },
      { name: 'POST /api/ingestion/copernicus/fetch', description: 'Ejecuta barrido de firmas de radar Sentinel-1 SAR', example: '{}' },
      { name: 'POST /api/webhooks/kobo', description: 'Recibe minutas de patrullaje fluvial de Guardería Ambiental', example: '{"officerName":"Cap. Marcos Alfonzo"}' },
      { name: 'POST /api/rag/vector-search', description: 'Búsqueda híbrida semántica pgvector + ST_DWithin geodésico', example: '{"query":"Balsas en Atabapo"}' }
    ]
  }
];
