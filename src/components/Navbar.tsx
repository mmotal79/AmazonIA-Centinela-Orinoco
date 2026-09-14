import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Map, 
  Activity, 
  FileText, 
  Database, 
  Sparkles, 
  Radio, 
  Layers,
  PlusCircle,
  Download,
  Terminal,
  Bot,
  BookOpen,
  Radar,
  Sliders,
  Workflow
} from 'lucide-react';
import { ViewMode } from '../types';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface NavbarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenNewIncidentModal: () => void;
  onOpenAiDrawer: () => void;
  activeIncidentsCount: number;
  thermalAnomaliesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenNewIncidentModal,
  onOpenAiDrawer,
  activeIncidentsCount,
  thermalAnomaliesCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.toUTCString().replace('GMT', 'UTC').split(' ').slice(4, 5).join('');
      const local = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCurrentTime(`${local} (LOC) | ${utc} (UTC)`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'MAP_SITUATION', label: 'Sala GIS', icon: Map },
    { id: 'LIVE_PIPELINE', label: 'Ingesta & RAG PostGIS', icon: Workflow },
    { id: 'SCIENTIFIC_CORPUS', label: 'Corpus Científico', icon: BookOpen },
    { id: 'SAR_RADAR_ANOMALIES', label: 'Radar SAR', icon: Radar },
    { id: 'SYNTHETIC_TELEMETRY', label: 'Simulador Telemetría', icon: Sliders },
    { id: 'TELEMETRY', label: 'Telemetría Hidrológica', icon: Activity },
    { id: 'INCIDENTS', label: 'Incidentes', icon: ShieldAlert, badge: activeIncidentsCount },
    { id: 'SUPABASE_CONSOLE', label: 'Postgres RPCs', icon: Database },
    { id: 'AI_INTELLIGENCE', label: 'Inteligencia IA', icon: Sparkles },
    { id: 'BULLETIN_GENERATOR', label: 'Boletín Oficial', icon: FileText },
  ];

  return (
    <header id="centinela-navbar" className="bg-[#0b1118] border-b border-slate-800 text-slate-200 sticky top-0 z-30 select-none">
      {/* Top Status Bar */}
      <div className="px-2 sm:px-4 py-1.5 bg-[#060a0f] border-b border-slate-900/80 flex items-center justify-between text-xs text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <Radio className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">SISTEMA CENTINELA OPERATIVO</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-slate-400 text-[11px] hidden md:inline">RPCs Supabase / GeoJSON:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
              isSupabaseConfigured 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {isSupabaseConfigured ? 'POSTGRES LIVE (RPC)' : 'GEOJSON EMULADO (READY)'}
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="items-center gap-1.5 text-sky-400 hidden sm:flex">
            <Sparkles className="w-3 h-3" />
            <span className="text-[11px] font-mono">GEMINI 3.7 FLASH INTEGRADO</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] shrink-0 ml-3">
          <span className="text-amber-400 font-medium">
            🔥 {thermalAnomaliesCount} Focos Térmicos (VIIRS)
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-300">{currentTime}</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-2 sm:px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        {/* Brand & Mission */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-sky-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-500/30">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold tracking-wider text-sm sm:text-base text-white uppercase font-sans whitespace-nowrap">
                Centinela Orinoco
              </h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                v2.6 GIS
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden xs:block sm:block">
              Vigilancia Geoespacial, Hidrología y Defensa de la Cuenca
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0 md:order-last">
          <button
            id="btn-quick-new-incident"
            onClick={onOpenNewIncidentModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-medium rounded-md border border-red-500/40 shadow-sm transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Registrar </span>Alerta
          </button>

          <button
            id="btn-quick-ai-assistant"
            onClick={onOpenAiDrawer}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-medium rounded-md border border-sky-400/30 shadow-md shadow-sky-950/40 transition-all whitespace-nowrap"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Asistente IA</span>
          </button>
        </div>

        {/* Navigation Tabs (Scrollable on mobile) */}
        <nav className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full touch-pan-x scrollbar-none w-full md:w-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id.toLowerCase()}`}
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
