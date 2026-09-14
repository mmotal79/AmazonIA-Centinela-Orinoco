import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  FileDown, 
  FileText, 
  Globe, 
  Printer, 
  ChevronDown, 
  Check, 
  Sparkles,
  FileCode
} from 'lucide-react';
import { ZoneAnalyticsResult } from '../types';
import { 
  downloadReportAsWord, 
  downloadReportAsHtml, 
  downloadReportAsCleanText, 
  printFormattedReport 
} from '../utils/reportExporter';

interface DownloadReportButtonProps {
  markdown: string;
  result: ZoneAnalyticsResult | { zoneName: string; coordinates?: { lat: number; lng: number }; [key: string]: any };
  variant?: 'primary' | 'secondary' | 'compact';
  label?: string;
}

export const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({
  markdown,
  result,
  variant = 'primary',
  label = 'Descargar Informe Formateado',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDownload = (format: 'doc' | 'html' | 'txt' | 'print') => {
    if (!markdown) return;

    if (format === 'doc') {
      downloadReportAsWord(markdown, result);
    } else if (format === 'html') {
      downloadReportAsHtml(markdown, result);
    } else if (format === 'txt') {
      downloadReportAsCleanText(markdown, result);
    } else if (format === 'print') {
      printFormattedReport(markdown, result);
    }

    setDownloadedFormat(format);
    setIsOpen(false);
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const buttonBaseClass = variant === 'compact'
    ? 'px-2.5 py-1 text-[11px]'
    : variant === 'secondary'
    ? 'px-3 py-1.5 text-xs'
    : 'px-3.5 py-1.5 text-xs';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div className="inline-flex rounded-lg shadow-sm border border-emerald-500/40 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 transition-all">
        {/* Main Action: Downloads Formatted Word (.doc) by default */}
        <button
          type="button"
          onClick={() => handleDownload('doc')}
          disabled={!markdown}
          title="Descargar informe oficial formateado (sin símbolos markdown)"
          className={`flex items-center gap-1.5 font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer ${buttonBaseClass} rounded-l-lg`}
        >
          {downloadedFormat ? (
            <Check className="w-3.5 h-3.5 text-emerald-200" />
          ) : (
            <FileDown className="w-3.5 h-3.5 text-emerald-100" />
          )}
          <span className="truncate">
            {downloadedFormat ? '¡Informe Descargado!' : label}
          </span>
        </button>

        {/* Dropdown Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={!markdown}
          title="Seleccionar formato de descarga"
          className="px-2 py-1.5 border-l border-emerald-600/60 text-emerald-100 hover:text-white hover:bg-emerald-600/40 rounded-r-lg transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Options Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-[#09111c] border border-emerald-500/30 shadow-2xl shadow-black/90 py-2 z-[99999] text-xs divide-y divide-slate-800 backdrop-blur-xl">
          <div className="px-3 py-1.5 text-[10px] uppercase font-mono text-emerald-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Formatos Sin Sintaxis Markdown
            </span>
            <span className="text-slate-400 font-sans normal-case text-[9px]">Limpio</span>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => handleDownload('doc')}
              className="w-full text-left px-3.5 py-2 hover:bg-emerald-950/40 hover:text-emerald-200 text-slate-200 flex items-start gap-2.5 transition-colors cursor-pointer group"
            >
              <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Documento Formateado (.doc)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">Word</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  Apertura directa con tablas, membrete oficial y estilos en Microsoft Word/Office sin ningún símbolo (#, **, |).
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('html')}
              className="w-full text-left px-3.5 py-2 hover:bg-emerald-950/40 hover:text-emerald-200 text-slate-200 flex items-start gap-2.5 transition-colors cursor-pointer group"
            >
              <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Informe Web Ejecutivo (.html)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Navegador</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  Documento autocontenido con diseño React-Markdown, tablas responsivas y membrete Centinela Orinoco.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('txt')}
              className="w-full text-left px-3.5 py-2 hover:bg-emerald-950/40 hover:text-emerald-200 text-slate-200 flex items-start gap-2.5 transition-colors cursor-pointer group"
            >
              <FileCode className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Texto Plano Limpio (.txt)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">Sin formato</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  Texto plano depurado de asteriscos, almohadillas, tablas markdown y códigos, con sangrías y viñetas limpias.
                </div>
              </div>
            </button>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleDownload('print')}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-start gap-2.5 transition-colors cursor-pointer group"
            >
              <Printer className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white">Imprimir / Guardar como PDF</div>
                <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  Envía el informe formateado directamente al cuadro de impresión para exportar en PDF.
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
