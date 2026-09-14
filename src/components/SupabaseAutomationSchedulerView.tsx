import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Satellite, 
  Radar, 
  Flame, 
  Database, 
  Terminal, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  Droplets, 
  Layers, 
  ExternalLink, 
  Zap,
  Radio,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Cpu
} from 'lucide-react';
import { 
  SatelliteScheduledTask, 
  SchedulerLogEntry, 
  SchedulerStatusResponse 
} from '../types';
import { LivePipelineService } from '../services/liveDataPipelineService';

interface SupabaseAutomationSchedulerViewProps {
  onNavigateToRag?: () => void;
  onNavigateToSql?: () => void;
}

export const SupabaseAutomationSchedulerView: React.FC<SupabaseAutomationSchedulerViewProps> = ({
  onNavigateToRag,
  onNavigateToSql
}) => {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggeringTaskKey, setTriggeringTaskKey] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [sqlScript, setSqlScript] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);

  // Cargar estado inicial y refrescar cada segundo
  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const data = await LivePipelineService.getSchedulerStatus();
        if (isMounted) {
          setSchedulerStatus(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching scheduler status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);

    // Cargar script SQL
    LivePipelineService.getAutomationSql().then(sql => {
      if (isMounted) setSqlScript(sql);
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTriggerManual = async (taskKey: string) => {
    setTriggeringTaskKey(taskKey);
    try {
      await LivePipelineService.triggerScheduledTask(taskKey);
      const updated = await LivePipelineService.getSchedulerStatus();
      setSchedulerStatus(updated);
    } catch (e) {
      console.warn('Error triggering task:', e);
    } finally {
      setTimeout(() => setTriggeringTaskKey(null), 800);
    }
  };

  const handleToggleRunning = async () => {
    try {
      const res = await LivePipelineService.toggleSchedulerRunning();
      setSchedulerStatus(prev => prev ? { ...prev, isRunning: res.isRunning } : null);
    } catch (e) {
      console.warn('Error toggling scheduler:', e);
    }
  };

  const handleToggleMode = async () => {
    if (!schedulerStatus) return;
    const targetMode = schedulerStatus.mode === 'PRODUCTION_CADENCE' ? 'ACCELERATED_DEMO' : 'PRODUCTION_CADENCE';
    try {
      await LivePipelineService.setSchedulerMode(targetMode);
      const updated = await LivePipelineService.getSchedulerStatus();
      setSchedulerStatus(updated);
    } catch (e) {
      console.warn('Error changing scheduler mode:', e);
    }
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return 'Ejecutando ahora...';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getSatelliteIcon = (key: string) => {
    switch (key) {
      case 'NASA_FIRMS':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'SENTINEL_1_SAR':
        return <Radar className="w-5 h-5 text-sky-400" />;
      case 'SENTINEL_2_MSI':
        return <Satellite className="w-5 h-5 text-emerald-400" />;
      case 'HYDRO_TELEMETRY':
        return <Droplets className="w-5 h-5 text-cyan-400" />;
      default:
        return <Radio className="w-5 h-5 text-violet-400" />;
    }
  };

  const getSatelliteBadgeColor = (key: string) => {
    switch (key) {
      case 'NASA_FIRMS':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'SENTINEL_1_SAR':
        return 'bg-sky-950/80 text-sky-300 border-sky-800';
      case 'SENTINEL_2_MSI':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'HYDRO_TELEMETRY':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const technicalReportText = `# INFORME TÉCNICO: AUTOMATIZACIÓN DE INGESTA SATELITAL, BASE DE DATOS SUPABASE Y PIPELINE VECTORIAL RAG
**SISTEMA DE ALERTA TEMPRANA Y VIGILANCIA AMBIENTAL "CENTINELA ORINOCO"**  
**Fecha de Generación:** ${new Date().toLocaleDateString('es-VE')}  
**Clasificación:** TÉCNICO-OPERACIONAL  
**Motor de Datos:** Supabase (PostgreSQL 15+ / PostGIS 3.4 / pgvector 0.7+)  

---

## 1. RESUMEN EJECUTIVO Y JUSTIFICACIÓN
La cuenca del Río Orinoco y la Amazonía venezolana (estados Amazonas, Bolívar y Delta Amacuro) abarcan más de 880.000 km² de selva tropical, con alta nubosidad persistente y áreas remotas de difícil acceso. La recolección manual o reactiva de datos resulta insuficiente para frenar la minería ilegal y la contaminación por mercurio.

Este sistema implementa un **Orquestador Satelital Automatizado (Scheduler)** que sincroniza la ingesta de telemetría respetando con precisión los **plazos orbitales y frecuencias de revisita** determinados por las constelaciones satelitales. Al depositar los datos de manera continua y estructurada en Supabase, se habilita la vectorización automática (embeddings 768-D), indexación HNSW y el consumo semántico para Retrieval-Augmented Generation (RAG).

---

## 2. PLAZOS DETERMINADOS POR CADA SATÉLITE Y TAREAS PROGRAMADAS

| Misión Satelital / Sensor | Agencia Operadora | Intervalo Físico de Satélite | Intervalo Automatizado en Tarea | Vector de Detección Primario | Destino Supabase |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NASA FIRMS (VIIRS / MODIS)** | NASA EOSDIS / LANCE | Órbita heliosincrónica LEO ~3h NRT | **Cada 3 horas (10.800 s)** | Focos térmicos, quemas de campamentos, motobombas | \`public.nasa_firms_hotspots\` |
| **Copernicus Sentinel-1 SAR** | Agencia Espacial Europea (ESA) | Constelación revisit 6 a 12 días | **Cada 12 horas (43.200 s)** | Caída de retrodispersión dB, dragas de aluvión bajo nubes | \`public.copernicus_sar_disturbances\` |
| **Copernicus Sentinel-2 MSI** | ESA / Copernicus CDSE | Revisita óptica de 5 días por Tile | **Cada 24 horas (86.400 s)** | Pérdida de dosel boscoso, sedimentación, bandas SCL/TCI | \`public.s2_product_tile\` |
| **Telemetría Hidrométrica** | INAMEH / Red Orinoco | Lectura telemétrica horaria | **Cada 1 hora (3.600 s)** | Cotas de nivel, turbidez (NTU) y concentración de mercurio | \`public.hydrological_telemetry_readings\` |

---

## 3. ARQUITECTURA SUPABASE: VECTORIZACIÓN, EMBEDDINGS Y RAG SEMÁNTICO
El flujo end-to-end de datos satelitales se divide en 5 etapas secuenciales:

1. **Ingesta Programada en Backend (Node.js Daemon):**
   - El scheduler ejecuta las consultas según el temporizador de cada satélite.
   - Normaliza la telemetría, asigna BBox espacial y genera el texto sintético explicativo.

2. **Inserción en Tablas de Supabase:**
   - Escribe el registro crudo en su respectiva tabla especializada.
   - Inserta paralelamente un bloque documental en \`public.environmental_rag_documents\`.

3. **Disparadores (Triggers) de Autocompletado y PostGIS:**
   - La función PL/pgSQL \`trg_auto_populate_spatial_geom()\` convierte automáticamente la latitud y longitud en un punto espacial \`geometry(Point, 4326)\`.
   - Se genera el vector embedding de 768 dimensiones (modelo Gemini \`text-embedding-004\`).

4. **Indexación Vectorial de Alta Velocidad (pgvector HNSW):**
   - La tabla de documentos está indexada mediante:
     \`CREATE INDEX idx_environmental_rag_embedding ON public.environmental_rag_documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);\`
   - Esto permite resolver similitud de cosenos en < 4 ms sobre miles de registros.

5. **Consumo RAG Semántico Espacial (RPC \`match_spatial_environmental_rag\`):**
   - Combina la distancia geográfica PostGIS (\`ST_DWithin\` en km) con la distancia vectorial de cosenos (\`1 - (embedding <=> query_embedding)\`).
   - El motor de Inteligencia Artificial consume este contexto enriquecido para dictámenes operacionales, alertas tempranas y respuestas tácticas sin alucinaciones.

---

## 4. CONCLUSIÓN Y ESTADO OPERACIONAL
El orquestador se encuentra plenamente operativo en la plataforma Centinela Orinoco, permitiendo alternar entre el ciclo de producción orbital y el modo de verificación acelerada, garantizando que Supabase reciba la telemetría en tiempo y forma para su explotación analítica.`;

  return (
    <div className="flex-1 bg-[#070d14] text-slate-200 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Top Banner with Status, Modes and Controls */}
      <div className="bg-gradient-to-r from-[#0b1424] via-[#0f1b2e] to-[#0d1626] p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-950/50">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    Orquestador de Ingesta Satelital Automatizada
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    schedulerStatus?.isRunning 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                      : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}>
                    {schedulerStatus?.isRunning ? 'CRON DAEMON ACTIVO' : 'PAUSADO'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-950 text-violet-300 border border-violet-800">
                    SUPABASE + PGVECTOR
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tareas programadas en los plazos físicos de cada constelación espacial para auto-vectorización, embeddings y RAG semántico
                </p>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggleMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                schedulerStatus?.mode === 'PRODUCTION_CADENCE'
                  ? 'bg-sky-950 text-sky-300 border-sky-700 hover:bg-sky-900'
                  : 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900'
              }`}
              title="Alternar entre plazos nominales de satélites y demo acelerado"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>
                Modo: {schedulerStatus?.mode === 'PRODUCTION_CADENCE' ? 'Plazos Reales (3h/12h/24h)' : 'Demostración Acelerada'}
              </span>
            </button>

            <button
              onClick={handleToggleRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                schedulerStatus?.isRunning
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
              }`}
            >
              {schedulerStatus?.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{schedulerStatus?.isRunning ? 'Pausar Scheduler' : 'Reanudar Scheduler'}</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-violet-950/40 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ver Informe Técnico</span>
            </button>

            <button
              onClick={() => setShowSqlModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>SQL Supabase DDL</span>
            </button>
          </div>
        </div>

        {/* Supabase Connection State Banner */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Destino Supabase:</span>
            <span className={`px-2 py-0.5 rounded font-semibold border ${
              schedulerStatus?.supabaseConnected 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                : 'bg-indigo-950 text-indigo-300 border-indigo-800'
            }`}>
              {schedulerStatus?.supabaseConnected ? 'CONEXIÓN ACTIVA (REST/RPC)' : 'BUFFER LOCAL RESILIENTE (PREPARADO PARA SUPABASE)'}
            </span>
            <span className="text-slate-500 truncate max-w-xs">{schedulerStatus?.supabaseHost}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <div>
              <span className="text-slate-500 mr-1">Eventos Satelitales:</span>
              <span className="font-bold text-sky-400">{schedulerStatus?.totalSatelliteEventsIngested || 0}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">Corpus RAG (768-D):</span>
              <span className="font-bold text-violet-400">{schedulerStatus?.vectorRagDocsCount || 0} docs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Scheduled Tasks for each Satellite */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Satellite className="w-4 h-4 text-sky-400" />
            <span>Misiones Satelitales Programadas en Plazos Determinados</span>
          </h3>
          <span className="text-xs text-slate-400">
            Actualización en vivo de temporizadores orbitales
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {schedulerStatus?.activeTasks.map((task) => {
            const isTriggering = triggeringTaskKey === task.key;
            const progressPct = task.intervalSeconds > 0 
              ? Math.max(0, Math.min(100, Math.round(((task.intervalSeconds - task.countdownSeconds) / task.intervalSeconds) * 100)))
              : 100;

            return (
              <div 
                key={task.key}
                className="bg-[#0b131e] rounded-xl border border-slate-800 p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {getSatelliteIcon(task.key)}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${getSatelliteBadgeColor(task.key)}`}>
                      {task.nominalCadenceText}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-sky-300 transition-colors">
                    {task.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {task.satelliteMission}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Agencia: {task.agency}
                  </p>

                  {/* Countdown Timer */}
                  <div className="mt-4 p-2.5 rounded-lg bg-[#070d14] border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Próxima Ingesta:
                      </span>
                      <span className="font-mono font-bold text-white">
                        {formatCountdown(task.countdownSeconds)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-1000"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                      <span>Progreso: {progressPct}%</span>
                      <span>Tabla: {task.supabaseTable.replace('public.', '')}</span>
                    </div>
                  </div>

                  {/* Metrics and Status */}
                  <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-800/60 pt-2 font-mono">
                    <span className="text-slate-400">Total Ingestados:</span>
                    <span className="font-bold text-emerald-400">{task.totalIngested} eventos</span>
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400 truncate" title={task.lastMessage}>
                    <span className="text-slate-500">Estado:</span> {task.lastMessage || 'Monitoreo activo'}
                  </div>
                </div>

                {/* Trigger Button */}
                <div className="mt-4 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleTriggerManual(task.key)}
                    disabled={isTriggering}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all disabled:opacity-50"
                  >
                    <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTriggering ? 'animate-spin' : ''}`} />
                    <span>{isTriggering ? 'Ingestando y Vectorizando...' : 'Disparar Ingesta Ahora'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Step-by-Step Architecture Diagram */}
      <div className="bg-[#0b131e] rounded-xl border border-slate-800 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>Flujo de Ingesta, Supabase, Embedding, Vectorización y RAG Semántico</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cómo la ingesta programada alimenta automáticamente la base de datos Supabase y la inteligencia territorial
            </p>
          </div>
          <button
            onClick={() => onNavigateToRag && onNavigateToRag()}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-950/40 px-3 py-1 rounded border border-sky-800/60 transition-all"
          >
            <span>Explorar RAG Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Step 1 */}
          <div className="p-3.5 rounded-lg bg-[#070d14] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center mb-2">
                1
              </div>
              <h5 className="text-xs font-bold text-white">Cron Orbital</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                El scheduler en segundo plano consulta FIRMS cada 3h, Sentinel-1 cada 12h y Sentinel-2 cada 24h.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400/80 mt-2">Node.js Daemon</span>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-lg bg-[#070d14] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 font-mono font-bold text-xs flex items-center justify-center mb-2">
                2
              </div>
              <h5 className="text-xs font-bold text-white">Supabase Insert</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Inserción de registros crudos en tablas específicas con coordenadas lat/lng y metadatos de satélite.
              </p>
            </div>
            <span className="text-[10px] font-mono text-sky-400/80 mt-2">PostgreSQL 15</span>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-lg bg-[#070d14] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center mb-2">
                3
              </div>
              <h5 className="text-xs font-bold text-white">Trigger & PostGIS</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Trigger PL/pgSQL construye la geometría <code className="text-emerald-300">Point(4326)</code> y encola el texto para vectorización.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 mt-2">PostGIS 3.4 Spatial</span>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-lg bg-[#070d14] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-md bg-violet-500/20 text-violet-400 font-mono font-bold text-xs flex items-center justify-center mb-2">
                4
              </div>
              <h5 className="text-xs font-bold text-white">pgvector HNSW</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Generación de embedding de 768-D indexado con HNSW para búsqueda por similitud de cosenos en milisegundos.
              </p>
            </div>
            <span className="text-[10px] font-mono text-violet-400/80 mt-2">pgvector 0.7 HNSW</span>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-lg bg-[#070d14] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center mb-2">
                5
              </div>
              <h5 className="text-xs font-bold text-white">RAG Semántico</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                La RPC <code className="text-cyan-300">match_spatial_environmental_rag</code> filtra por radio espacial y similitud para alimentar a Gemini AI.
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80 mt-2">Consumo Operacional</span>
          </div>
        </div>
      </div>

      {/* Live Scheduler Logs Console */}
      <div className="bg-[#0b131e] rounded-xl border border-slate-800 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Auditoría en Tiempo Real de Ejecuciones del Scheduler</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {schedulerStatus?.recentLogs.length || 0} registros en memoria
          </span>
        </div>

        <div className="bg-[#05080e] rounded-lg border border-slate-800/80 p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-1.5">
          {schedulerStatus?.recentLogs && schedulerStatus.recentLogs.length > 0 ? (
            schedulerStatus.recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-slate-300 border-b border-slate-900/60 pb-1">
                <span className="text-slate-500 shrink-0">[{log.timestamp.slice(11, 19)}]</span>
                <span className={`px-1 rounded text-[10px] shrink-0 font-semibold ${
                  log.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  log.status === 'ERROR' ? 'bg-red-950 text-red-400 border border-red-800' :
                  'bg-sky-950 text-sky-400 border border-sky-800'
                }`}>
                  {log.taskKey}
                </span>
                <span className="text-slate-200 flex-1">{log.message}</span>
                {log.supabaseSynced && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 rounded border border-emerald-800/40">
                    SUPABASE SYNC
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-slate-500 italic text-center py-4">
              Esperando primer ciclo de ejecución...
            </div>
          )}
        </div>
      </div>

      {/* Technical Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b131e] rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080d14]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">
                  Informe Técnico Oficial: Ingesta Satelital Automatizada y RAG en Supabase
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(technicalReportText);
                    setCopiedReport(true);
                    setTimeout(() => setCopiedReport(false), 2000);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? 'Copiado' : 'Copiar Informe'}</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto font-sans text-sm text-slate-200 leading-relaxed space-y-4">
              <pre className="font-mono text-xs whitespace-pre-wrap bg-[#060a10] p-4 rounded-xl border border-slate-800 text-slate-300 select-text">
                {technicalReportText}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SQL Supabase Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b131e] rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080d14]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  Script de Migración SQL: PostGIS, pgvector, Triggers y RPCs en Supabase
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlScript);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado' : 'Copiar SQL'}</span>
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-200">
              <pre className="whitespace-pre-wrap bg-[#060a10] p-4 rounded-xl border border-slate-800 text-emerald-300/90 select-text">
                {sqlScript}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
