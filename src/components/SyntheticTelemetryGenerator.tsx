import React, { useState } from 'react';
import { 
  Radio, 
  Sparkles, 
  Activity, 
  Zap, 
  Sliders, 
  Layers, 
  Play, 
  RefreshCw, 
  Droplet, 
  Gauge, 
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Terminal
} from 'lucide-react';
import { HydrologicalStation, SyntheticTelemetryConfig } from '../types';

interface SyntheticTelemetryGeneratorProps {
  onInjectStations: (newStations: HydrologicalStation[]) => void;
  existingStationsCount: number;
}

export const SyntheticTelemetryGenerator: React.FC<SyntheticTelemetryGeneratorProps> = ({
  onInjectStations,
  existingStationsCount,
}) => {
  const [selectedBasin, setSelectedBasin] = useState<'VENTUARI' | 'YAPACANA' | 'CAURA' | 'CARONI' | 'ATABAPO'>('VENTUARI');
  const [nodeCount, setNodeCount] = useState<number>(4);
  const [seasonalRegime, setSeasonalRegime] = useState<'ESTIAJE' | 'CRECIDA_INVIERNO' | 'TRANSICION'>('CRECIDA_INVIERNO');
  const [includeHeavyMetalSpike, setIncludeHeavyMetalSpike] = useState<boolean>(true);
  const [miningTurbidityShock, setMiningTurbidityShock] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedNodes, setGeneratedNodes] = useState<HydrologicalStation[]>([]);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  const BASIN_PRESETS = {
    VENTUARI: {
      name: 'Subcuenca Río Ventuari (Alto Orinoco)',
      centerLat: 4.82,
      centerLng: -65.45,
      riverName: 'Río Ventuari',
      baseFlow: 3400,
      baseTurbidity: 35,
    },
    YAPACANA: {
      name: 'Complejo Hídrico Yapacana - Caño Cotúa',
      centerLat: 3.78,
      centerLng: -66.85,
      riverName: 'Caño Cotúa / Orinoco Superior',
      baseFlow: 1800,
      baseTurbidity: 65,
    },
    CAURA: {
      name: 'Cuenca del Río Caura / Salto Pará',
      centerLat: 5.92,
      centerLng: -64.55,
      riverName: 'Río Caura',
      baseFlow: 4500,
      baseTurbidity: 28,
    },
    CARONI: {
      name: 'Alto Caroní / Cuenca Ikabarú',
      centerLat: 4.45,
      centerLng: -61.85,
      riverName: 'Río Ikabarú / Caroní',
      baseFlow: 2900,
      baseTurbidity: 42,
    },
    ATABAPO: {
      name: 'Eje Fluvial Atabapo - Guaviare',
      centerLat: 3.88,
      centerLng: -67.62,
      riverName: 'Río Atabapo',
      baseFlow: 2100,
      baseTurbidity: 20, // Aguas negras típicamente bajas en sedimentos naturales
    },
  };

  const handleGenerateSyntheticMesh = () => {
    setIsGenerating(true);
    setNotificationMsg('');

    setTimeout(() => {
      const preset = BASIN_PRESETS[selectedBasin];
      const newStations: HydrologicalStation[] = [];

      for (let i = 1; i <= nodeCount; i++) {
        // Random offset within ~35km of basin center
        const latOffset = (Math.random() - 0.5) * 0.45;
        const lngOffset = (Math.random() - 0.5) * 0.45;
        const stationLat = Number((preset.centerLat + latOffset).toFixed(4));
        const stationLng = Number((preset.centerLng + lngOffset).toFixed(4));

        let currentLevel = 0;
        let alertLevel = 0;
        let criticalLevel = 0;
        let turbidity = preset.baseTurbidity + Math.floor(Math.random() * 20);
        let mercury = 0.005 + Math.random() * 0.008;
        let flow = preset.baseFlow + (Math.random() - 0.5) * 800;

        if (seasonalRegime === 'CRECIDA_INVIERNO') {
          currentLevel = Number((14.2 + Math.random() * 4.5).toFixed(2));
          alertLevel = 16.0;
          criticalLevel = 18.0;
        } else if (seasonalRegime === 'ESTIAJE') {
          currentLevel = Number((5.8 + Math.random() * 2.2).toFixed(2));
          alertLevel = 14.0;
          criticalLevel = 16.5;
        } else {
          currentLevel = Number((10.1 + Math.random() * 3.0).toFixed(2));
          alertLevel = 15.0;
          criticalLevel = 17.5;
        }

        if (miningTurbidityShock) {
          // Add heavy sediment plume
          turbidity += Math.floor(50 + Math.random() * 85);
        }

        if (includeHeavyMetalSpike) {
          // Spike of dissolved mercury
          mercury = Number((0.028 + Math.random() * 0.045).toFixed(4));
        }

        let status: HydrologicalStation['status'] = 'OPTIMAL';
        if (currentLevel >= criticalLevel) {
          status = 'ALERT_CRECIDA';
        } else if (currentLevel >= alertLevel) {
          status = 'ELEVATED';
        }

        newStations.push({
          id: `SYN-ST-${selectedBasin.slice(0, 3)}-${Date.now().toString().slice(-4)}-0${i}`,
          name: `Boya Teledetectada ${preset.riverName} [Nodo ${i}]`,
          river: preset.riverName,
          coordinates: [stationLng, stationLat],
          currentLevelM: currentLevel,
          normalLevelM: Number((alertLevel - 3.5).toFixed(2)),
          alertLevelM: alertLevel,
          criticalLevelM: criticalLevel,
          flowRateM3s: Math.round(flow),
          turbidityNtu: turbidity,
          ph: Number((6.2 + (Math.random() - 0.5) * 0.8).toFixed(2)),
          dissolvedOxygenMgL: Number((6.8 - (turbidity > 80 ? 1.8 : 0.4)).toFixed(2)),
          mercuryEstimatedPpm: Number(mercury.toFixed(4)),
          status,
          lastTelemetry: new Date().toISOString(),
        });
      }

      setGeneratedNodes(newStations);
      setIsGenerating(false);
      setNotificationMsg(`Malla de telemetría de ${newStations.length} nodos simulada con éxito.`);
    }, 450);
  };

  const handleInjectIntoPlatform = () => {
    if (generatedNodes.length === 0) return;
    onInjectStations(generatedNodes);
    setNotificationMsg(`¡${generatedNodes.length} estaciones hidrométricas inyectadas a la plataforma! Visualízalas en "Telemetría Hidrológica" y en el "Mapa GIS".`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0b121c] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Generador de Mallas y Telemetría Sintética de Cuenca
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulador de dinámicas hidrológicas, plumas de turbidez y picos de metales pesados para calibración de modelos y pruebas de estrés
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>Estaciones en Sistema:</span>
          <strong className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            {existingStationsCount} Activas
          </strong>
        </div>
      </div>

      {/* Generator Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Controls (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b121c] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-white uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Parámetros de Simulación Hidrográfica</span>
          </div>

          {/* Subbasin Selector */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium block">Subcuenca / Eje Fluvial Objetivo</label>
            <select
              value={selectedBasin}
              onChange={(e: any) => setSelectedBasin(e.target.value)}
              className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 text-emerald-300 font-mono outline-none focus:border-emerald-500"
            >
              <option value="VENTUARI">Subcuenca Río Ventuari (Alto Orinoco)</option>
              <option value="YAPACANA">Complejo Hídrico Yapacana - Caño Cotúa</option>
              <option value="CAURA">Cuenca del Río Caura / Salto Pará</option>
              <option value="CARONI">Alto Caroní / Cuenca Ikabarú</option>
              <option value="ATABAPO">Eje Fluvial Atabapo - Guaviare</option>
            </select>
          </div>

          {/* Node Count & Regime */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Nodos / Boyas (1-8)</label>
              <input
                type="number"
                min={1}
                max={8}
                value={nodeCount}
                onChange={(e) => setNodeCount(Math.min(8, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2 text-white font-mono outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Régimen Estacional</label>
              <select
                value={seasonalRegime}
                onChange={(e: any) => setSeasonalRegime(e.target.value)}
                className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2 text-sky-300 font-mono outline-none focus:border-sky-500"
              >
                <option value="CRECIDA_INVIERNO">Crecida (Invierno)</option>
                <option value="ESTIAJE">Estiaje (Verano)</option>
                <option value="TRANSICION">Transición Media</option>
              </select>
            </div>
          </div>

          {/* Environmental Shock Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
            <label className="text-slate-300 font-medium block">Vectores de Impacto Antrópico (Stress-Testing)</label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#070b10] border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={miningTurbidityShock}
                onChange={(e) => setMiningTurbidityShock(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <div>
                <span className="text-amber-300 font-medium block">Pluma de Turbidez por Hidrominería</span>
                <span className="text-[10px] text-slate-400 block">Eleva NTU a niveles de 75-150 NTU por relaves mineros</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#070b10] border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={includeHeavyMetalSpike}
                onChange={(e) => setIncludeHeavyMetalSpike(e.target.checked)}
                className="rounded accent-rose-500 w-4 h-4"
              />
              <div>
                <span className="text-rose-300 font-medium block">Pico de Concentración de Mercurio (Hg)</span>
                <span className="text-[10px] text-slate-400 block">Modela vertidos de azogue superando 0.035 ppm</span>
              </div>
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateSyntheticMesh}
            disabled={isGenerating}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generando Malla Estocástica...' : 'Generar Nodos Sintéticos'}</span>
          </button>
        </div>

        {/* Right Column: Generated Preview & Injection (7 cols) */}
        <div className="lg:col-span-7 bg-[#0b121c] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Matriz de Telemetría Generada ({generatedNodes.length} Nodos)</span>
            </div>

            {generatedNodes.length > 0 && (
              <button
                onClick={handleInjectIntoPlatform}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Inyectar en Base de Datos Viva</span>
              </button>
            )}
          </div>

          {notificationMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-200 flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notificationMsg}</span>
            </div>
          )}

          {generatedNodes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <Gauge className="w-8 h-8 opacity-40" />
              <p className="text-xs">No se ha generado ninguna malla aún.</p>
              <span className="text-[10px] text-slate-600">Configure los parámetros a la izquierda y presione "Generar Nodos Sintéticos"</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {generatedNodes.map((node) => (
                <div
                  key={node.id}
                  className="bg-[#070b10] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 transition-all space-y-2.5 text-xs font-mono"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800">
                        {node.id}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1 font-sans">{node.name}</h4>
                    </div>

                    <span className="text-[10px] text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {node.coordinates[1]}°N, {node.coordinates[0]}°W
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[11px] bg-[#0b121c] p-2 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Cota Nivel</span>
                      <strong className="text-sky-300">{node.currentLevelM} m</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Caudal</span>
                      <strong className="text-slate-200">{node.flowRateM3s} m³/s</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Turbidez</span>
                      <strong className={node.turbidityNtu > 60 ? 'text-amber-400' : 'text-emerald-400'}>
                        {node.turbidityNtu} NTU
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Mercurio (Hg)</span>
                      <strong className={node.mercuryEstimatedPpm > 0.02 ? 'text-rose-400' : 'text-slate-400'}>
                        {node.mercuryEstimatedPpm} ppm
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
