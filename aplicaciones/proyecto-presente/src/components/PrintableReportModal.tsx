import React from 'react';
import { Group, ConvivenciaArea, AreaAssignment, Shift } from '../types';
import { X, Printer, Building2, CheckCircle, ShieldCheck } from 'lucide-react';
import { EscudoUdeG } from './EscudoUdeG';

interface PrintableReportModalProps {
  shift: Shift;
  groups: Group[];
  areas: ConvivenciaArea[];
  assignments: Record<string, AreaAssignment>;
  onClose: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  shift,
  groups,
  areas,
  assignments,
  onClose
}) => {
  const shiftGroups = groups.filter(g => g.shift === shift);
  const shiftAreas = areas.filter(a => a.shift === shift);
  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const assignedGroupsCount = shiftGroups.filter(g => !!assignments[g.id]).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 my-8 space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
        
        {/* Screen Controls (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Vista Previa de Impresión UdeG
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Reporte Oficial de Registro de Áreas - Proyecto ¡PRESENTE!
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="execute-print-btn"
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              id="close-print-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Content */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-900 space-y-6 print:border-none print:p-0">
          
          {/* Institutional Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-1 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <EscudoUdeG width={48} height={64} />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  Universidad de Guadalajara
                </h1>
                <h2 className="text-sm font-bold text-slate-700">
                  Sistema de Educación Media Superior (SEMS)
                </h2>
                <p className="text-xs text-slate-600 font-semibold">
                  Preparatoria Regional de Chapala • Proyecto ¡PRESENTE!
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-semibold text-slate-700 space-y-1">
              <p className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded font-bold uppercase inline-block">
                Turno {shift === 'matutino' ? 'Matutino (17 Grupos)' : 'Vespertino (16 Grupos)'}
              </p>
              <p className="text-slate-500 capitalize">{currentDate}</p>
            </div>
          </div>

          {/* Report Summary */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Total de Grupos del Turno:</span>
              <strong className="text-slate-900 text-base">{shiftGroups.length} Grupos</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Grupos Registrados en Área:</span>
              <strong className="text-emerald-700 text-base">{assignedGroupsCount} de {shiftGroups.length}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Índice de Cobertura:</span>
              <strong className="text-slate-900 text-base">
                {Math.round((assignedGroupsCount / shiftGroups.length) * 100)}%
              </strong>
            </div>
          </div>

          {/* Assignments Matrix Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              Relación de Ubicación por Grupo y Área de Convivencia
            </h3>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2 px-3">Grupo</th>
                  <th className="py-2 px-3">Semestre</th>
                  <th className="py-2 px-3">Tutor a Cargo</th>
                  <th className="py-2 px-3">Área de Convivencia Asignada</th>
                  <th className="py-2 px-3">Hora</th>
                  <th className="py-2 px-3">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {shiftGroups.map((group) => {
                  const assignment = assignments[group.id];
                  const area = assignment ? areas.find(a => a.id === assignment.areaId) : null;

                  return (
                    <tr key={group.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {group.name}
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        {group.grade}º Semestre
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        {group.tutorName || 'N/A'}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {area ? area.name : 'En Aula / Sin Área'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {assignment ? `${assignment.startTime} hrs` : '--:--'}
                      </td>
                      <td className="py-2 px-3 font-bold">
                        {area ? (
                          <span className="text-emerald-700">🟢 En Área</span>
                        ) : (
                          <span className="text-slate-500">⚪ En Aula</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures Section */}
          <div className="pt-12 grid grid-cols-2 gap-12 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
              <p className="font-bold text-slate-900">Coordinador de Convivencia Escolar</p>
              <p className="text-slate-500">Proyecto PRESENTE - SEMS UdeG</p>
            </div>
            <div>
              <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
              <p className="font-bold text-slate-900">Prefectura / Responsable de Turno</p>
              <p className="text-slate-500">Preparatoria Regional de Chapala</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
