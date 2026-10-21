import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  INITIAL_HEAT_ANOMALIES, 
  INITIAL_MINING_CLUSTERS, 
  INITIAL_HYDROLOGICAL_STATIONS, 
  INITIAL_PROTECTED_AREAS, 
  INITIAL_INCIDENT_REPORTS 
} from '../data/mockGeoJSON';
import { HeatAnomaly, MiningCluster, HydrologicalStation, ProtectedArea, IncidentReport } from '../types';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Normalize URL: remove any trailing /rest/v1 or trailing slashes to avoid double-slash or routing errors
export const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseAnonKey = rawSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
  : null;

/**
 * Service Layer para invocar las RPCs compiladas en PostgreSQL/Supabase
 * con fallback geoespacial GeoJSON.
 */
export const SupabaseRpcService = {
  /**
   * RPC: get_heat_anomalies_geojson
   */
  async getHeatAnomalies(params?: { minConfidence?: string; limit?: number }): Promise<{
    data: HeatAnomaly[];
    source: 'supabase_rpc' | 'local_geojson';
    error?: string;
  }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_heat_anomalies_geojson', {
          p_min_confidence: params?.minConfidence || 'low',
          p_limit: params?.limit || 1000
        });

        if (!error && data) {
          // Si retorna FeatureCollection o array
          const parsed = Array.isArray(data) ? data : data.features?.map((f: any) => {
            const coords = f.geometry?.coordinates || [];
            return {
              ...f.properties,
              sector: f.properties.sector || f.properties.sector_name || f.properties.location || 'Sector Amazónico',
              subBasin: f.properties.subBasin || f.properties.sub_basin || 'Cuenca del Orinoco',
              latitude: f.properties.latitude ?? coords[1],
              longitude: f.properties.longitude ?? coords[0],
            };
          }) || [];
          if (parsed.length > 0) {
            return { data: parsed, source: 'supabase_rpc' };
          }
        }

        // Consulta directa a tabla nasa_firms_hotspots en Supabase
        const { data: tableData, error: tableErr } = await supabase
          .from('nasa_firms_hotspots')
          .select('*')
          .order('created_at', { ascending: false });

        if (!tableErr && tableData && tableData.length > 0) {
          const mapped: HeatAnomaly[] = tableData.map((t: any) => ({
            id: t.firms_id || t.id,
            sector: t.sector_name || `Anomalía Térmica ${t.satellite}`,
            subBasin: t.sub_basin || 'Amazonía Venezolana',
            latitude: t.latitude,
            longitude: t.longitude,
            brightnessTempK: t.brightness_temp_k,
            frpMw: t.frp_mw,
            confidence: (t.confidence === 'h' || t.confidence === 'high') ? 'high' : ((t.confidence === 'l' || t.confidence === 'low') ? 'low' : 'nominal'),
            acqDate: t.acq_date,
            acqTime: t.acq_time,
            satellite: t.satellite || 'VIIRS-NOAA20',
            dayNight: (t.day_night === 'N' ? 'N' : 'D'),
          }));
          return { data: mapped, source: 'supabase_rpc' };
        }
      } catch (err: any) {
        console.warn('Fallo llamada RPC get_heat_anomalies_geojson, usando caché local:', err);
      }
    }
    return { data: INITIAL_HEAT_ANOMALIES, source: 'local_geojson' };
  },

  /**
   * Conteo exacto en tiempo real de focos térmicos almacenados en Supabase
   */
  async getRealThermalHotspotsCount(): Promise<number> {
    if (supabase) {
      try {
        const { count, error } = await supabase
          .from('nasa_firms_hotspots')
          .select('*', { count: 'exact', head: true });
        if (!error && typeof count === 'number') {
          return count;
        }
      } catch (e) {
        console.warn('Error contando focos en Supabase:', e);
      }
    }
    return 0;
  },

  /**
   * RPC: get_mining_clusters_geojson
   */
  async getMiningClusters(params?: { basinId?: string; minSeverity?: string }): Promise<{
    data: MiningCluster[];
    source: 'supabase_rpc' | 'local_geojson';
    error?: string;
  }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_mining_clusters_geojson', {
          p_basin_id: params?.basinId || null,
          p_min_severity: params?.minSeverity || 'LOW'
        });

        if (!error && data) {
          const parsed = Array.isArray(data) ? data : data.features?.map((f: any) => f.properties) || [];
          return { data: parsed.length > 0 ? parsed : INITIAL_MINING_CLUSTERS, source: 'supabase_rpc' };
        }
      } catch (err: any) {
        console.warn('Fallo llamada RPC get_mining_clusters_geojson:', err);
      }
    }
    return { data: INITIAL_MINING_CLUSTERS, source: 'local_geojson' };
  },

  /**
   * RPC & Live Table: get_hydrological_telemetry
   * Carga los 4 nodos de estudio registrados de INAMEH cruzados con Sentinel-2 y Sentinel-3
   * directamente desde Supabase hydrological_telemetry_readings
   */
  async getHydrologicalTelemetry(stationId?: string): Promise<{
    data: HydrologicalStation[];
    source: 'supabase_rpc' | 'supabase_table' | 'api_backend' | 'local_geojson';
    error?: string;
  }> {
    // 1. Intento primario: Endpoint backend /api/telemetry/stations que consulta directamente Supabase
    try {
      const res = await fetch('/api/telemetry/stations');
      if (res.ok) {
        const json = await res.json();
        if (json.stations && Array.isArray(json.stations) && json.stations.length > 0) {
          const list = stationId ? json.stations.filter((s: HydrologicalStation) => s.id === stationId) : json.stations;
          return { data: list, source: 'api_backend' };
        }
      }
    } catch (e) {
      // Continuar con consulta directa a Supabase
    }

    // 2. Consulta directa a Supabase (tabla hydrological_telemetry_readings)
    if (supabase) {
      try {
        const { data: rows, error: tblErr } = await supabase
          .from('hydrological_telemetry_readings')
          .select('*')
          .order('reading_time', { ascending: false });

        if (!tblErr && rows && rows.length > 0) {
          const latestMap = new Map<string, any>();
          rows.forEach((r: any) => {
            if (!latestMap.has(r.station_name)) latestMap.set(r.station_name, r);
          });

          const mapped: HydrologicalStation[] = Array.from(latestMap.values()).map((r: any) => {
            const baseMatch = INITIAL_HYDROLOGICAL_STATIONS.find(s => 
              s.name.toLowerCase().includes(r.station_name.toLowerCase()) || 
              r.station_name.toLowerCase().includes(s.name.toLowerCase())
            ) || INITIAL_HYDROLOGICAL_STATIONS[0];

            return {
              ...baseMatch,
              id: baseMatch.id,
              name: r.station_name,
              river: r.river_name || baseMatch.river,
              coordinates: [Number(r.longitude) || baseMatch.coordinates[0], Number(r.latitude) || baseMatch.coordinates[1]],
              currentLevelM: Number(r.stage_level_m) || baseMatch.currentLevelM,
              turbidityNtu: Number(r.turbidity_ntu) || baseMatch.turbidityNtu,
              mercuryEstimatedPpm: Number(r.estimated_mercury_ppm) || baseMatch.mercuryEstimatedPpm,
              status: (r.alert_status === 'CRITICAL' ? 'ALERT_CRECIDA' : (r.alert_status === 'ELEVATED' ? 'ELEVATED' : 'OPTIMAL')) as any,
              lastTelemetry: r.reading_time ? `${new Date(r.reading_time).toISOString().slice(0, 10)} ${new Date(r.reading_time).toTimeString().slice(0, 5)} UTC (Supabase / INAMEH)` : baseMatch.lastTelemetry,
            };
          });

          const filtered = stationId ? mapped.filter(s => s.id === stationId) : mapped;
          return { data: filtered, source: 'supabase_table' };
        }

        // Intento RPC si existe
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_hydrological_telemetry', {
          p_station_id: stationId || null
        });

        if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          return { data: rpcData, source: 'supabase_rpc' };
        }
      } catch (err: any) {
        console.warn('Fallo consulta directa a Supabase para hidrología:', err);
      }
    }

    const fallbackList = stationId ? INITIAL_HYDROLOGICAL_STATIONS.filter(s => s.id === stationId) : INITIAL_HYDROLOGICAL_STATIONS;
    return { data: fallbackList, source: 'local_geojson' };
  },

  /**
   * RPC: get_protected_areas_geojson
   */
  async getProtectedAreas(): Promise<{
    data: ProtectedArea[];
    source: 'supabase_rpc' | 'local_geojson';
    error?: string;
  }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_protected_areas_geojson');
        if (!error && data) {
          return { data: Array.isArray(data) && data.length > 0 ? data : INITIAL_PROTECTED_AREAS, source: 'supabase_rpc' };
        }
      } catch (err: any) {
        console.warn('Fallo llamada RPC get_protected_areas_geojson:', err);
      }
    }
    return { data: INITIAL_PROTECTED_AREAS, source: 'local_geojson' };
  },

  /**
   * RPC: register_incident_report
   */
  async registerIncident(incident: Omit<IncidentReport, 'id' | 'code' | 'timestamp'>): Promise<{
    success: boolean;
    data?: IncidentReport;
    source: 'supabase_rpc' | 'local_geojson';
    error?: string;
  }> {
    const newReport: IncidentReport = {
      ...incident,
      id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      code: `CEN-MAN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('register_incident_report', {
          p_title: incident.title,
          p_category: incident.category,
          p_severity: incident.severity,
          p_lat: incident.latitude,
          p_lng: incident.longitude,
          p_description: incident.description,
          p_reported_by: incident.reportedBy
        });

        if (!error) {
          return { success: true, data: data || newReport, source: 'supabase_rpc' };
        }
      } catch (err: any) {
        console.warn('Fallo llamada RPC register_incident_report:', err);
      }
    }

    return { success: true, data: newReport, source: 'local_geojson' };
  },

  /**
   * RPC: calculate_basin_risk_index
   */
  async calculateBasinRisk(basinId: string): Promise<{
    riskScore: number;
    riskCategory: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    breakdown: Record<string, number>;
    source: 'supabase_rpc' | 'local_geojson';
  }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('calculate_basin_risk_index', {
          p_basin_id: basinId
        });
        if (!error && data) {
          return { ...data, source: 'supabase_rpc' };
        }
      } catch (err: any) {
        console.warn('Fallo llamada RPC calculate_basin_risk_index:', err);
      }
    }

    return {
      riskScore: 78.4,
      riskCategory: 'HIGH',
      breakdown: {
        deforestation_weight: 85,
        mining_density: 76,
        mercury_contamination: 82,
        hydrological_stress: 68
      },
      source: 'local_geojson'
    };
  },

  /**
   * Consulta los límites geodésicos oficiales desde la tabla 'limites_estados' en Supabase o vía el proxy /api/limites.
   */
  async getLimitesEstados(): Promise<{
    data: any;
    source: 'supabase' | 'local_geojson';
  }> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('limites_estados')
          .select('id, iso_code, nombre, geom');

        if (!error && data && data.length > 0) {
          const features = data.map((row: any) => {
            const geometry = typeof row.geom === 'string' ? JSON.parse(row.geom) : row.geom;
            return {
              type: 'Feature',
              properties: {
                shapeName: row.nombre,
                iso_3166_2: row.iso_code
              },
              geometry: geometry
            };
          });

          return {
            data: {
              type: 'FeatureCollection',
              features: features
            },
            source: 'supabase'
          };
        } else {
          if (error) console.warn('Supabase limites_estados error:', error.message);
        }
      } catch (err: any) {
        console.warn('Fallo al recuperar límites de Supabase:', err);
      }
    }

    // Try backend proxy endpoint /api/limites
    try {
      const res = await fetch('/api/limites');
      if (res.ok) {
        const json = await res.json();
        if (json && json.features && json.features.length > 0) {
          return { data: json, source: json.source === 'supabase_postgis' ? 'supabase' : 'local_geojson' };
        }
      }
    } catch (apiErr) {
      console.warn('Fallo consulta a /api/limites:', apiErr);
    }

    return { data: null, source: 'local_geojson' };
  }
};
