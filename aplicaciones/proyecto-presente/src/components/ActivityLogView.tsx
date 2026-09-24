import React, { useState } from 'react';
import { ActivityLogItem, Shift } from '../types';
import { 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  BarChart3, 
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface ActivityLogViewProps {
  shift: Shift;
  logs: ActivityLogItem[];
  onClearLogs: () => void;
  onOpenPrintReport: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  shift,
  logs,
  onClearLogs,
  onOpenPrintReport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'check-in' | 'checkout' | 'reassign'>('all');

  const shiftLogs = logs.filter(log => log.shift === shift);

  const filteredLogs = shiftLogs.filter(log => {
    if (actionFilter !== 'all' && log.actionType !== actionFilter) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.groupName.toLowerCase().includes(q) ||
        log.areaName.toLowerCase().includes(q) ||
        log.activityDescription.toLowerCase().includes(q) ||
        log.dateStr.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate statistics for report preview
  const totalRegistrations = shiftLogs.length;

  // Find most popular area
  const areaCounts: Record<string, number> = {};
  shiftLogs.forEach(l => {
    areaCounts[l.areaName] = (areaCounts[l.areaName] || 0) + 1;
  });

  let topArea = 'Ninguna registrada';
  let topAreaCount = 0;
  Object.entries(areaCounts).forEach(([area, count]) => {
    if (count > topAreaCount) {
      topArea = area;
      topAreaCount = count;
    }
  });

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Fecha', 'Hora', 'Turno', 'Grupo', 'Área de Convivencia', 'Actividad Realizada', 'Tipo Acción'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.dateStr,
      l.timestamp,
      l.shift,
      l.groupName,
      `"${l.areaName.replace(/"/g, '""')}"`,
      `"${l.activityDescription.replace(/"/g, '""')}"`,
      l.actionType
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Evidencia_PRESENTE_Chapala_${shift}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-sm space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-yellow-400 text-blue-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                SEMS UdeG - Proyecto PRESENTE
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Preparatoria Regional de Chapala
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Bitácora Histórica y Evidencia de Convivencia
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Registro cronológico auditable para la coordinación de convivencia escolar y seguimiento de grupos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="export-csv-btn"
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Exportar Excel/CSV</span>
            </button>

            <button
              id="open-print-report-btn"
              onClick={onOpenPrintReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4 text-yellow-300" />
              <span>Generar Evidencia UdeG (Imprimir)</span>
            </button>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200/80">
            <span className="text-xs font-black text-blue-900 uppercase tracking-wider block">
              Total de Registros
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{totalRegistrations}</span>
              <span className="text-xs text-blue-700 font-bold uppercase">Turno {shift}</span>
            </div>
          </div>

          <div className="bg-yellow-50/80 p-4 rounded-2xl border border-yellow-200/80">
            <span className="text-xs font-black text-blue-950 uppercase tracking-wider block">
              Área Más Concurrida
            </span>
            <div className="mt-1">
              <span className="text-sm font-black text-slate-900 block truncate">{topArea}</span>
              <span className="text-[11px] text-amber-800 font-bold">
                {topAreaCount} usos registrados
              </span>
            </div>
          </div>

          <div className="bg-green-50/80 p-4 rounded-2xl border border-green-200/80">
            <span className="text-xs font-black text-green-900 uppercase tracking-wider block">
              Acreditación PRESENTE
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-green-700">100%</span>
              <span className="text-xs text-green-800 font-bold">Cumplimiento SEMS</span>
            </div>
          </div>

          <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200/80">
            <span className="text-xs font-black text-purple-900 uppercase tracking-wider block">
              Frecuencia
            </span>
            <div className="mt-1">
              <span className="text-sm font-black text-slate-900">Diario por Receso</span>
              <span className="text-[11px] text-purple-800 font-bold block">Chapala UdeG</span>
            </div>
          </div>

        </div>

      </div>

      {/* Logs Table Section */}
      <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-sm overflow-hidden">
        
        {/* Table Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="log-search-input"
              type="text"
              placeholder="Buscar en la bitácora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              id="log-action-filter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">Todas las Acciones</option>
              <option value="check-in">Asignaciones (Check-in)</option>
              <option value="checkout">Liberaciones (Checkout)</option>
              <option value="reassign">Reasignaciones</option>
            </select>

            {shiftLogs.length > 0 && (
              <button
                id="clear-logs-btn"
                onClick={onClearLogs}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Vaciar historial de bitácora"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Grupo</th>
                <th className="py-3.5 px-4">Área Asignada</th>
                <th className="py-3.5 px-4">Actividad Registrada</th>
                <th className="py-3.5 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.dateStr} • {log.timestamp} hrs</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-black mr-1.5 shadow-sm">
                      {log.groupName}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-extrabold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{log.areaName}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-700 italic font-medium">
                    "{log.activityDescription}"
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {log.actionType === 'check-in' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-800 border border-green-300">
                        Ubicación
                      </span>
                    )}
                    {log.actionType === 'reassign' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-yellow-100 text-blue-950 border border-yellow-300">
                        Reasignación
                      </span>
                    )}
                    {log.actionType === 'checkout' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                        Liberación
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Sin registros en la bitácora aún</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Las asignaciones y reasignaciones que realices en el tablero aparecerán automáticamente organizadas aquí.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
