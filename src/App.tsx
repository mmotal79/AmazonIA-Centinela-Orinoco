import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TacticalMap } from './components/TacticalMap';
import { TelemetryView } from './components/TelemetryView';
import { IncidentManager } from './components/IncidentManager';
import { SupabaseRpcConsole } from './components/SupabaseRpcConsole';
import { AIIntelligenceView } from './components/AIIntelligenceView';
import { BulletinGenerator } from './components/BulletinGenerator';
import { AIChatDrawer } from './components/AIChatDrawer';
import { ScientificCorpusReader } from './components/ScientificCorpusReader';
import { SarAnomalyViewer } from './components/SarAnomalyViewer';
import { SyntheticTelemetryGenerator } from './components/SyntheticTelemetryGenerator';
import { LiveIngestionPipelineView } from './components/LiveIngestionPipelineView';
import { SatelliteApiConnectionsModal } from './components/SatelliteApiConnectionsModal';
import { 
  ViewMode, 
  HeatAnomaly, 
  MiningCluster, 
  HydrologicalStation, 
  ProtectedArea, 
  IncidentReport,
  ScientificArticle,
  SarRadarAnomaly
} from './types';
import { SupabaseRpcService } from './lib/supabaseClient';
import { 
  INITIAL_HEAT_ANOMALIES, 
  INITIAL_MINING_CLUSTERS, 
  INITIAL_HYDROLOGICAL_STATIONS, 
  INITIAL_PROTECTED_AREAS, 
  INITIAL_INCIDENT_REPORTS 
} from './data/mockGeoJSON';
import { 
  INITIAL_SCIENTIFIC_ARTICLES, 
  INITIAL_SAR_RADAR_ANOMALIES 
} from './data/scientificAndSarData';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('MAP_SITUATION');
  
  // Data states
  const [heatAnomalies, setHeatAnomalies] = useState<HeatAnomaly[]>(INITIAL_HEAT_ANOMALIES);
  const [miningClusters, setMiningClusters] = useState<MiningCluster[]>(INITIAL_MINING_CLUSTERS);
  const [hydrologicalStations, setHydrologicalStations] = useState<HydrologicalStation[]>(INITIAL_HYDROLOGICAL_STATIONS);
  const [protectedAreas, setProtectedAreas] = useState<ProtectedArea[]>(INITIAL_PROTECTED_AREAS);
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENT_REPORTS);
  const [scientificArticles, setScientificArticles] = useState<ScientificArticle[]>(INITIAL_SCIENTIFIC_ARTICLES);
  const [sarAnomalies, setSarAnomalies] = useState<SarRadarAnomaly[]>(INITIAL_SAR_RADAR_ANOMALIES);

  // Modals & Drawers
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isSatelliteModalOpen, setIsSatelliteModalOpen] = useState(false);
  const [incidentPrefilledCoords, setIncidentPrefilledCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeAiContext, setActiveAiContext] = useState<any>(null);

  // Cross-component Map Focus Coordinates
  const [mapFocusCoords, setMapFocusCoords] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    selectFeature?: {
      type: 'scientific';
      data: any;
    };
  } | null>(null);

  // Load live data from Supabase RPCs or local GeoJSON
  const loadData = async () => {
    try {
      const [heatRes, miningRes, hydroRes, protectedRes] = await Promise.all([
        SupabaseRpcService.getHeatAnomalies(),
        SupabaseRpcService.getMiningClusters(),
        SupabaseRpcService.getHydrologicalTelemetry(),
        SupabaseRpcService.getProtectedAreas(),
      ]);

      if (heatRes.data) setHeatAnomalies(heatRes.data);
      if (miningRes.data) setMiningClusters(miningRes.data);
      if (hydroRes.data) setHydrologicalStations(hydroRes.data);
      if (protectedRes.data) setProtectedAreas(protectedRes.data);

      // Ingesta y sincronización real y verdadera del corpus científico desde la base de datos
      try {
        const corpusRes = await fetch("/api/corpus");
        if (corpusRes.ok) {
          const corpusData = await corpusRes.json();
          if (Array.isArray(corpusData) && corpusData.length > 0) {
            setScientificArticles(corpusData);
          }
        }
      } catch (corpusErr) {
        console.warn("Error cargando corpus científico del backend:", corpusErr);
      }

    } catch (err) {
      console.warn('Error cargando datos de Supabase RPCs:', err);
    }
  };

  useEffect(() => {
    loadData();
    // Corregir retroactivamente la base de datos para los últimos 3 documentos del corpus científico si están en Supabase
    fetch("/api/corpus/correct-db", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.corrected && data.corrected.length > 0) {
          console.log("[Centinela Correction] Documentos corregidos exitosamente en Supabase:", data.corrected);
        }
      })
      .catch((err) => console.warn("[Centinela Correction] Error corrigiendo base de datos:", err));
  }, []);

  // Handlers for Scientific Corpus & SAR
  const handleAddScientificArticle = (article: ScientificArticle) => {
    setScientificArticles((prev) => [article, ...prev]);
  };

  const handleVerifySarAnomaly = (id: string, newStatus: SarRadarAnomaly['status']) => {
    setSarAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  const handleInjectSyntheticStations = (newStations: HydrologicalStation[]) => {
    setHydrologicalStations((prev) => [...newStations, ...prev]);
  };

  // Handler for adding an incident
  const handleAddIncident = (newInc: IncidentReport) => {
    setIncidents((prev) => [newInc, ...prev]);
  };

  // Handler for updating incident status
  const handleUpdateIncidentStatus = (id: string, status: IncidentReport['status']) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status } : inc))
    );
  };

  // Handler to trigger AI Analysis directly from map feature
  const handleTriggerAiAnalysis = (context: any) => {
    setActiveAiContext(context);
    setCurrentView('AI_INTELLIGENCE');
  };

  // Handler to open incident creation from map
  const handleOpenIncidentFromMap = (coords?: { lat: number; lng: number }) => {
    if (coords) {
      setIncidentPrefilledCoords(coords);
    }
    setIsIncidentModalOpen(true);
  };

  const handleDispatchSarAlert = (anomaly: SarRadarAnomaly) => {
    const newInc: IncidentReport = {
      id: `INC-SAR-${Date.now().toString().slice(-4)}`,
      code: `ALERTA-${anomaly.code}`,
      title: `Interdicción SAR: ${anomaly.sectorName}`,
      category: 'MINERIA_ILEGAL',
      severity: anomaly.severity,
      status: 'OPERATIVO_EN_CURSO',
      latitude: anomaly.latitude,
      longitude: anomaly.longitude,
      locationName: anomaly.sectorName,
      description: `Alerta derivada de radar satelital Sentinel-1 SAR (${anomaly.sarBackscatterChangeDb} dB). Pérdida de coherencia ${anomaly.coherenceLossPercent}%. Superficie afectada: ${anomaly.affectedSurfaceHa} Ha.`,
      reportedBy: 'Sistema Centinela SAR Pipeline',
      timestamp: new Date().toISOString(),
      assignedUnit: 'Comando de Guardería Ambiental / Fluvial',
      evidenceCount: 2,
    };
    handleAddIncident(newInc);
    setCurrentView('INCIDENTS');
  };

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-200 flex flex-col font-sans selection:bg-sky-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenNewIncidentModal={() => {
          setIncidentPrefilledCoords(null);
          setIsIncidentModalOpen(true);
        }}
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        activeIncidentsCount={incidents.filter((i) => i.status === 'ACTIVO' || i.status === 'OPERATIVO_EN_CURSO').length}
        thermalAnomaliesCount={heatAnomalies.length}
      />

      {/* Main View Router */}
      <main className="flex-1 relative overflow-x-hidden">
        {currentView === 'MAP_SITUATION' && (
          <TacticalMap
            heatAnomalies={heatAnomalies}
            miningClusters={miningClusters}
            hydrologicalStations={hydrologicalStations}
            protectedAreas={protectedAreas}
            incidents={incidents}
            scientificArticles={scientificArticles}
            mapFocusCoords={mapFocusCoords}
            onClearMapFocus={() => setMapFocusCoords(null)}
            onTriggerAiAnalysis={handleTriggerAiAnalysis}
            onOpenNewIncident={handleOpenIncidentFromMap}
            onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
            onOpenSatelliteApis={() => setIsSatelliteModalOpen(true)}
          />
        )}

        {currentView === 'LIVE_PIPELINE' && (
          <LiveIngestionPipelineView
            onNavigateToMapWithCoords={(lat, lng, zoom) => {
              if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                setMapFocusCoords({ lat, lng, zoom: zoom || 11 });
              }
              setCurrentView('MAP_SITUATION');
            }}
            onAddIncident={handleAddIncident}
          />
        )}

        {currentView === 'SCIENTIFIC_CORPUS' && (
          <ScientificCorpusReader
            articles={scientificArticles}
            onAddArticle={handleAddScientificArticle}
            onSelectSiteOnMap={(site) => {
              if (typeof site?.latitude === 'number' && typeof site?.longitude === 'number' && !isNaN(site.latitude) && !isNaN(site.longitude)) {
                // Buscar el artículo científico correspondiente para poblar los detalles en el inspector lateral del mapa
                const parentArticle = scientificArticles.find((a) => 
                  a.investigationSites?.some((s) => s.name === site.name)
                );
                
                setMapFocusCoords({
                  lat: site.latitude,
                  lng: site.longitude,
                  zoom: 10,
                  selectFeature: {
                    type: 'scientific',
                    data: {
                      ...site,
                      articleId: parentArticle?.id || 'ART-CUSTOM',
                      articleTitle: parentArticle?.title || 'Investigación Extraída',
                      authors: parentArticle?.authors || 'Investigador',
                      year: parentArticle?.year || 2026,
                      source: parentArticle?.source || 'Corpus Reader',
                      peerReviewed: parentArticle?.peerReviewed,
                      tags: parentArticle?.tags || ['Amazonía'],
                      abstract: parentArticle?.abstract || 'Hallazgos georreferenciados.'
                    }
                  }
                });
              }
              setCurrentView('MAP_SITUATION');
            }}
          />
        )}

        {currentView === 'SAR_RADAR_ANOMALIES' && (
          <SarAnomalyViewer
            anomalies={sarAnomalies}
            onVerifyAnomaly={handleVerifySarAnomaly}
            onSelectOnMap={(anomaly) => {
              setCurrentView('MAP_SITUATION');
            }}
            onDispatchAlert={handleDispatchSarAlert}
          />
        )}

        {currentView === 'SYNTHETIC_TELEMETRY' && (
          <SyntheticTelemetryGenerator
            onInjectStations={handleInjectSyntheticStations}
            existingStationsCount={hydrologicalStations.length}
          />
        )}

        {currentView === 'TELEMETRY' && (
          <TelemetryView
            stations={hydrologicalStations}
            onRefresh={loadData}
            onSelectStationOnMap={(station) => {
              if (station?.coordinates && Array.isArray(station.coordinates)) {
                setMapFocusCoords({
                  lng: station.coordinates[0],
                  lat: station.coordinates[1],
                  zoom: 11
                });
                setCurrentView('MAP_SITUATION');
              }
            }}
          />
        )}

        {currentView === 'INCIDENTS' && (
          <IncidentManager
            incidents={incidents}
            onAddIncident={handleAddIncident}
            onUpdateStatus={handleUpdateIncidentStatus}
            isCreateModalOpen={isIncidentModalOpen}
            onCloseCreateModal={() => setIsIncidentModalOpen(false)}
            prefilledCoords={incidentPrefilledCoords}
          />
        )}

        {currentView === 'SUPABASE_CONSOLE' && (
          <SupabaseRpcConsole />
        )}

        {currentView === 'AI_INTELLIGENCE' && (
          <AIIntelligenceView
            heatAnomalies={heatAnomalies}
            miningClusters={miningClusters}
            hydrologicalStations={hydrologicalStations}
            protectedAreas={protectedAreas}
            incidents={incidents}
            scientificArticles={scientificArticles}
            activeEventContext={activeAiContext}
            onClearActiveEventContext={() => setActiveAiContext(null)}
            onNavigateToMap={(coords: any) => {
              if (coords) {
                let lat: number | undefined;
                let lng: number | undefined;
                if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
                  lat = coords.lat;
                  lng = coords.lng;
                } else if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
                  lat = coords.latitude;
                  lng = coords.longitude;
                } else if (Array.isArray(coords) && coords.length >= 2) {
                  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                    lat = coords[0];
                    lng = coords[1];
                  } else if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
                    lat = coords[0][0];
                    lng = coords[0][1];
                  }
                }
                if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                  setMapFocusCoords({ lat, lng, zoom: 11 });
                }
              }
              setCurrentView('MAP_SITUATION');
            }}
          />
        )}

        {currentView === 'BULLETIN_GENERATOR' && (
          <BulletinGenerator
            heatAnomalies={heatAnomalies}
            miningClusters={miningClusters}
            hydrologicalStations={hydrologicalStations}
            incidents={incidents}
          />
        )}
      </main>

      {/* Side AI Companion Drawer */}
      <AIChatDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        contextData={{
          currentView,
          heatAnomaliesCount: heatAnomalies.length,
          miningClustersCount: miningClusters.length,
          activeIncidentsCount: incidents.length,
          sarAnomaliesCount: sarAnomalies.length,
          scientificArticlesCount: scientificArticles.length,
        }}
      />

      {/* Satellite API Connections Modal */}
      <SatelliteApiConnectionsModal
        isOpen={isSatelliteModalOpen}
        onClose={() => setIsSatelliteModalOpen(false)}
      />
    </div>
  );
}
