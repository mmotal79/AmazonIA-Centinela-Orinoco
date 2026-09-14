import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Calendar, 
  RefreshCw,
  ShieldCheck,
  Building
} from 'lucide-react';
import { HeatAnomaly, MiningCluster, HydrologicalStation, IncidentReport } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { DownloadReportButton } from './DownloadReportButton';

interface BulletinGeneratorProps {
  heatAnomalies: HeatAnomaly[];
  miningClusters: MiningCluster[];
  hydrologicalStations: HydrologicalStation[];
  incidents: IncidentReport[];
}

export const BulletinGenerator: React.FC<BulletinGeneratorProps> = ({
  heatAnomalies,
  miningClusters,
  hydrologicalStations,
  incidents,
}) => {
  const [bulletinTitle, setBulletinTitle] = useState('Boletín Periódico de Alerta Temprana y Situación de Cuenca');
  const [bulletinPeriod, setBulletinPeriod] = useState('Últimas 24 Horas');
  const [bulletinContent, setBulletinContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate bulletin with Gemini AI
  const handleGenerateBulletin = async () => {
    setIsGenerating(true);

    const summaryStats = {
      totalThermalAnomalies: heatAnomalies.length,
      highConfidenceHotspots: heatAnomalies.filter((h) => h.confidence === 'high').length,
      totalMiningClusters: miningClusters.length,
      criticalMiningImpactHa: miningClusters.reduce((acc, curr) => acc + curr.estimatedHectares, 0),
      stationsInAlert: hydrologicalStations.filter((s) => s.status === 'ALERT_CRECIDA' || s.status === 'ELEVATED').length,
      activeIncidents: incidents.filter((i) => i.status === 'ACTIVO' || i.status === 'OPERATIVO_EN_CURSO').length,
    };

    try {
      const response = await fetch('/api/ai/generate-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bulletinTitle,
          period: bulletinPeriod,
          summaryStats,
          incidents: incidents.slice(0, 4),
        }),
      });

      const data = await response.json();
      if (data.bulletin) {
        setBulletinContent(data.bulletin);
      } else {
        setBulletinContent(data.error || 'No se pudo generar el boletín.');
      }
    } catch (err: any) {
      setBulletinContent(`Error generando boletín: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!bulletinContent) return;
    navigator.clipboard.writeText(bulletinContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!bulletinContent) return;
    const blob = new Blob([bulletinContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boletin_centinela_orinoco_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0b121c] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Generador Oficial de Boletines de Situación y Comandancia
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Generación automatizada de informes ejecutivos tácticos estructurados para autoridades, guardería ambiental y comunidades
          </p>
        </div>

        <div className="flex items-center gap-2">
          {bulletinContent && (
            <>
              <DownloadReportButton
                markdown={bulletinContent}
                result={{
                  zoneName: 'Cuenca del Río Orinoco - Situación General',
                  generatingEvent: {
                    title: bulletinTitle,
                    typeLabel: 'Boletín Oficial de Situación',
                    description: `Periodo evaluado: ${bulletinPeriod}`,
                  }
                }}
                label="Descargar Formateado"
              />

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Descargar (.md)</span>
              </button>
            </>
          )}

          <button
            onClick={handleGenerateBulletin}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-950/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Compilando con Gemini AI...' : 'Compilar Boletín Oficial'}</span>
          </button>
        </div>
      </div>

      {/* Inputs + Summary Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0b121c] p-4 sm:p-5 rounded-xl border border-slate-800 text-xs sm:text-sm">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[11px] sm:text-xs text-slate-300 uppercase font-mono tracking-wider block font-semibold">
            Título del Despacho
          </label>
          <input
            type="text"
            value={bulletinTitle}
            onChange={(e) => setBulletinTitle(e.target.value)}
            className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500 font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] sm:text-xs text-slate-300 uppercase font-mono tracking-wider block font-semibold">
            Período de Observación
          </label>
          <input
            type="text"
            value={bulletinPeriod}
            onChange={(e) => setBulletinPeriod(e.target.value)}
            className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500 font-medium"
          />
        </div>
      </div>

      {/* Bulletin Document Preview */}
      <div className="bg-[#0b121c] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 min-h-[500px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#070b10] border border-slate-700 flex items-center justify-center text-sky-400 font-bold font-mono text-sm">
              CEN
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                SISTEMA DE ALERTA TEMPRANA &quot;CENTINELA ORINOCO&quot;
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                DESPACHO DE INFORMACIÓN GEOESPACIAL Y SEGURIDAD AMBIENTAL
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            <div>FECHA DE CORTE: {new Date().toISOString().slice(0, 10)}</div>
            <div className="text-emerald-400 font-semibold">VALIDADO POR CENTINELA AI</div>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#060a0f] border border-slate-800/90 rounded-xl p-5 text-slate-200 text-xs leading-relaxed overflow-y-auto max-h-[600px]">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs font-mono">Sintetizando telemetría hidrológica, anomalías térmicas y clusters de minería...</p>
            </div>
          ) : bulletinContent ? (
            <MarkdownRenderer content={bulletinContent} />
          ) : (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">Ningún boletín generado todavía.</p>
              <p className="text-[11px]">Haga clic en &quot;Compilar Boletín Oficial&quot; para generar el reporte de situación con Gemini 3.7 Flash.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
