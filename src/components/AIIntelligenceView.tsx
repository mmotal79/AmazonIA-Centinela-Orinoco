import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  Send, 
  ShieldAlert, 
  Flame, 
  Pickaxe, 
  Droplets, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Check,
  FileText,
  Compass,
  Satellite,
  MapPin,
  X,
  ArrowUpRight,
  AlertTriangle,
  Layers,
  Database
} from 'lucide-react';
import { 
  HeatAnomaly, 
  MiningCluster, 
  HydrologicalStation, 
  ProtectedArea, 
  IncidentReport, 
  ZoneAnalyticsResult,
  ScientificArticle 
} from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ZoneAnalyticsModal } from './ZoneAnalyticsModal';
import { DownloadReportButton } from './DownloadReportButton';

interface AIIntelligenceViewProps {
  heatAnomalies: HeatAnomaly[];
  miningClusters: MiningCluster[];
  hydrologicalStations: HydrologicalStation[];
  protectedAreas: ProtectedArea[];
  incidents: IncidentReport[];
  scientificArticles?: ScientificArticle[];
  activeEventContext?: any;
  onClearActiveEventContext?: () => void;
  onNavigateToMap?: (coords: { lat: number; lng: number }) => void;
}

export const AIIntelligenceView: React.FC<AIIntelligenceViewProps> = ({
  heatAnomalies,
  miningClusters,
  hydrologicalStations,
  protectedAreas,
  incidents,
  scientificArticles,
  activeEventContext,
  onClearActiveEventContext,
  onNavigateToMap,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('Parque Nacional Yapacana');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Deep Zone Analytics Modal state (RAG + 10 Models)
  const [isZoneModalOpen, setIsZoneModalOpen] = useState<boolean>(false);
  const [zoneAnalyticsResult, setZoneAnalyticsResult] = useState<ZoneAnalyticsResult | null>(null);
  const [isZoneAnalyticsLoading, setIsZoneAnalyticsLoading] = useState<boolean>(false);

  // Pre-configured tactical hotspots for one-click analysis
  const PRESET_ZONES = [
    {
      name: 'Parque Nacional Yapacana (Amazonas)',
      coords: { lat: 3.755, lng: -66.824 },
      overlap: 'Parque Nacional Yapacana (ABRAE Estricta) / Territorio Ancestral Piaroa',
    },
    {
      name: 'Cuenca Media del Río Caura (Bolívar)',
      coords: { lat: 6.012, lng: -64.551 },
      overlap: 'Parque Nacional Caura / Pueblo Ye\'kwana y Sanema',
    },
    {
      name: 'Río Ikabarú - Cabeceras del Caroní',
      coords: { lat: 4.341, lng: -61.735 },
      overlap: 'Zona Amortiguamiento Canaima / Pueblo Pemón',
    },
    {
      name: 'Río Atabapo - Sector Guasare (Frontera)',
      coords: { lat: 3.991, lng: -67.682 },
      overlap: 'Monumento Natural Cerro Yuvin / Poblaciones Curripaco',
    },
    {
      name: 'Cuenca del Yuruarí - El Callao (Arco Minero)',
      coords: { lat: 7.348, lng: -61.831 },
      overlap: 'Reserva Forestal Imataca / Comunidades Kariña',
    },
  ];

  const handleOpenDeepAnalytics = async (zone = selectedZone, customContext?: any) => {
    const isEventContext = customContext || (activeEventContext && (zone === activeEventContext.zoneName || !zone));
    const ctx = isEventContext ? (customContext || activeEventContext) : null;
    const targetPreset = PRESET_ZONES.find((p) => p.name === zone) || PRESET_ZONES[0];

    const zoneName = ctx ? ctx.zoneName : targetPreset.name;
    const coords = ctx ? ctx.coordinates : targetPreset.coords;
    const generatingEvent = ctx ? ctx.generatingEvent : undefined;
    const satelliteLocation = ctx ? ctx.satelliteLocation : undefined;
    const thermalAnomalies = ctx?.thermalAnomalies || heatAnomalies.slice(0, 4);
    const miningAlerts = ctx?.miningAlerts || miningClusters.slice(0, 3);
    const waterQuality = ctx?.waterQuality || {
      averageTurbidity: '64 NTU',
      mercuryDetected: '0.028 ppm',
      floodRisk: 'Elevado en confluencias',
    };
    const protectedAreaOverlap = ctx?.protectedAreaOverlap || targetPreset.overlap;

    setIsZoneModalOpen(true);
    setIsZoneAnalyticsLoading(true);

    try {
      const response = await fetch('/api/ai/zone-predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName,
          coordinates: coords,
          generatingEvent,
          satelliteLocation,
          thermalAnomalies,
          miningAlerts,
          waterQuality,
          protectedAreaOverlap,
          scientificStudies: scientificArticles ? scientificArticles.slice(0, 3) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ZoneAnalyticsResult = await response.json();
      setZoneAnalyticsResult(data);
      if (data.analysisMarkdown) {
        setAnalysisResult(data.analysisMarkdown);
      }
    } catch (err: any) {
      console.warn('Error en analítica profunda:', err);
      // Fallback to standard endpoint
      try {
        const fb = await fetch('/api/ai/analyze-zone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zoneName,
            coordinates: coords,
            generatingEvent,
            satelliteLocation,
            thermalAnomalies,
            miningAlerts,
            waterQuality,
            protectedAreaOverlap,
          }),
        });
        const fbData = await fb.json();
        setZoneAnalyticsResult(fbData);
        if (fbData.analysis) {
          setAnalysisResult(fbData.analysis);
        }
      } catch (err2) {
        console.error('Fallo total de analítica:', err2);
      }
    } finally {
      setIsZoneAnalyticsLoading(false);
    }
  };

  // Trigger automated zone analysis
  const handleAnalyzeZone = async (zone = selectedZone, customContext?: any) => {
    setIsLoading(true);
    const isEventContext = customContext || (activeEventContext && (zone === activeEventContext.zoneName || !zone));
    const ctx = isEventContext ? (customContext || activeEventContext) : null;
    const targetPreset = PRESET_ZONES.find((p) => p.name === zone) || PRESET_ZONES[0];

    const zoneName = ctx ? ctx.zoneName : targetPreset.name;
    const coords = ctx ? ctx.coordinates : targetPreset.coords;
    const generatingEvent = ctx ? ctx.generatingEvent : undefined;
    const satelliteLocation = ctx ? ctx.satelliteLocation : undefined;
    const thermalAnomalies = ctx?.thermalAnomalies || heatAnomalies.slice(0, 4);
    const miningAlerts = ctx?.miningAlerts || miningClusters.slice(0, 3);
    const waterQuality = ctx?.waterQuality || {
      averageTurbidity: '64 NTU',
      mercuryDetected: '0.028 ppm',
      floodRisk: 'Elevado en confluencias',
    };
    const protectedAreaOverlap = ctx?.protectedAreaOverlap || targetPreset.overlap;

    try {
      const response = await fetch('/api/ai/zone-predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName,
          coordinates: coords,
          generatingEvent,
          satelliteLocation,
          thermalAnomalies,
          miningAlerts,
          waterQuality,
          protectedAreaOverlap,
          scientificStudies: scientificArticles ? scientificArticles.slice(0, 3) : undefined,
        }),
      });

      if (response.ok) {
        const data: ZoneAnalyticsResult = await response.json();
        setZoneAnalyticsResult(data);
        if (data.analysisMarkdown) {
          setAnalysisResult(data.analysisMarkdown);
          return;
        }
      }

      // Fallback
      const fb = await fetch('/api/ai/analyze-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName,
          coordinates: coords,
          generatingEvent,
          satelliteLocation,
          thermalAnomalies,
          miningAlerts,
          waterQuality,
          protectedAreaOverlap,
        }),
      });

      const data = await fb.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      } else if (data.error) {
        setAnalysisResult(`[Aviso del Sistema]: ${data.error}`);
      }
      if (data.zoneName) {
        setZoneAnalyticsResult(data);
      }
    } catch (err: any) {
      setAnalysisResult(`Error al contactar el motor de análisis: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run analysis whenever an active cartographic event is passed in from the map
  useEffect(() => {
    if (activeEventContext) {
      setSelectedZone(activeEventContext.zoneName);
      handleAnalyzeZone(activeEventContext.zoneName, activeEventContext);
    }
  }, [activeEventContext]);

  // Chat assistant state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Saludos, Oficial. Soy el Asistente Táctico de Inteligencia Geoespacial de Centinela Orinoco. ¿Qué sector o vector de amenaza de la cuenca desea analizar?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Send message to Gemini Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userMsg = inputMessage.trim();
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            activeHotspotsCount: heatAnomalies.length,
            miningClustersCount: miningClusters.length,
            criticalIncidentsCount: incidents.filter((i) => i.severity === 'CRITICAL').length,
            activeBasinStations: hydrologicalStations.map((s) => ({ name: s.name, level: s.currentLevelM, status: s.status })),
            activeEventContext: activeEventContext ? {
              zone: activeEventContext.zoneName,
              satelliteCoordinates: activeEventContext.satelliteCoordinates,
              event: activeEventContext.generatingEvent?.title,
              type: activeEventContext.generatingEvent?.typeLabel,
            } : null,
          },
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant' as const, content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant' as const, content: data.error || 'No se pudo generar respuesta.' }]);
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant' as const, content: `Error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0b121c] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Módulo IA de Inteligencia Táctica y Geoespacial
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluación multi-fuente de riesgo territorial, impacto por minería de aluvión, focos de calor y afectación étnica
          </p>
        </div>
      </div>

      {/* Active Cartographic Event Banner (When navigated from map event popup) */}
      {activeEventContext && (
        <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border-2 border-sky-500/50 rounded-xl p-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  EVENTO CARTOGRÁFICO VINCULADO PARA ANALÍTICA
                </span>
                {activeEventContext.generatingEvent?.typeLabel && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                    {activeEventContext.generatingEvent.typeLabel}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                  {activeEventContext.generatingEvent?.severity || 'ALERTA_ACTIVA'}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {activeEventContext.generatingEvent?.title || activeEventContext.zoneName}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeEventContext.generatingEvent?.description || 'Detección cartográfica georreferenciada'}
                  </p>
                </div>
              </div>

              {/* Geo & Satellite Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs font-mono">
                <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Ubicación Satelital GPS</span>
                  <span className="text-sky-300 font-bold">
                    {activeEventContext.satelliteCoordinates || `${activeEventContext.coordinates.lat.toFixed(5)}° N, ${Math.abs(activeEventContext.coordinates.lng).toFixed(5)}° W`}
                  </span>
                </div>
                <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Sensor Satelital / Origen</span>
                  <span className="text-emerald-300 font-medium truncate block" title={activeEventContext.generatingEvent?.satelliteSensor}>
                    {activeEventContext.generatingEvent?.satelliteSensor || 'Constelación Satelital Híbrida'}
                  </span>
                </div>
                <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Superposición de Cuenca / ABRAE</span>
                  <span className="text-amber-300 font-medium truncate block" title={activeEventContext.protectedAreaOverlap}>
                    {activeEventContext.protectedAreaOverlap || 'Cuenca del Río Orinoco'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end">
              <button
                onClick={() => handleOpenDeepAnalytics(activeEventContext.zoneName, activeEventContext)}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-sky-400/40"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-200 animate-pulse" />
                <span>Abrir Modal Completo (RAG + 10 Modelos)</span>
              </button>
              
              {onNavigateToMap && (
                <button
                  onClick={() => onNavigateToMap(activeEventContext.coordinates)}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ver en Cartografía</span>
                </button>
              )}

              {onClearActiveEventContext && (
                <button
                  onClick={onClearActiveEventContext}
                  className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Desvincular Evento</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Zone Evaluator + Interactive Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Automated Zone Risk Evaluator */}
        <div className="bg-[#0b121c] border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Evaluador Táctico por Sector de Cuenca
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
              ANALYSIS ENGINE
            </span>
          </div>

          {/* Preset Buttons & Active Event Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
              {activeEventContext ? 'Evento Activo y Sectores de Alta Prioridad' : 'Sectores de Alta Prioridad'}
            </label>

            {activeEventContext && (
              <div 
                onClick={() => {
                  setSelectedZone(activeEventContext.zoneName);
                  handleAnalyzeZone(activeEventContext.zoneName, activeEventContext);
                }}
                className={`mb-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedZone === activeEventContext.zoneName
                    ? 'bg-[#0f223a] border-sky-500 text-sky-100 shadow-md shadow-sky-950/60'
                    : 'bg-[#0a1524] border-sky-800/60 hover:border-sky-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-sky-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    🎯 Evento Cartográfico Activo
                  </span>
                  <span className="text-[10px] font-mono text-sky-400">
                    {activeEventContext.satelliteCoordinates || `${activeEventContext.coordinates.lat.toFixed(4)}°N, ${activeEventContext.coordinates.lng.toFixed(4)}°W`}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {activeEventContext.generatingEvent?.title || activeEventContext.zoneName}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activeEventContext.generatingEvent?.typeLabel || 'Evento'} • {activeEventContext.generatingEvent?.satelliteSensor || 'Sensor Satelital'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {PRESET_ZONES.map((zone) => (
                <button
                  key={zone.name}
                  onClick={() => {
                    setSelectedZone(zone.name);
                    handleAnalyzeZone(zone.name);
                  }}
                  className={`p-2 rounded-lg text-left text-xs font-medium border transition-all cursor-pointer ${
                    selectedZone === zone.name && (!activeEventContext || selectedZone !== activeEventContext.zoneName)
                      ? 'bg-[#0f1f33] border-sky-500 text-sky-200 shadow-md'
                      : 'bg-[#070b10] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="truncate font-semibold">{zone.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{zone.coords.lat}°N, {zone.coords.lng}°W</div>
                </button>
              ))}
            </div>
          </div>

          {/* Run Analysis Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              id="analitica-de-la-zona"
              data-testid="analitica-de-la-zona"
              name="Analítica de la Zona"
              onClick={() => handleOpenDeepAnalytics(selectedZone, activeEventContext?.zoneName === selectedZone ? activeEventContext : undefined)}
              className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-sky-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer border border-sky-400/30"
            >
              <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
              <span>Analítica de la Zona (RAG + 10 Modelos)</span>
            </button>
            <button
              onClick={() => handleAnalyzeZone(selectedZone, activeEventContext?.zoneName === selectedZone ? activeEventContext : undefined)}
              disabled={isLoading}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Generar resumen táctico rápido en panel"
            >
              <FileText className="w-3.5 h-3.5 text-slate-300" />
              <span>{isLoading ? 'Analizando...' : 'Resumen Rápido'}</span>
            </button>
          </div>

          {/* Analysis Output Box */}
          <div className="flex-1 bg-[#060a0f] border border-slate-800 rounded-xl p-4 flex flex-col space-y-2 min-h-[300px]">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-wrap gap-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <Satellite className="w-3 h-3 text-sky-400" />
                Dictamen Táctico Oficial (Predictivo, Perceptivo y Prescriptivo)
              </span>
              {analysisResult && (
                <div className="flex items-center gap-2">
                  <DownloadReportButton
                    markdown={analysisResult}
                    result={zoneAnalyticsResult || {
                      zoneName: selectedZone,
                      coordinates: PRESET_ZONES.find(p => p.name === selectedZone)?.coords,
                      generatingEvent: activeEventContext?.generatingEvent,
                      satelliteLocation: activeEventContext?.satelliteCoordinates ? {
                        formatted: activeEventContext.satelliteCoordinates,
                        latitude: activeEventContext.coordinates.lat,
                        longitude: activeEventContext.coordinates.lng,
                      } : undefined,
                    }}
                    variant="compact"
                    label="Descargar Formateado"
                  />
                  <button
                    onClick={handleCopyAnalysis}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer px-2 py-1 bg-slate-800 rounded border border-slate-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto text-xs text-slate-300 leading-relaxed font-sans pr-1">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-10">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                  <span className="text-xs font-mono">Procesando telemetría satelital, corpus y modelos predictivos...</span>
                </div>
              ) : analysisResult ? (
                <div className="space-y-2">
                  <MarkdownRenderer content={analysisResult} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs py-10 text-center">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <span>Seleccione un sector arriba o presione &quot;Analítica de la Zona&quot; para iniciar la evaluación.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Conversational Tactical Assistant */}
        <div className="bg-[#0b121c] border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Asistente Táctico Centinela (Chat en Vivo)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              TACTICAL AI
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white font-medium rounded-tr-none'
                      : 'bg-[#060a0f] text-slate-200 border border-slate-800 rounded-tl-none space-y-1.5'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Analizando vectores de respuesta táctica...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Pregunte sobre un sector, balsa draga, foco de calor o coordenada..."
              className="flex-1 bg-[#060a0f] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputMessage.trim()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Deep Zone Analytics Modal (RAG + 10 Models) */}
      <ZoneAnalyticsModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        result={zoneAnalyticsResult}
        isLoading={isZoneAnalyticsLoading}
        onRefresh={() => handleOpenDeepAnalytics(selectedZone, activeEventContext?.zoneName === selectedZone ? activeEventContext : undefined)}
      />
    </div>
  );
};

