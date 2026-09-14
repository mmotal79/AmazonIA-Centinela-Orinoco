import React, { useState } from 'react';
import { 
  Droplets, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  RefreshCw,
  Waves,
  Gauge,
  FlaskConical,
  Radio
} from 'lucide-react';
import { HydrologicalStation } from '../types';

interface TelemetryViewProps {
  stations: HydrologicalStation[];
  onRefresh: () => void;
  onSelectStationOnMap?: (station: HydrologicalStation) => void;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({
  stations,
  onRefresh,
  onSelectStationOnMap,
}) => {
  const [selectedRiverFilter, setSelectedRiverFilter] = useState<string>('ALL');
  const [activeStationId, setActiveStationId] = useState<string>(stations[0]?.id || '');

  const rivers = ['ALL', ...Array.from(new Set(stations.map((s) => s.river)))];

  const filteredStations = selectedRiverFilter === 'ALL'
    ? stations
    : stations.filter((s) => s.river === selectedRiverFilter);

  const currentStation = stations.find((s) => s.id === activeStationId) || stations[0];

  const calculateLevelPercentage = (station: HydrologicalStation) => {
    const range = station.criticalLevelM * 1.1;
    return Math.min(100, Math.max(10, (station.currentLevelM / range) * 100));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0b121c] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Red de Telemetría Hidrométrica y Calidad de Aguas
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo en tiempo real del Río Orinoco, Caura, Caroní, Atabapo y Ventuari con cotas de alerta y metales pesados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#060a0f] px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Cuenca / Río:</span>
            <select
              value={selectedRiverFilter}
              onChange={(e) => setSelectedRiverFilter(e.target.value)}
              className="bg-transparent text-sky-300 font-medium outline-none cursor-pointer"
            >
              {rivers.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-slate-200">
                  {r === 'ALL' ? 'Todas las Cuencas' : r}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Actualizar Sensores</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Station Detail + Station Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Detailed Station Inspector */}
        {currentStation && (
          <div className="lg:col-span-1 bg-[#0b121c] border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-sky-400 tracking-wider">
                  Estación Seleccionada ({currentStation.id})
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{currentStation.name}</h3>
                <p className="text-xs text-slate-400">{currentStation.river}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                currentStation.status === 'ALERT_CRECIDA'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : currentStation.status === 'ELEVATED'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {currentStation.status}
              </span>
            </div>

            {/* Level Gauge Visual */}
            <div className="bg-[#070b10] p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-sky-400" />
                  Nivel Hidrométrico Actual
                </span>
                <span className="text-lg font-bold font-mono text-sky-400">
                  {currentStation.currentLevelM.toFixed(2)} m
                </span>
              </div>

              {/* Progress Bar with benchmarks */}
              <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    currentStation.currentLevelM >= currentStation.alertLevelM
                      ? 'bg-gradient-to-r from-amber-500 to-red-500'
                      : 'bg-gradient-to-r from-sky-600 to-emerald-500'
                  }`}
                  style={{ width: `${calculateLevelPercentage(currentStation)}%` }}
                />
              </div>

              {/* Threshold Labels */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Normal: {currentStation.normalLevelM}m</span>
                <span className="text-amber-400">Alerta: {currentStation.alertLevelM}m</span>
                <span className="text-red-400">Crítico: {currentStation.criticalLevelM}m</span>
              </div>
            </div>

            {/* Hydrochemical and Environmental Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#070b10] p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span>Caudal Estimado</span>
                </div>
                <p className="text-base font-bold font-mono text-slate-100">
                  {currentStation.flowRateM3s.toLocaleString()} <span className="text-xs font-normal text-slate-400">m³/s</span>
                </p>
              </div>

              <div className="bg-[#070b10] p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Turbidez del Agua</span>
                </div>
                <p className={`text-base font-bold font-mono ${currentStation.turbidityNtu > 60 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {currentStation.turbidityNtu} <span className="text-xs font-normal text-slate-400">NTU</span>
                </p>
              </div>

              <div className="bg-[#070b10] p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                  <span>pH / Oxígeno Disuelto</span>
                </div>
                <p className="text-sm font-bold font-mono text-slate-100">
                  {currentStation.ph} pH | {currentStation.dissolvedOxygenMgL} mg/L
                </p>
              </div>

              <div className="bg-[#070b10] p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Mercurio Est. (Hg)</span>
                </div>
                <p className="text-sm font-bold font-mono text-rose-400">
                  {currentStation.mercuryEstimatedPpm} <span className="text-xs font-normal text-slate-400">ppm</span>
                </p>
                <span className="text-[9px] text-slate-500 font-mono">Límite OMS: 0.001 ppm</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
              <span>Última telemetría: {currentStation.lastTelemetry}</span>
              {onSelectStationOnMap && (
                <button
                  onClick={() => onSelectStationOnMap(currentStation)}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-sans font-medium hover:underline cursor-pointer"
                >
                  <span>Ver en Sala GIS</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right: Station Grid */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredStations.map((station) => {
              const isSelected = station.id === activeStationId;
              const isAlert = station.status === 'ALERT_CRECIDA' || station.status === 'ELEVATED';

              return (
                <div
                  key={station.id}
                  onClick={() => setActiveStationId(station.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#0f1a29] border-sky-500/80 shadow-lg shadow-sky-950/40'
                      : 'bg-[#0b121c] border-slate-800/80 hover:border-slate-700 hover:bg-[#0d1624]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{station.id}</span>
                      <h4 className="text-sm font-bold text-white">{station.name}</h4>
                      <p className="text-[11px] text-slate-400">{station.river}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      isAlert ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {station.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Nivel</span>
                      <strong className="text-sky-400">{station.currentLevelM}m</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Turbidez</span>
                      <strong className={station.turbidityNtu > 60 ? 'text-amber-400' : 'text-slate-300'}>
                        {station.turbidityNtu} NTU
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Mercurio</span>
                      <strong className="text-rose-400">{station.mercuryEstimatedPpm} ppm</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Environmental Compliance Info Box */}
          <div className="bg-[#0b121c] border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-medium">Protocolo Hidrológico de Alerta Temprana</strong>
                <span className="text-slate-400 text-[11px]">
                  Integración telemétrica satelital y calibración de estaciones hidrométricas del Bajo y Alto Orinoco
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
