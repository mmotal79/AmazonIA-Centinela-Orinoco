import { ScientificArticle, SarRadarAnomaly } from '../types';

export const INITIAL_SCIENTIFIC_ARTICLES: ScientificArticle[] = [
  {
    id: 'ART-2024-01',
    title: 'Evaluación de bioacumulación de Mercurio (Hg) en tejido piloso de comunidades Yanomami y Ye\'kwana del Alto Caura y Ventuari',
    authors: 'Bello, R., Cárdenas, M., Vegas, O. et al. (Grupo de Toxicología Ambiental IVIC - UCV)',
    year: 2024,
    source: 'Boletín de Investigaciones Ecotoxicológicas de la Amazonía',
    primaryBasin: 'Río Caura / Ventuari',
    abstract: 'Estudio transversal epidemiológico que midió concentraciones de metilmercurio en 14 comunidades ribereñas. Los resultados demuestran que el 92% de las muestras de cabello sobrepasaron el umbral de seguridad de 2.0 ppm recomendado por la OMS, asociadas a la ingesta de peces carnívoros expuestos a sedimentos aluviales removidos por dragas ilegales.',
    peerReviewed: true,
    doi: '10.1016/j.envres.2024.112480',
    classificationReason: 'Artículo indexado y revisado por pares en Elsevier Environmental Research.',
    investigationSites: [
      {
        name: 'Comunidad Ye\'kwana de Kanaracuni (Alto Caura)',
        latitude: 5.485,
        longitude: -64.215,
        findings: '94% de la población muestreada presentó concentraciones de mercurio > 5.5 ppm. Biomarcadores de estrés oxidativo elevados.',
        heavyMetalsPpm: 0.048,
        turbidityNtu: 72,
        ethnicTerritory: 'Pueblo Ye\'kwana',
        sampleType: 'Pelo humano y tejido de Hoplias aimara (Aymara)'
      },
      {
        name: 'Sector Cacurí - Cabeceras del Río Ventuari',
        latitude: 4.862,
        longitude: -65.253,
        findings: 'Detección de amalgamas de mercurio en el sedimento de fondo fluvial y alteración de macrófitas acuáticas.',
        heavyMetalsPpm: 0.039,
        turbidityNtu: 65,
        ethnicTerritory: 'Pueblo Sanema / Ye\'kwana',
        sampleType: 'Sedimento de fondo y aguas superficiales'
      },
      {
        name: 'Confluencia Río Nichare con Río Caura',
        latitude: 6.280,
        longitude: -64.880,
        findings: 'Punto de control downstream con transporte de sólidos suspendidos incrementados en un 310% sobre la línea base histórica.',
        heavyMetalsPpm: 0.022,
        turbidityNtu: 88,
        sampleType: 'Muestreo limnológico de columna de agua'
      }
    ],
    tags: ['Mercurio', 'Ecotoxicología', 'Ye\'kwana', 'Caura', 'Salud Pública']
  },
  {
    id: 'ART-2023-04',
    title: 'Dinámica de deforestación y pérdida de cobertura boscosa en el Parque Nacional Yapacana por minería a cielo abierto e hidrominería',
    authors: 'Observatorio de Ecología Política y Red de Monitoreo Socioambiental SOS Orinoco',
    year: 2023,
    source: 'Revista de Teledetección y Ecología del Escudo Guayanés',
    primaryBasin: 'Alto Orinoco / Yapacana',
    abstract: 'Análisis multitemporal mediante imágenes Landsat 8/9 y radar Sentinel-1 entre 2018 y 2023. Se cuantificó la pérdida de más de 2.200 hectáreas de sabanas de arena blanca y bosques tepuyanos endémicos, localizándose más de 3.800 campamentos e infraestructuras de extracción con motobombas.',
    peerReviewed: false,
    classificationReason: 'Informe técnico de observatorio socioambiental independiente, no indexado ni sometido a revisión formal por pares académicos.',
    investigationSites: [
      {
        name: 'Cerro Yapacana - Falda Norte y Caño Cotúa',
        latitude: 3.755,
        longitude: -66.824,
        findings: 'Área de impacto crítico con 1.450 hectáreas de cobertura desprovista de capa vegetal y 68 piscinas de sedimentación.',
        deforestationHa: 1450,
        heavyMetalsPpm: 0.065,
        turbidityNtu: 120,
        ethnicTerritory: 'Pueblo Piaroa (Uwotjuja) / Curripaco',
        sampleType: 'Teledetección satelital y vuelos UAV de verificación'
      },
      {
        name: 'Desembocadura del Caño Yagua en el Río Orinoco',
        latitude: 3.612,
        longitude: -67.042,
        findings: 'Colmatación de bancos de arena y reducción de la ictiofauna local por turbidez permanente.',
        turbidityNtu: 94,
        heavyMetalsPpm: 0.031,
        sampleType: 'Batimetría de baja profundidad y muestras de agua'
      }
    ],
    tags: ['Yapacana', 'Deforestación', 'SAR', 'Piaroa', 'Parque Nacional']
  },
  {
    id: 'ART-2023-09',
    title: 'Alteración del régimen hidrosedimentológico en la cuenca del Río Caroní: Impacto sobre el Embalse de Guri',
    authors: 'Pérez, E., Morales, J., & Rodríguez, D. (Centro de Hidrología del Sur)',
    year: 2023,
    source: 'Journal of South American Water Resources',
    primaryBasin: 'Río Caroní / Canaima',
    abstract: 'Evaluación del incremento de aporte de sedimentos en la subcuenca del río Ikabarú y cabeceras del Caroní debido a balsas de succión. La acumulación acelerada de limo y arenas en la cola del embalse de Guri compromete la vida útil de los grupos generadores hidroeléctricos de la Central Raúl Leoni.',
    peerReviewed: true,
    doi: '10.1007/s11269-023-03482-1',
    classificationReason: 'Estudio de dinámica hidrológica arbitrado publicado en Springer Water Resources Management.',
    investigationSites: [
      {
        name: 'Sector Minero Ikabarú - Quebrada Caroní Superior',
        latitude: 4.341,
        longitude: -61.735,
        findings: 'Remoción estimada de 450.000 m³ de suelo aluvial anuales vertidos al curso fluvial sin filtros decantadores.',
        deforestationHa: 380,
        turbidityNtu: 145,
        ethnicTerritory: 'Pueblo Pemón',
        sampleType: 'Aforos líquidos y sólidos con molinete hidrométrico'
      },
      {
        name: 'Estación de Medición Aforos San Salvador de Paúl',
        latitude: 5.512,
        longitude: -62.890,
        findings: 'Tasa de sedimentación 4.2 veces superior al promedio climatológico de la década 2000-2010.',
        turbidityNtu: 58,
        sampleType: 'Estación hidrosedimentológica continua'
      }
    ],
    tags: ['Caroní', 'Guri', 'Sedimentos', 'Pemón', 'Ikabarú']
  }
];

export const INITIAL_SAR_RADAR_ANOMALIES: SarRadarAnomaly[] = [
  {
    id: 'SAR-2026-081',
    code: 'SAR-YAP-081',
    sectorName: 'Sector Caño Cotúa - Falda Noroccidental Yapacana',
    basin: 'Alto Orinoco / Yapacana',
    latitude: 3.792,
    longitude: -66.861,
    baselineDate: '2026-07-28',
    currentPassDate: '2026-08-25',
    coherenceLossPercent: 78.4,
    sarBackscatterChangeDb: -4.8,
    presumedActivity: 'MINERIA_ALUVION_BALSAS',
    severity: 'CRITICAL',
    affectedSurfaceHa: 42.5,
    opticalNdviDropPercent: 62.0,
    dredgePresenceProbability: 95,
    status: 'CONFIRMED_INTERDICTION',
    notes: 'Pérdida abrupta de coherencia interferométrica Sentinel-1 VV/VH. Firma típica de remoción de sustrato y apertura de canal para 4 balsas de dragado.'
  },
  {
    id: 'SAR-2026-094',
    code: 'SAR-CAU-094',
    sectorName: 'Meandro Río Nichare - Reserva Forestal Caura',
    basin: 'Río Caura',
    latitude: 6.182,
    longitude: -64.724,
    baselineDate: '2026-08-02',
    currentPassDate: '2026-08-26',
    coherenceLossPercent: 64.2,
    sarBackscatterChangeDb: 5.2, // Strong double-bounce backscatter typical of metal structures / dredges on water
    presumedActivity: 'MINERIA_ALUVION_BALSAS',
    severity: 'HIGH',
    affectedSurfaceHa: 18.0,
    opticalNdviDropPercent: 35.5,
    dredgePresenceProbability: 88,
    status: 'SUSPICIOUS',
    notes: 'Anomalía de retrodispersión positiva (efecto doble rebote sobre agua) compatible con aglomeración de estructuras metálicas fluviales flotantes.'
  },
  {
    id: 'SAR-2026-103',
    code: 'SAR-VEN-103',
    sectorName: 'Alto Ventuari - Caño Asisa',
    basin: 'Río Ventuari',
    latitude: 4.915,
    longitude: -65.412,
    baselineDate: '2026-08-10',
    currentPassDate: '2026-08-28',
    coherenceLossPercent: 82.0,
    sarBackscatterChangeDb: -6.1,
    presumedActivity: 'DEFORESTACION_REPENTINA',
    severity: 'HIGH',
    affectedSurfaceHa: 56.2,
    opticalNdviDropPercent: 74.3,
    dredgePresenceProbability: 60,
    status: 'SUSPICIOUS',
    notes: 'Patrón de desmonte radial en bosque ripario contiguo a territorio de caza ancestral Sanema. Coincide con foco térmico VIIRS detectado hace 48 horas.'
  },
  {
    id: 'SAR-2026-118',
    code: 'SAR-IKA-118',
    sectorName: 'Cabeceras Río Ikabarú - Quebrada Uaiparú',
    basin: 'Río Caroní',
    latitude: 4.310,
    longitude: -61.765,
    baselineDate: '2026-08-05',
    currentPassDate: '2026-08-29',
    coherenceLossPercent: 71.5,
    sarBackscatterChangeDb: -3.9,
    presumedActivity: 'PISCINA_RELAVES_LODO',
    severity: 'CRITICAL',
    affectedSurfaceHa: 31.8,
    opticalNdviDropPercent: 58.0,
    dredgePresenceProbability: 92,
    status: 'CONFIRMED_INTERDICTION',
    notes: 'Aparición de cuerpos de agua turbios estancados de forma geométrica artificial (piscinas de relave minero con motobombas).'
  },
  {
    id: 'SAR-2026-125',
    code: 'SAR-ATB-125',
    sectorName: 'Eje Fluvial Atabapo - Caño Caname',
    basin: 'Río Atabapo',
    latitude: 3.884,
    longitude: -67.590,
    baselineDate: '2026-08-12',
    currentPassDate: '2026-08-30',
    coherenceLossPercent: 55.0,
    sarBackscatterChangeDb: 3.4,
    presumedActivity: 'PISTA_CLANDESTINA_EXPANSION',
    severity: 'MEDIUM',
    affectedSurfaceHa: 12.0,
    opticalNdviDropPercent: 44.0,
    dredgePresenceProbability: 40,
    status: 'SUSPICIOUS',
    notes: 'Firma lineal de 850m despejada a través de bosque inundable, sugestiva de corredor de aterrizaje no autorizado o trocha de tránsito.'
  }
];
