import React, { useState } from 'react';
import { Group, ConvivenciaArea, AreaAssignment, Shift } from '../types';
import { 
  Users, 
  MapPin, 
  Clock, 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  Info,
  Calendar,
  Layers
} from 'lucide-react';

interface LiveAssignmentBoardProps {
  shift: Shift;
  groups: Group[];
  areas: ConvivenciaArea[];
  assignments: Record<string, AreaAssignment>; // Key: groupId
  onAssignGroup: (groupId: string, areaId: string, activityDescription?: string) => void;
  onUnassignGroup: (groupId: string) => void;
  onOpenActivityAI: (groupId: string, areaId?: string) => void;
  onAutoAssignAll: () => void;
  onClearAllAssignments: () => void;
}

export const LiveAssignmentBoard: React.FC<LiveAssignmentBoardProps> = ({
  shift,
  groups,
  areas,
  assignments,
  onAssignGroup,
  onUnassignGroup,
  onOpenActivityAI,
  onAutoAssignAll,
  onClearAllAssignments
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  
  // Selected group for assignment modal
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [activityNote, setActivityNote] = useState<string>('');

  // Filter groups
  const filteredGroups = groups.filter(group => {
    if (group.shift !== shift) return false;
    
    if (gradeFilter !== 'all' && group.grade !== gradeFilter) return false;
    
    const isAssigned = !!assignments[group.id];
    if (statusFilter === 'assigned' && !isAssigned) return false;
    if (statusFilter === 'unassigned' && isAssigned) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = group.name.toLowerCase().includes(q);
      const matchTutor = group.tutorName?.toLowerCase().includes(q) || false;
      const currentArea = assignments[group.id] ? areas.find(a => a.id === assignments[group.id].areaId) : null;
      const matchArea = currentArea?.name.toLowerCase().includes(q) || false;
      return matchName || matchTutor || matchArea;
    }

    return true;
  });

  const assignedCount = groups.filter(g => g.shift === shift && assignments[g.id]).length;
  const totalShiftGroups = groups.filter(g => g.shift === shift).length;

  const handleOpenAssignModal = (groupId: string) => {
    setEditingGroupId(groupId);
    const existing = assignments[groupId];
    if (existing) {
      setSelectedAreaId(existing.areaId);
      setActivityNote(existing.activityDescription || '');
    } else {
      // Find first available area or first area
      const occupiedAreaIds = new Set(Object.values(assignments).map(a => (a as AreaAssignment).areaId));
      const firstFreeArea = areas.find(a => a.shift === shift && !occupiedAreaIds.has(a.id));
      setSelectedAreaId(firstFreeArea ? firstFreeArea.id : (areas[0]?.id || ''));
      setActivityNote('Convivencia libre y juegos de mesa');
    }
  };

  const handleSaveAssignment = () => {
    if (!editingGroupId || !selectedAreaId) return;
    onAssignGroup(editingGroupId, selectedAreaId, activityNote);
    setEditingGroupId(null);
    setSelectedAreaId('');
    setActivityNote('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-white rounded-3xl p-5 border-2 border-blue-100 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                shift === 'matutino' ? 'bg-yellow-100 text-blue-900 border border-yellow-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}>
                Turno {shift === 'matutino' ? 'Matutino (17 Grupos)' : 'Vespertino (16 Grupos)'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Proyecto PRESENTE Chapala
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5">
              Tablero de Ubicación de Grupos en Áreas de Convivencia
            </h2>
            <p className="text-xs text-slate-600">
              Registra rápidamente en qué espacio del plantel se encuentra socializando cada grupo.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="auto-assign-all-btn"
              onClick={onAutoAssignAll}
              className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 border border-yellow-300 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-blue-900" />
              <span>Asignación Automática ({totalShiftGroups} áreas)</span>
            </button>

            {assignedCount > 0 && (
              <button
                id="clear-all-btn"
                onClick={onClearAllAssignments}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Liberar Todos ({assignedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              id="search-groups-input"
              type="text"
              placeholder="Buscar grupo, tutor o área..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 outline-none font-medium"
            />
          </div>

          {/* Grade / Semester Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              id="grade-filter-select"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos los Semestres (1º a 6º)</option>
              <option value={1}>1º Semestre</option>
              <option value={2}>2º Semestre</option>
              <option value={3}>3º Semestre</option>
              <option value={4}>4º Semestre</option>
              <option value={5}>5º Semestre</option>
              <option value={6}>6º Semestre</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos los Estados ({totalShiftGroups})</option>
              <option value="assigned">🟢 En Área de Convivencia ({assignedCount})</option>
              <option value="unassigned">⚪ En Aula / Sin Área ({totalShiftGroups - assignedCount})</option>
            </select>
          </div>

          {/* Total Counter Badge */}
          <div className="flex items-center justify-end px-3 py-2 bg-blue-50 rounded-xl text-xs font-black text-blue-900 border border-blue-100">
            <span>Progreso: {assignedCount} de {totalShiftGroups} grupos asignados</span>
          </div>

        </div>

      </div>

      {/* Main Matrix Grid of Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredGroups.map((group, idx) => {
          const assignment = assignments[group.id];
          const assignedArea = assignment ? areas.find(a => a.id === assignment.areaId) : null;

          // Color themes for card borders & accents in Vibrant Palette style
          const borderVariants = [
            'border-2 border-green-200 hover:border-green-400',
            'border-2 border-blue-200 hover:border-blue-400',
            'border-2 border-orange-200 hover:border-orange-400',
            'border-2 border-purple-200 hover:border-purple-400',
            'border-2 border-red-200 hover:border-red-400',
            'border-2 border-teal-200 hover:border-teal-400',
            'border-2 border-yellow-200 hover:border-yellow-400',
            'border-2 border-pink-200 hover:border-pink-400'
          ];
          const cardBorder = borderVariants[idx % borderVariants.length];

          const groupTagColors = [
            'bg-green-500 text-white',
            'bg-blue-600 text-white',
            'bg-orange-500 text-white',
            'bg-purple-600 text-white',
            'bg-red-500 text-white',
            'bg-teal-600 text-white',
            'bg-yellow-400 text-blue-950',
            'bg-pink-600 text-white'
          ];
          const tagBg = groupTagColors[idx % groupTagColors.length];

          return (
            <div
              key={group.id}
              className={`rounded-3xl bg-white transition-all duration-200 p-4 flex flex-col justify-between relative overflow-hidden shadow-sm ${
                assignedArea
                  ? `${cardBorder} shadow-md`
                  : 'border-2 border-slate-100 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                {/* Header of Group Card */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-10 h-8 rounded-lg ${tagBg} font-black text-xs flex items-center justify-center shadow-sm shrink-0`}>
                      {group.name}
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                        Grupo {group.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        {group.grade}º Semestre • ~{group.studentCount || 38} alumnos
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator Badge */}
                  {assignedArea ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      En Área
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                      En Aula
                    </span>
                  )}
                </div>

                {/* Tutor Info */}
                <p className="text-xs text-slate-600 mb-3 flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Tutor: {group.tutorName || 'Por asignar'}</span>
                </p>

                {/* Current Area Box */}
                {assignedArea ? (
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 mb-3 text-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        Área de Convivencia
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {assignment.startTime} hrs
                      </span>
                    </div>

                    <p className="text-sm font-extrabold text-slate-900 leading-snug">
                      {assignedArea.name}
                    </p>

                    <p className="text-xs text-slate-700 italic line-clamp-2 font-medium">
                      "{assignment.activityDescription || 'Convivencia libre y socialización sin pantallas'}"
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-blue-200/60 font-semibold">
                      <span>Cat: {assignedArea.category}</span>
                      <span>Cap: {assignedArea.capacity} pers.</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-3 mb-3 text-center space-y-0.5">
                    <p className="text-xs font-bold text-slate-500">
                      Sin área asignada
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      El grupo se encuentra en su aula.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    id={`assign-btn-${group.id}`}
                    onClick={() => handleOpenAssignModal(group.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
                      assignedArea
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        : 'bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black shadow-sm'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>{assignedArea ? 'Reasignar / Editar' : 'Asignar Área'}</span>
                  </button>

                  {assignedArea && (
                    <button
                      id={`unassign-btn-${group.id}`}
                      onClick={() => onUnassignGroup(group.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="Liberar área para este grupo"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  id={`ai-suggest-btn-${group.id}`}
                  onClick={() => onOpenActivityAI(group.id, assignedArea?.id)}
                  className="w-full py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Sugerir Dinámica sin Pantallas (AI)</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Info className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron grupos con este filtro</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Prueba ajustando la búsqueda o el filtro de semestres en la barra superior.
          </p>
        </div>
      )}

      {/* Modal for Assigning / Changing Area */}
      {editingGroupId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Proyecto PRESENTE SEMS UdeG
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Asignar Área de Convivencia - Grupo {groups.find(g => g.id === editingGroupId)?.name}
                </h3>
              </div>
              <button
                id="close-assign-modal-btn"
                onClick={() => setEditingGroupId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Select Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecciona el Área o Espacio del Plantel
                </label>
                <select
                  id="select-area-dropdown"
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" disabled>-- Selecciona un área disponible --</option>
                  {areas
                    .filter(a => a.shift === shift)
                    .map((area) => {
                      // Check if already occupied by another group
                      const occupiedByGroupId = Object.keys(assignments).find(
                        gid => assignments[gid].areaId === area.id && gid !== editingGroupId
                      );
                      const occupiedGroup = occupiedByGroupId ? groups.find(g => g.id === occupiedByGroupId) : null;

                      return (
                        <option key={area.id} value={area.id}>
                          {area.name} [{area.category}] {occupiedGroup ? `(Ocupada por ${occupiedGroup.name})` : '(Disponible)'}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Activity Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actividad o Dinámica de Convivencia a Realizar
                </label>
                <textarea
                  id="activity-note-input"
                  rows={3}
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  placeholder="Ej: Juegos de mesa (Ajedrez, Jenga), Diálogo en círculo, Torneo de Voleibol..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-xl text-[11px] text-blue-900 border border-blue-200/70 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  El registro quedará grabado inmediatamente en la bitácora institucional del Proyecto PRESENTE.
                </span>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="cancel-assign-btn"
                onClick={() => setEditingGroupId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                id="save-assignment-btn"
                onClick={handleSaveAssignment}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black rounded-xl text-xs shadow-sm transition-transform active:scale-95"
              >
                Guardar Asignación
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
