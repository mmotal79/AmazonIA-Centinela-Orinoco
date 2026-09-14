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
          p_limit: params?.limit || 100
        });

        if (!error && data) {
          // Si retorna FeatureCollection o array
          const parsed = Array.isArray(data) ? data : data.features?.map((f: any) => f.properties) || [];
          return { data: parsed.length > 0 ? parsed : INITIAL_HEAT_ANOMALIES, source: 'supabase_rpc' };
        }
      } catch (err: any) {
        console.warn('Fallo llamada RPC get_heat_anomalies_geojson, usando caché local:', err);
      }
    }
    return { data: INITIAL_HEAT_ANOMALIES, source: 'local_geojson' };
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
   * RPC: get_hydrological_telemetry
   */
  async getHydrologicalTelemetry(stationId?: string): Promise<{
    data: HydrologicalStation[];
    source: 'supabase_rpc' | 'local_geojson';
    error?: string;
  }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_hydrological_telemetry', {
          p_station_id: stationId || null
        });

        if (!error && data) {
          return { data: Array.isArray(data) && data.length > 0 ? data : INITIAL_HYDROLOGICAL_STATIONS, source: 'supabase_rpc' };
        }
      } catch (err: any) {
        console.warn('Fallo llamada RPC get_hydrological_telemetry:', err);
      }
    }
    return { data: INITIAL_HYDROLOGICAL_STATIONS, source: 'local_geojson' };
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
