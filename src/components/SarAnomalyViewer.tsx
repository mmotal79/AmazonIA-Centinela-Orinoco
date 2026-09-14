import React, { useState } from 'react';
import { 
  Radar, 
  Satellite, 
  AlertOctagon, 
  CheckCircle2, 
  Layers, 
  Filter, 
  Sparkles, 
  MapPin, 
  RefreshCw, 
  Eye, 
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Activity,
  Flame
} from 'lucide-react';
import { SarRadarAnomaly } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SarAnomalyViewerProps {
  anomalies: SarRadarAnomaly[];
  onVerifyAnomaly: (id: string, newStatus: SarRadarAnomaly['status']) => void;
  onSelectOnMap?: (anomaly: SarRadarAnomaly) => void;
  onDispatchAlert?: (anomaly: SarRadarAnomaly) => void;
}

export const SarAnomalyViewer: React.FC<SarAnomalyViewerProps> = ({
  anomalies,
  onVerifyAnomaly,
  onSelectOnMap,
  onDispatchAlert,
}) => {
  const [selectedBasin, setSelectedBasin] = useState<string>('ALL');
  const [selectedActivity, setSelectedActivity] = useState<string>('ALL');
  const [activeAnomalyId, setActiveAnomalyId] = useState<string>(anomalies[0]?.id || '');
  const [isAiEvaluating, setIsAiEvaluating] = useState<boolean>(false);
  const [aiAuditReport, setAiAuditReport] = useState<string>('');

  const basins = ['ALL', ...Array.from(new Set(anomalies.map((a) => a.basin)))];

  const filteredAnomalies = anomalies.filter((a) => {
    const basinMatch = selectedBasin === 'ALL' || a.basin === selectedBasin;
    const actMatch = selectedActivity === 'ALL' || a.presumedActivity === selectedActivity;
    return basinMatch && actMatch;
  });

  const currentAnomaly = anomalies.find((a) => a.id === activeAnomalyId) || anomalies[0];

  const handleEvaluateWithAi = async () => {
    if (!currentAnomaly) return;
    setIsAiEvaluating(true);
    setAiAuditReport('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Evalúa la siguiente anomalía detectada por radar satelital Sentinel-1 SAR en la Amazonía/Orinoco:
- Sector: ${currentAnomaly.sectorName} (${currentAnomaly.basin})
- Coordenadas: ${currentAnomaly.latitude}°N, ${currentAnomaly.longitude}°W
- Pérdida de Coherencia Interferométrica: ${currentAnomaly.coherenceLossPercent}%
- Variación de Retrodispersión SAR (dB): ${currentAnomaly.sarBackscatterChangeDb} dB
- Descenso de NDVI óptico: ${currentAnomaly.opticalNdviDropPercent}%
- Superficie alterada estimada: ${currentAnomaly.affectedSurfaceHa} Hectáreas
- Probabilidad de presencia de dragas de aluvión: ${currentAnomaly.dredgePresenceProbability}%
- Notas técnicas: ${currentAnomaly.notes}

Genera un dictamen técnico de auditoría satelital que determine:
1. Nivel de certidumbre de minería ilegal de aluvión vs deforestación natural.
2. Mecanismo físico del eco radar (doble rebote en agua con metales, desmonte de dosel).
3. Recomendación táctica para la unidad de guardería ambiental.`,
            },
          ],
        }),
      });

      const data = await response.json();
      setAiAuditReport(data.reply || 'Dictamen completado con éxito.');
    } catch (err: any) {
      setAiAuditReport(`Error al evaluar con IA: ${err.message}`);
    } finally {
      setIsAiEvaluating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0b121c] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Visor de Detección Satelital SAR & Variaciones de Cobertura
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Procesamiento de radar Sentinel-1 SAR (banda C) y cambios interferométricos de coherencia para presunción de minería ilegal y dragas
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 bg-[#060a0f] px-3 py-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Cuenca:</span>
            <select
              value={selectedBasin}
              onChange={(e) => setSelectedBasin(e.target.value)}
              className="bg-transparent text-amber-300 font-medium outline-none cursor-pointer"
            >
              {basins.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-slate-200">
                  {b === 'ALL' ? 'Todas las Cuencas' : b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#060a0f] px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Actividad:</span>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="bg-transparent text-amber-300 font-medium outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todos los Patrones</option>
              <option value="MINERIA_ALUVION_BALSAS" className="bg-slate-900">Minería Aluvión / Balsas</option>
              <option value="DEFORESTACION_REPENTINA" className="bg-slate-900">Deforestación Repentina</option>
              <option value="PISCINA_RELAVES_LODO" className="bg-slate-900">Piscinas de Relave</option>
              <option value="PISTA_CLANDESTINA_EXPANSION" className="bg-slate-900">Pista Clandestina</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Detail Radar Inspector (Left) + Anomaly Catalog (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deep Satellite Radar Inspector (7 cols) */}
        {currentAnomaly && (
          <div className="lg:col-span-7 bg-[#0b121c] border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {currentAnomaly.code}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Sentinel-1 SAR C-Band
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{currentAnomaly.sectorName}</h3>
                <p className="text-xs text-slate-400">{currentAnomaly.basin}</p>
              </div>

              <div className="text-right">
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                  currentAnomaly.severity === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {currentAnomaly.severity}
                </span>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Pase Satelital: {currentAnomaly.currentPassDate}
                </div>
              </div>
            </div>

            {/* Radar Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-[#070b10] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Pérdida Coherencia</span>
                <span className="text-base font-bold text-amber-400">
                  {currentAnomaly.coherenceLossPercent}%
                </span>
                <span className="text-[9px] text-slate-500 block">Interferometría InSAR</span>
              </div>

              <div className="bg-[#070b10] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Retrodispersión (dB)</span>
                <span className={`text-base font-bold ${currentAnomaly.sarBackscatterChangeDb > 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                  {currentAnomaly.sarBackscatterChangeDb > 0 ? `+${currentAnomaly.sarBackscatterChangeDb}` : currentAnomaly.sarBackscatterChangeDb} dB
                </span>
                <span className="text-[9px] text-slate-500 block">Firma VV/VH</span>
              </div>

              <div className="bg-[#070b10] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Caída NDVI Óptico</span>
                <span className="text-base font-bold text-red-400">
                  -{currentAnomaly.opticalNdviDropPercent}%
                </span>
                <span className="text-[9px] text-slate-500 block">Sentinel-2 MSI</span>
              </div>

              <div className="bg-[#070b10] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Probabilidad Draga</span>
                <span className="text-base font-bold text-emerald-400">
                  {currentAnomaly.dredgePresenceProbability}%
                </span>
                <span className="text-[9px] text-slate-500 block">Modelo Predictivo</span>
              </div>
            </div>

            {/* Radar Diagnosis & Technical Notes */}
            <div className="bg-[#070b10] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Firma Radar y Diagnóstico de Cobertura
              </span>
              <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                {currentAnomaly.notes}
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Superficie Afectada: <strong className="text-amber-400">{currentAnomaly.affectedSurfaceHa} Ha</strong></span>
                <span>Coordenadas: <strong className="text-sky-400">{currentAnomaly.latitude.toFixed(4)}°N, {currentAnomaly.longitude.toFixed(4)}°W</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap pt-1">
              <button
                onClick={handleEvaluateWithAi}
                disabled={isAiEvaluating}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-amber-950/40 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiEvaluating ? 'Auditando Eco Radar...' : 'Auditoría Satelital IA'}</span>
              </button>

              {onSelectOnMap && (
                <button
                  onClick={() => onSelectOnMap(currentAnomaly)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Centrar en Mapa</span>
                </button>
              )}

              {onDispatchAlert && (
                <button
                  onClick={() => onDispatchAlert(currentAnomaly)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg text-xs font-medium border border-red-800 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Despachar Alerta Operativa</span>
                </button>
              )}
            </div>

            {/* AI Audit Report Box */}
            {aiAuditReport && (
              <div className="bg-[#060a0f] border border-amber-500/40 rounded-xl p-4 space-y-2 text-xs text-slate-300 leading-relaxed font-sans shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Dictamen Técnico de Teledetección SAR (Gemini 3.7)
                  </span>
                </div>
                <div className="text-[11px] leading-relaxed">
                  <MarkdownRenderer content={aiAuditReport} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Column: SAR Anomalies List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Anomalías de Radar Detectadas ({filteredAnomalies.length})
            </label>
            <span className="text-[10px] font-mono text-emerald-400">
              Sentinel-1 Coherence Pipeline
            </span>
          </div>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredAnomalies.map((item) => {
              const isSelected = item.id === activeAnomalyId;
              const isCritical = item.severity === 'CRITICAL';

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveAnomalyId(item.id)}
                  className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#0f1c2d] border-amber-500/80 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30'
                      : 'bg-[#0b121c] border-slate-800/80 hover:border-slate-700 hover:bg-[#0d1624]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">
                        {item.code}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{item.basin}</span>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      isCritical ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {item.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mt-1.5">{item.sectorName}</h4>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Pérdida Coh.</span>
                      <strong className="text-amber-400">{item.coherenceLossPercent}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Área</span>
                      <strong className="text-slate-200">{item.affectedSurfaceHa} Ha</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Prob. Draga</span>
                      <strong className="text-emerald-400">{item.dredgePresenceProbability}%</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
