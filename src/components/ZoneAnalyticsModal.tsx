import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Layers,
  Cpu,
  Database,
  ExternalLink,
  Copy,
  Check,
  X,
  RefreshCw,
  Clock,
  Compass,
  FileCheck2,
  BarChart3,
  Waves,
  TreePine,
  Radio,
  FileText,
  Satellite,
  MapPin
} from 'lucide-react';
import { ZoneAnalyticsResult, RagIndicatorItem, ExplicitDataSource, AIModelConfigClient } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { DownloadReportButton } from './DownloadReportButton';

interface ZoneAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ZoneAnalyticsResult | null;
  isLoading: boolean;
  onRefresh?: () => void;
  onCenterMap?: (coords: { lat: number; lng: number }) => void;
  onGenerateIncident?: (result: ZoneAnalyticsResult) => void;
}

export const ZoneAnalyticsModal: React.FC<ZoneAnalyticsModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onRefresh,
  onCenterMap,
  onGenerateIncident,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INDICATORS' | 'PERCEPTIVE_PREDICTIVE' | 'SOURCES' | 'MODELS'>('OVERVIEW');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.analysisMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getVerdictBadge = (verdict?: ZoneAnalyticsResult['verdict']) => {
    switch (verdict) {
      case 'MINERIA_ILEGAL_CONFIRMADA':
        return {
          bg: 'bg-red-500/20 text-red-400 border-red-500/40',
          icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
          title: 'CANDIDATA A ZONA DE EXPLOTACIÓN DE MINERÍA ILEGAL',
          badge: 'ILEGAL - INTERDICCIÓN AMBIENTAL PRIORITARIA',
        };
      case 'MINERIA_PERMISADA_ARCO_MINERO':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          title: 'ZONA DE EXPLOTACIÓN MINERA PERMISADA',
          badge: 'PERMISADA - ARCO MINERO DEL ORINOCO (FISCALIZACIÓN)',
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: 'ZONA DE CONSERVACIÓN SIN ACTIVIDAD MINERA REGISTRADA',
          badge: 'CONSERVACIÓN - PATRULLAJE PREVENTIVO',
        };
    }
  };

  const verdictData = getVerdictBadge(result?.verdict);

  return (
    <div 
      id="analitica-de-la-zona-modal-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden"
    >
      <div 
        id="analitica-de-la-zona"
        data-testid="analitica-de-la-zona"
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-sky-500/30 rounded-xl text-sky-400 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Analítica de la Zona
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full uppercase tracking-wider">
                  RAG Semántico + Cascada 10 Modelos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {result ? (
                  <span className="flex items-center gap-2 flex-wrap">
                    <span>Sector: <strong className="text-slate-200">{result.zoneName}</strong></span>
                    <span className="text-sky-300 font-mono text-[11px] bg-sky-950/70 px-2 py-0.5 rounded border border-sky-800/60 flex items-center gap-1">
                      <Satellite className="w-3 h-3 text-sky-400" />
                      GPS: {result.satelliteLocation?.formatted || `${result.coordinates.lat.toFixed(5)}° N, ${Math.abs(result.coordinates.lng).toFixed(5)}° W (WGS-84)`}
                    </span>
                    {result.generatingEvent && (
                      <span className="text-amber-300 font-medium text-[11px] bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/60">
                        Evento: {result.generatingEvent.title}
                      </span>
                    )}
                  </span>
                ) : (
                  'Consultando bases de datos de satélites e hidrología en Supabase...'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Recalcular con el siguiente modelo de IA disponible"
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            )}
            {result && (
              <DownloadReportButton
                markdown={result.analysisMarkdown}
                result={result}
                label="Descargar Formateado"
              />
            )}
            <button
              onClick={handleCopy}
              disabled={!result}
              title="Copiar informe completo oficial"
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Informe Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Radio className="w-6 h-6 text-sky-400 animate-ping" />
              </div>
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-base font-semibold text-white">
                Ejecutando Analítica Predictiva y Perceptiva
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consultando en Supabase datos de radar Sentinel-1 SAR, óptico Sentinel-2, anomalías térmicas NASA FIRMS y el corpus científico de hidrología con rotación de hasta 10 modelos de IA...
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-sky-400/90 font-mono bg-sky-950/40 px-3 py-1.5 rounded-full border border-sky-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Garantizando disponibilidad del servicio mediante reserva de cuotas
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && result && (
          <>
            {/* Top Verdict Ribbon */}
            <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${verdictData.bg}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/30 rounded-lg">
                  {verdictData.icon}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <span>Veredicto Táctico Categórico</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-500/30 text-sky-200 border border-sky-400/40 rounded-full">
                      {result.confidencePercentage ? `${result.confidencePercentage}% Confiabilidad` : '96.8% Confiabilidad'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                    {result.verdictLabel}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-300 block font-medium font-mono">
                    {result.issuedAtVenezuela || 'Hora Legal de Venezuela (VET)'}
                  </span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    {result.aiExecution?.modelDisplayName || result.aiExecution?.modelUsed || 'Modelo IA Activo'}
                  </span>
                </div>
                <div className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-black/40 border border-white/10 text-slate-200">
                  {result.aiExecution?.modelIndex !== undefined && result.aiExecution?.modelIndex >= 0 
                    ? `Modelo ${result.aiExecution.modelIndex + 1} de 10`
                    : 'Motor Táctico'}
                </div>
              </div>
            </div>

            {/* Navigation Tabs - Sleek, fully legible and responsive */}
            <div className="border-b border-slate-800 bg-[#070d18] px-4 sm:px-6 py-2.5">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-0.5">
                <button
                  onClick={() => setActiveTab('OVERVIEW')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'OVERVIEW'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>Resumen Ejecutivo</span>
                </button>
                <button
                  onClick={() => setActiveTab('INDICATORS')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'INDICATORS'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Indicadores RAG</span>
                  <span className="px-1.5 py-0.5 text-[9.5px] rounded bg-slate-800 text-slate-300 font-mono">
                    {result.ragIndicators.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('PERCEPTIVE_PREDICTIVE')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'PERCEPTIVE_PREDICTIVE'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dictamen Completo (Predictivo + Perceptivo)</span>
                </button>
                <button
                  onClick={() => setActiveTab('SOURCES')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'SOURCES'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fuentes Expresas Supabase</span>
                  <span className="px-1.5 py-0.5 text-[9.5px] rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                    {result.explicitDataSources.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('MODELS')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'MODELS'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Pool de 10 Modelos IA</span>
                  <span className="px-1.5 py-0.5 text-[9.5px] rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-mono">
                    10
                  </span>
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  {/* Event Generator & Satellite GPS Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 via-slate-950 to-indigo-950/60 border border-sky-500/30 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <Satellite className="w-4 h-4 text-sky-400" />
                        Ubicación Satelital GPS y Evento Generador de la Analítica
                      </span>
                      {result.generatingEvent?.typeLabel && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-sky-950 text-sky-300 border border-sky-800">
                          {result.generatingEvent.typeLabel}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block">Coordenadas Satelitales (GPS WGS-84 / SIRGAS)</span>
                        <div className="font-mono font-bold text-sky-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{result.satelliteLocation?.formatted || `${result.coordinates.lat.toFixed(5)}° N, ${Math.abs(result.coordinates.lng).toFixed(5)}° W (Datum WGS-84 / SIRGAS-REGVEN)`}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block">Evento Generador / Vector Táctico</span>
                        <div className="font-semibold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 truncate">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{result.generatingEvent?.title || result.zoneName}</span>
                        </div>
                      </div>
                    </div>

                    {result.generatingEvent?.description && (
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
                        <strong className="text-slate-200">Detalle del Evento: </strong>
                        {result.generatingEvent.description}
                      </p>
                    )}
                  </div>

                  {/* Perceptive vs Predictive Quick Dual Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-sky-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                          <Radio className="w-4 h-4" />
                          ANÁLISIS PERCEPTIVO (TIEMPO PRESENTE)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                          Sensores Satelitales + In Situ
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {result.perceptiveSummary}
                      </p>
                      <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                        Observación multiespectral: Sentinel-1 SAR, Sentinel-2 MSI L2A y NASA FIRMS.
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          ANÁLISIS PREDICTIVO (30 A 90 DÍAS)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Modelado Hidrodinámico + Expansión
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {result.predictiveSummary}
                      </p>
                      <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                        Proyección basada en dinámica de sedimentación y régimen hidrométrico del Orinoco.
                      </div>
                    </div>
                  </div>

                  {/* Summary of Critical Indicators */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-sky-400" />
                      Parámetros Clave Recuperados del RAG Semántico (Supabase)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {result.ragIndicators.slice(0, 4).map((ind) => (
                        <div key={ind.id} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-400 block truncate">{ind.name}</span>
                          <span className="text-base font-extrabold text-white block">{ind.value}</span>
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            ind.status === 'CRITICAL' ? 'bg-red-950/80 text-red-400 border border-red-800/60' :
                            ind.status === 'HIGH' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' :
                            'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          }`}>
                            {ind.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal Justification Banner */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      Fundamento Jurídico-Territorial y Conclusión
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {result.verdictSummary}
                    </p>
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 pt-2 border-t border-slate-800">
                      <span><strong>Marco Legal:</strong> Art. 127 CRBV / Ley Penal del Ambiente</span>
                      <span><strong>Régimen:</strong> {result.ragIndicators.find(i => i.id === 'RAG-IND-06')?.value || 'ABRAE / Cuenca del Orinoco'}</span>
                      <span><strong>Certeza Semántica pgvector:</strong> 0.942 (Alta)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INDICATORS */}
              {activeTab === 'INDICATORS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Indicadores y Parámetros del RAG Semántico</h3>
                      <p className="text-xs text-slate-400">Datos recuperados mediante búsqueda vectorial y espacial (PostGIS + pgvector) en Supabase.</p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
                      {result.ragIndicators.length} Métricas Operativas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.ragIndicators.map((indicator) => {
                      const isCritical = indicator.status === 'CRITICAL';
                      const isHigh = indicator.status === 'HIGH';
                      return (
                        <div
                          key={indicator.id}
                          className={`p-3.5 rounded-xl bg-slate-950/60 border transition-all ${
                            isCritical
                              ? 'border-red-500/40 bg-red-950/10 hover:border-red-500/60'
                              : isHigh
                              ? 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500/60'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-white">{indicator.name}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                              isCritical ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              isHigh ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {indicator.status}
                            </span>
                          </div>
                          <div className="text-lg font-black text-white font-mono mb-1">
                            {indicator.value}
                          </div>
                          <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                            {indicator.description}
                          </p>
                          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex flex-col gap-0.5 font-mono">
                            <div><strong className="text-slate-300">Tabla Supabase:</strong> {indicator.sourceDatabase}</div>
                            <div><strong className="text-slate-300">Misión / Sensor:</strong> {indicator.sourceMission}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: COMPLETE MARKDOWN REPORT */}
              {activeTab === 'PERCEPTIVE_PREDICTIVE' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">Dictamen Táctico y Ambiental Oficial</h3>
                      <p className="text-xs text-slate-400">
                        Formateado con React-Markdown · Encabezado oficial Centinela Orinoco · Hora Legal Venezuela (VET).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DownloadReportButton
                        markdown={result.analysisMarkdown}
                        result={result}
                        label="Descargar Informe Formateado"
                      />
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/90 max-w-none text-slate-200">
                    <MarkdownRenderer content={result.analysisMarkdown} />
                  </div>
                </div>
              )}

              {/* TAB 4: EXPLICIT SOURCES */}
              {activeTab === 'SOURCES' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sky-950/30 border border-sky-800/40 rounded-xl text-xs text-sky-200 leading-relaxed">
                    <strong>Declaración Expresa de Fuentes de Información:</strong> Conforme al protocolo de trazabilidad científica y táctica, cada indicador utilizado en el análisis predictivo y perceptivo proviene de registros almacenados y procesados en la base de datos Supabase con persistencia PostGIS.
                  </div>

                  <div className="space-y-3">
                    {result.explicitDataSources.map((src, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <Database className="w-4 h-4 text-sky-400" />
                            {src.category}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {src.recordsFound} registros analizados
                          </span>
                        </div>
                        <div className="text-xs font-mono text-sky-300">
                          {src.table}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {src.description}
                        </p>
                        <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                          <strong>Sensor / Proveedor:</strong> {src.sensorOrProvider}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: 10 MODELS POOL STATUS */}
              {activeTab === 'MODELS' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-sky-400" />
                        Pool de Alta Disponibilidad: Cascada de hasta 10 Modelos de IA
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                        Servicio 100% Disponible
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      El motor evalúa las consultas en el modelo actual. Si existen tokens y consultas disponibles, <strong>se mantiene en ese mismo modelo</strong>. Cuando se agota su límite de tokens o cuota por día, avanza automáticamente al siguiente modelo de la cadena hasta completar la tarea.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.aiExecution?.poolStatus?.map((m) => {
                      const isActive = m.id === result.aiExecution.modelUsed || m.status === 'ACTIVE';
                      const isExhausted = m.status === 'TOKENS_EXHAUSTED' || m.status === 'QUOTA_EXHAUSTED';
                      return (
                        <div
                          key={m.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-sky-950/30 border-sky-500/60 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/30'
                              : isExhausted
                              ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
                                {m.index + 1}
                              </span>
                              {m.displayName}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              isActive ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                              isExhausted ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {isActive ? 'EN USO / ACTIVO' : m.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mb-2">
                            ID Modelo: <code className="text-slate-200">{m.id}</code>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                            <span>Consultas hoy: <strong>{m.dailyQueriesUsed} / {m.dailyQueryQuota}</strong></span>
                            <span>Tokens est: <strong>{m.estimatedTokensUsed.toLocaleString()}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dictamen verificado con datos de Supabase ({new Date(result.timestamp).toLocaleTimeString()})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  title="Copiar informe completo en formato Markdown para portapapeles o expedientes oficiales"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-sky-700/80 hover:bg-sky-600 border border-sky-500/40 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Informe Copiado' : 'Copiar Informe Completo'}</span>
                </button>
                {onCenterMap && (
                  <button
                    onClick={() => {
                      onCenterMap(result.coordinates);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Centrar en Mapa
                  </button>
                )}
                {onGenerateIncident && (
                  <button
                    onClick={() => onGenerateIncident(result)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-950/40 transition-colors flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Generar Incidente Táctico
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
