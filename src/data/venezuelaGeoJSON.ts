/**
 * LÍMITES SOBERANOS Y POLÍGONO TERRITORIAL DE VENEZUELA Y GUAYANA ESEQUIBA
 * Enfoque prioritario: Amazonía Venezolana (Amazonas, Bolívar, Delta Amacuro y Guayana Esequiba).
 */

export interface StrategicLandmark {
  name: string;
  lat: number;
  lng: number;
  type: 'HITO_FRONTERIZO' | 'ISLA_FLUVIAL' | 'CABECERA_RIO' | 'BASE_AEREA_SUR' | 'RESERVA_BIOLOGICA';
}

export const VENEZUELA_STRATEGIC_LANDMARKS: StrategicLandmark[] = [
  { name: "Hito Trifinio San Carlos de Río Negro (VZ-CO-BR)", lat: 1.920, lng: -67.060, type: "HITO_FRONTERIZO" },
  { name: "Cerro Delgado Chalbaud (Nacimiento del Río Orinoco)", lat: 2.310, lng: -63.360, type: "CABECERA_RIO" },
  { name: "Piedra del Cocuy (Límite Sur Extremo)", lat: 1.235, lng: -66.820, type: "HITO_FRONTERIZO" },
  { name: "Cerro Yapacana (Monumento Natural)", lat: 3.755, lng: -66.824, type: "RESERVA_BIOLOGICA" },
  { name: "Cerro Autana (Monumento Natural)", lat: 4.860, lng: -67.450, type: "RESERVA_BIOLOGICA" },
  { name: "Base Aérea Tumeremo (Eje Sifontes)", lat: 7.290, lng: -61.500, type: "BASE_AEREA_SUR" },
  { name: "Isla de Ankoko (Río Cuyuní)", lat: 6.720, lng: -61.140, type: "ISLA_FLUVIAL" },
  { name: "Hito Monte Roraima (Trifinio VZ-BR-GUAYANA)", lat: 5.200, lng: -60.760, type: "HITO_FRONTERIZO" },
  { name: "Punta Playa (Límite Norte Guayana Esequiba)", lat: 8.550, lng: -59.980, type: "HITO_FRONTERIZO" },
  { name: "Boca Grande del Orinoco (Salida Atlántica)", lat: 8.650, lng: -60.400, type: "ISLA_FLUVIAL" }
];

export const VENEZUELA_FULL_BOUNDARY_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "venezuela-amazonia-guayana-continental",
      properties: {
        name: "Amazonía Venezolana y Escudo Guayanés (Continental)",
        category: "TERRITORIO_NACIONAL",
        description: "Territorio Continental Integral del Sur: Estados Amazonas, Bolívar y Delta Amacuro."
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          // Perímetro exterior exacto de Amazonas, Bolívar y Delta Amacuro
          [-67.62, 5.66],
          [-66.16, 7.63],
          [-65.00, 7.80],
          [-63.55, 8.12],
          [-62.70, 8.30],
          [-62.30, 8.50],
          [-62.50, 9.20],
          [-62.20, 9.95],
          [-61.80, 10.05],
          [-61.20, 9.70],
          [-60.60, 9.10],
          [-60.20, 8.70],
          [-59.98, 8.55],
          [-60.40, 8.10],
          [-60.75, 7.20],
          [-61.14, 6.72],
          [-60.90, 6.00],
          [-60.76, 5.20],
          [-61.10, 4.60],
          [-62.00, 4.30],
          [-62.80, 4.50],
          [-63.50, 3.80],
          [-63.36, 2.31],
          [-63.80, 1.90],
          [-64.50, 1.40],
          [-65.30, 1.00],
          [-66.10, 0.75],
          [-66.82, 1.235],
          [-67.06, 1.92],
          [-67.25, 2.50],
          [-67.55, 3.10],
          [-67.80, 3.75],
          [-67.85, 4.50],
          [-67.92, 5.10],
          [-67.62, 5.66]
        ]]
      }
    },
    {
      type: "Feature",
      id: "guayana-esequiba-territorio",
      properties: {
        name: "Guayana Esequiba (Zona en Reclamación)",
        regionName: "Guayana Esequiba",
        category: "ZONA_EN_RECLAMACION",
        description: "Territorio sujeto al Acuerdo de Ginebra de 1966 (159.542 km²)."
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-59.98, 8.55],
          [-59.50, 8.30],
          [-59.00, 7.80],
          [-58.40, 7.20],
          [-58.20, 6.85],
          [-58.50, 6.20],
          [-58.60, 5.20],
          [-58.50, 4.20],
          [-58.60, 3.10],
          [-58.80, 1.60],
          [-59.50, 1.50],
          [-59.90, 2.20],
          [-60.20, 3.40],
          [-60.50, 4.20],
          [-60.76, 5.20],
          [-60.90, 6.00],
          [-61.14, 6.72],
          [-60.75, 7.20],
          [-60.40, 8.10],
          [-59.98, 8.55]
        ]]
      }
    }
  ]
};
