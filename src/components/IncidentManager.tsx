import React, { useState } from 'react';
import { 
  ShieldAlert, 
  PlusCircle, 
  Search, 
  Filter, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  FileDown, 
  UserCheck,
  Send,
  Eye
} from 'lucide-react';
import { IncidentReport, AlertSeverity } from '../types';
import { SupabaseRpcService } from '../lib/supabaseClient';

interface IncidentManagerProps {
  incidents: IncidentReport[];
  onAddIncident: (incident: IncidentReport) => void;
  onUpdateStatus: (id: string, status: IncidentReport['status']) => void;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
  prefilledCoords?: { lat: number; lng: number } | null;
}

export const IncidentManager: React.FC<IncidentManagerProps> = ({
  incidents,
  onAddIncident,
  onUpdateStatus,
  isCreateModalOpen,
  onCloseCreateModal,
  prefilledCoords,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // New incident form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<IncidentReport['category']>('MINERIA_ILEGAL');
  const [newSeverity, setNewSeverity] = useState<AlertSeverity>('HIGH');
  const [newLat, setNewLat] = useState<string>(prefilledCoords?.lat ? prefilledCoords.lat.toFixed(4) : '5.8450');
  const [newLng, setNewLng] = useState<string>(prefilledCoords?.lng ? prefilledCoords.lng.toFixed(4) : '-65.2210');
  const [newLocationName, setNewLocationName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newReportedBy, setNewReportedBy] = useState('Guardería Ambiental / Centinela SAR');
  const [newAssignedUnit, setNewAssignedUnit] = useState('Comando Fluvial Río Orinoco');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync coords when prop changes
  React.useEffect(() => {
    if (prefilledCoords) {
      setNewLat(prefilledCoords.lat.toFixed(4));
      setNewLng(prefilledCoords.lng.toFixed(4));
    }
  }, [prefilledCoords]);

  // Filters
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesCategory = categoryFilter === 'ALL' || inc.category === categoryFilter;

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    setIsSubmitting(true);
    try {
      const lat = parseFloat(newLat) || 5.8;
      const lng = parseFloat(newLng) || -65.2;

      const result = await SupabaseRpcService.registerIncident({
        title: newTitle,
        category: newCategory,
        severity: newSeverity,
        status: 'ACTIVO',
        latitude: lat,
        longitude: lng,
        locationName: newLocationName || `Sector [${lat.toFixed(2)}, ${lng.toFixed(2)}]`,
        description: newDescription,
        reportedBy: newReportedBy,
        assignedUnit: newAssignedUnit,
        evidenceCount: 1,
      });

      if (result.data) {
        onAddIncident(result.data);
        onCloseCreateModal();
        // Reset
        setNewTitle('');
        setNewDescription('');
        setNewLocationName('');
      }
    } catch (err) {
      console.error('Error registrando incidente:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Codigo', 'Titulo', 'Categoria', 'Severidad', 'Estado', 'Latitud', 'Longitud', 'Ubicacion', 'Fecha', 'ReportadoPor'];
    const rows = filteredIncidents.map((i) => [
      i.code,
      `"${i.title.replace(/"/g, '""')}"`,
      i.category,
      i.severity,
      i.status,
      i.latitude,
      i.longitude,
      `"${i.locationName.replace(/"/g, '""')}"`,
      i.timestamp,
      `"${i.reportedBy.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `centinela_incidentes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0b121c] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Centro de Gestión de Incidentes y Alertas Territoriales
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro, verificación y despacho de operativos para minería ilegal, deforestación, mercurio y seguridad de cuenca
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => onCloseCreateModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg shadow-md shadow-red-950/40 border border-red-500/30 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nuevo Incidente</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0b121c] p-3.5 rounded-xl border border-slate-800 text-xs">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#060a0f] px-3 py-2 rounded-lg border border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, sector o palabra clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-slate-200 text-xs outline-none w-full placeholder:text-slate-500"
          />
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2 bg-[#060a0f] px-3 py-2 rounded-lg border border-slate-800">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Severidad:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-sky-300 font-medium outline-none cursor-pointer w-full"
          >
            <option value="ALL" className="bg-slate-900">Todas las Severidades</option>
            <option value="CRITICAL" className="bg-slate-900 text-red-400">Crítica</option>
            <option value="HIGH" className="bg-slate-900 text-amber-400">Alta</option>
            <option value="MEDIUM" className="bg-slate-900 text-yellow-400">Media</option>
            <option value="LOW" className="bg-slate-900 text-emerald-400">Baja</option>
          </select>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 bg-[#060a0f] px-3 py-2 rounded-lg border border-slate-800">
          <span className="text-slate-400">Categoría:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent text-sky-300 font-medium outline-none cursor-pointer w-full"
          >
            <option value="ALL" className="bg-slate-900">Todas las Categorías</option>
            <option value="MINERIA_ILEGAL" className="bg-slate-900">Minería Ilegal</option>
            <option value="CONTAMINACION_MERCURIO" className="bg-slate-900">Contaminación Mercurio</option>
            <option value="PISTA_CLANDESTINA" className="bg-slate-900">Pista Clandestina</option>
            <option value="DEFORESTACION" className="bg-slate-900">Deforestación / Focos</option>
            <option value="CRECIDA_SUBITA" className="bg-slate-900">Crecida Súbita</option>
          </select>
        </div>
      </div>

      {/* Incidents Table / Cards */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="bg-[#0b121c] border border-slate-800 rounded-xl p-10 text-center text-slate-400">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">No se encontraron incidentes con los filtros seleccionados.</p>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isCritical = inc.severity === 'CRITICAL';
            const isHigh = inc.severity === 'HIGH';

            return (
              <div
                key={inc.id}
                className="bg-[#0b121c] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all shadow-md space-y-3"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800">
                      {inc.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isCritical ? 'bg-red-950 text-red-300 border border-red-800' :
                      isHigh ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-900 text-slate-300 border border-slate-700'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                      {inc.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Estado Operativo:</span>
                    <select
                      value={inc.status}
                      onChange={(e) => onUpdateStatus(inc.id, e.target.value as any)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium outline-none border cursor-pointer ${
                        inc.status === 'OPERATIVO_EN_CURSO' ? 'bg-sky-950 text-sky-300 border-sky-800' :
                        inc.status === 'RESUELTO' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                        inc.status === 'EN_VERIFICACION' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                        'bg-red-950 text-red-300 border-red-800'
                      }`}
                    >
                      <option value="ACTIVO" className="bg-slate-900 text-red-300">ACTIVO</option>
                      <option value="EN_VERIFICACION" className="bg-slate-900 text-amber-300">EN VERIFICACIÓN</option>
                      <option value="OPERATIVO_EN_CURSO" className="bg-slate-900 text-sky-300">OPERATIVO EN CURSO</option>
                      <option value="RESUELTO" className="bg-slate-900 text-emerald-300">RESUELTO</option>
                      <option value="ARCHIVADO" className="bg-slate-900 text-slate-400">ARCHIVADO</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{inc.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {inc.locationName} ({inc.latitude.toFixed(3)}°N, {inc.longitude.toFixed(3)}°W)
                    </span>
                    <span>Reportado: <strong className="text-slate-300">{inc.reportedBy}</strong></span>
                    {inc.assignedUnit && (
                      <span>Unidad: <strong className="text-sky-300">{inc.assignedUnit}</strong></span>
                    )}
                  </div>
                  <span className="font-mono text-slate-500">{inc.timestamp}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Registrar Nuevo Incidente */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1420] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-white">Registrar Alerta Territorial / Incidente</h3>
              </div>
              <button
                onClick={onCloseCreateModal}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Título del Incidente / Alerta</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Detección de balsa minera en Caño Yagua..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500"
                  >
                    <option value="MINERIA_ILEGAL">Minería Ilegal</option>
                    <option value="CONTAMINACION_MERCURIO">Contaminación Mercurio</option>
                    <option value="PISTA_CLANDESTINA">Pista Clandestina</option>
                    <option value="DEFORESTACION">Deforestación / Foco</option>
                    <option value="CRECIDA_SUBITA">Crecida Súbita</option>
                    <option value="ALTERCADO_TERRITORIAL">Conflicto Territorial</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Nivel de Severidad</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500"
                  >
                    <option value="CRITICAL">Crítica (Interdicción Inmediata)</option>
                    <option value="HIGH">Alta (Sobrevuelo / Verificación)</option>
                    <option value="MEDIUM">Media</option>
                    <option value="LOW">Baja / Informativa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Latitud (°N)</label>
                  <input
                    type="text"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white font-mono text-xs sm:text-sm md:text-base outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Longitud (°W)</label>
                  <input
                    type="text"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white font-mono text-xs sm:text-sm md:text-base outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Nombre de la Ubicación / Sector</label>
                <input
                  type="text"
                  placeholder="ej. Alto Ventuari - Sureste de Manapiare"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Descripción Táctica y Evidencias</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalles sobre dragas, hectáreas, imágenes satelitales o testimonios comunitarios..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Reportado Por</label>
                  <input
                    type="text"
                    value={newReportedBy}
                    onChange={(e) => setNewReportedBy(e.target.value)}
                    className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium text-xs sm:text-sm">Unidad Asignada</label>
                  <input
                    type="text"
                    value={newAssignedUnit}
                    onChange={(e) => setNewAssignedUnit(e.target.value)}
                    className="w-full bg-[#060a0f] border border-slate-800 rounded-lg p-2.5 sm:p-3 text-white text-xs sm:text-sm md:text-base outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium shadow-lg shadow-red-950/40 transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Guardando...' : 'Despachar Alerta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
