import React, { useState } from 'react';
import { Group, ConvivenciaArea, Shift } from '../types';
import { detectCroquisPosition, CAMPUS_LANDMARK_PRESETS } from '../data/initialData';
import { 
  X, 
  Settings, 
  Users, 
  MapPin, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Download, 
  Save, 
  Check, 
  ShieldCheck, 
  KeyRound,
  Navigation
} from 'lucide-react';

interface SettingsModalProps {
  shift: Shift;
  groups: Group[];
  areas: ConvivenciaArea[];
  onUpdateGroups: (groups: Group[]) => void;
  onUpdateAreas: (areas: ConvivenciaArea[]) => void;
  onResetDefaults: () => void;
  onClose: () => void;
  tutorPin: string;
  adminPin: string;
  onUpdatePins: (tutorPin: string, adminPin: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  shift,
  groups,
  areas,
  onUpdateGroups,
  onUpdateAreas,
  onResetDefaults,
  onClose,
  tutorPin,
  adminPin,
  onUpdatePins
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'areas' | 'security' | 'data'>('groups');

  // Local state for editing groups & pins
  const [localGroups, setLocalGroups] = useState<Group[]>([...groups]);
  const [localAreas, setLocalAreas] = useState<ConvivenciaArea[]>(() => {
    return areas.map(a => ({
      ...a,
      name: a.name ? a.name.replace(/\s*&\s*/g, ' y ') : a.name,
      category: (a.category ? a.category.replace(/\s*&\s*/g, ' y ') : 'Socialización y Charla') as any
    }));
  });
  const [localTutorPin, setLocalTutorPin] = useState(tutorPin);
  const [localAdminPin, setLocalAdminPin] = useState(adminPin);

  // Group creation form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState<number>(1);
  const [newGroupTutor, setNewGroupTutor] = useState('');

  // Area creation form
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaCategory, setNewAreaCategory] = useState<any>('Socialización y Charla');
  const [newAreaLocation, setNewAreaLocation] = useState('');
  const [newAreaCapacity] = useState<number>(35);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const shiftGroups = localGroups.filter(g => g.shift === shift);
  const shiftAreas = localAreas.filter(a => a.shift === shift);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newG: Group = {
      id: `group-${shift}-${Date.now()}`,
      name: newGroupName.trim(),
      grade: newGroupGrade,
      shift: shift,
      tutorName: newGroupTutor.trim() || 'Por asignar',
      studentCount: 38
    };
    setLocalGroups(prev => [...prev, newG]);
    setNewGroupName('');
    setNewGroupTutor('');
  };

  const handleDeleteGroup = (id: string) => {
    setLocalGroups(prev => prev.filter(g => g.id !== id));
  };

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    const pos = detectCroquisPosition(newAreaName.trim(), newAreaLocation.trim());
    const newA: ConvivenciaArea = {
      id: `area-${shift}-${Date.now()}`,
      name: newAreaName.trim(),
      category: newAreaCategory,
      capacity: newAreaCapacity,
      shift: shift,
      locationDescription: newAreaLocation.trim() || 'Ubicación en plantel',
      croquisPosition: pos,
      equipment: 'Bancas y espacio abierto',
      color: 'blue',
      iconName: 'MapPin'
    };
    setLocalAreas(prev => [...prev, newA]);
    setNewAreaName('');
    setNewAreaLocation('');
  };

  const handleDeleteArea = (id: string) => {
    setLocalAreas(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveAll = () => {
    // Normalize areas to ensure any area with default or missing position gets accurate landmark coordinates
    const normalizedAreas = localAreas.map(a => {
      const rawPos = a.croquisPosition;
      const isDefaultOrMissing = !rawPos || (Math.abs(rawPos.x - 50) < 0.01 && Math.abs(rawPos.y - 50) < 0.01);
      if (isDefaultOrMissing) {
        return {
          ...a,
          croquisPosition: detectCroquisPosition(a.name, a.locationDescription)
        };
      }
      return a;
    });
    onUpdateGroups(localGroups);
    onUpdateAreas(normalizedAreas);
    onUpdatePins(localTutorPin, localAdminPin);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const exportBackup = () => {
    const backupData = {
      groups: localGroups,
      areas: localAreas,
      tutorPin: localTutorPin,
      adminPin: localAdminPin,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PRESENTE_Config_Chapala_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-2 border-blue-100 my-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Configuración del Plantel — Preparatoria Regional de Chapala
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Gestión de catálogo de grupos, áreas de convivencia y PINes de acceso.
              </p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-black">
          <button
            id="subtab-groups-btn"
            onClick={() => setActiveSubTab('groups')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeSubTab === 'groups' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Grupos ({shiftGroups.length})</span>
          </button>

          <button
            id="subtab-areas-btn"
            onClick={() => setActiveSubTab('areas')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeSubTab === 'areas' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Áreas ({shiftAreas.length})</span>
          </button>

          <button
            id="subtab-security-btn"
            onClick={() => setActiveSubTab('security')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeSubTab === 'security' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
            <span>PINes de Acceso</span>
          </button>

          <button
            id="subtab-data-btn"
            onClick={() => setActiveSubTab('data')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeSubTab === 'data' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Respaldo y Datos</span>
          </button>
        </div>

        {/* Groups SubTab */}
        {activeSubTab === 'groups' && (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            
            {/* Add Group Form */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">Nombre Grupo</label>
                <input
                  id="add-group-name-input"
                  type="text"
                  placeholder="Ej: 1ºD"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">Semestre</label>
                <select
                  id="add-group-grade-select"
                  value={newGroupGrade}
                  onChange={e => setNewGroupGrade(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}º Semestre</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">Tutor</label>
                <input
                  id="add-group-tutor-input"
                  type="text"
                  placeholder="Prof. Nombre"
                  value={newGroupTutor}
                  onChange={e => setNewGroupTutor(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-end">
                <button
                  id="confirm-add-group-btn"
                  onClick={handleAddGroup}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black p-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 text-yellow-300" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* List of Groups */}
            <div className="space-y-1.5">
              {shiftGroups.map(g => (
                <div key={g.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center text-xs shadow-sm">
                      {g.name}
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-900">Grupo {g.name}</span>
                      <span className="text-slate-500 ml-2 font-medium">({g.grade}º Semestre • Tutor: {g.tutorName})</span>
                    </div>
                  </div>
                  <button
                    id={`delete-group-btn-${g.id}`}
                    onClick={() => handleDeleteGroup(g.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Areas SubTab */}
        {activeSubTab === 'areas' && (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            
            {/* Add Area Form */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">Nombre del Área</label>
                  <input
                    id="add-area-name-input"
                    type="text"
                    placeholder="Ej: Terraza del Módulo D"
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">Categoría</label>
                  <select
                    id="add-area-cat-select"
                    value={newAreaCategory}
                    onChange={e => setNewAreaCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold"
                  >
                    <option value="Socialización y Charla">Socialización y Charla</option>
                    <option value="Deporte y Salud">Deporte y Salud</option>
                    <option value="Juegos de Mesa y Estrategia">Juegos de Mesa y Estrategia</option>
                    <option value="Arte y Cultura">Arte y Cultura</option>
                    <option value="Descanso y Sombra">Descanso y Sombra</option>
                    <option value="Música y Expresión">Música y Expresión</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <input
                    id="add-area-location-input"
                    type="text"
                    list="campus-landmark-list"
                    placeholder="Ubicación o referencia en croquis (ej: Cancha Múltiple, Ciber Jardín 3)..."
                    value={newAreaLocation}
                    onChange={e => setNewAreaLocation(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                  <datalist id="campus-landmark-list">
                    {CAMPUS_LANDMARK_PRESETS.map(p => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                  <button
                    id="confirm-add-area-btn"
                    onClick={handleAddArea}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-2 rounded-xl flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-yellow-300" />
                    <span>Agregar Área</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  💡 Si indicas una referencia como "Cancha Múltiple", "Gimnasio", "Ciber Jardín 3", etc., se ubicará de forma exacta en el croquis.
                </p>
              </div>
            </div>

            {/* List of Areas */}
            <div className="space-y-1.5">
              {shiftAreas.map(a => {
                const rawPos = a.croquisPosition;
                const isDefaultOrMissing = !rawPos || (Math.abs(rawPos.x - 50) < 0.01 && Math.abs(rawPos.y - 50) < 0.01);
                const pos = isDefaultOrMissing ? detectCroquisPosition(a.name, a.locationDescription) : rawPos;

                return (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-900">{a.name}</span>
                        <span className="text-blue-900 bg-blue-100 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-200">
                          {a.category}
                        </span>
                        <span className="text-emerald-800 bg-emerald-100/80 font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-200">
                          🗺️ {pos.x.toFixed(1)}%, {pos.y.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">📍 {a.locationDescription}</p>
                    </div>
                    <button
                      id={`delete-area-btn-${a.id}`}
                      onClick={() => handleDeleteArea(a.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Security & PINs SubTab */}
        {activeSubTab === 'security' && (
          <div className="space-y-4 text-xs">
            
            <div className="bg-yellow-50/80 p-4 rounded-2xl border border-yellow-200 space-y-3">
              <div className="flex items-center gap-2 text-blue-950 font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-yellow-600" />
                <span>Gestión de PINes de Autorización Institucional</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Configura las claves numéricas de acceso para el personal docente y directivo de la Preparatoria Regional de Chapala.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Tutor PIN Card */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                  <label className="block text-xs font-black text-blue-900 uppercase tracking-wider">
                    PIN Profesor / Tutor:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Permite registrar la ubicación individual de grupos y sugerir actividades AI.
                  </p>
                  <input
                    id="tutor-pin-input"
                    type="text"
                    maxLength={6}
                    value={localTutorPin}
                    onChange={e => setLocalTutorPin(e.target.value)}
                    className="w-full text-center text-lg font-black tracking-widest p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                {/* Admin PIN Card */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                  <label className="block text-xs font-black text-yellow-900 uppercase tracking-wider">
                    PIN Administrador / Orientador:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Permite asignación masiva, liberar todas las áreas y editar catálogos.
                  </p>
                  <input
                    id="admin-pin-input"
                    type="text"
                    maxLength={6}
                    value={localAdminPin}
                    onChange={e => setLocalAdminPin(e.target.value)}
                    className="w-full text-center text-lg font-black tracking-widest p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900 text-[11px] font-medium flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Los PINes modificados quedan almacenados localmente de forma segura para esta instancia del sistema.</span>
            </div>

          </div>
        )}

        {/* Backup & Data SubTab */}
        {activeSubTab === 'data' && (
          <div className="space-y-4 text-xs">
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900">Exportar Configuración Completa (JSON)</h4>
              <p className="text-slate-600 font-medium">
                Guarda un respaldo de la estructura de grupos, áreas de convivencia y PINes configurados para el plantel.
              </p>
              <button
                id="export-backup-btn"
                onClick={exportBackup}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-black flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-yellow-300" />
                <span>Descargar Archivo de Respaldo</span>
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-3">
              <h4 className="font-extrabold text-rose-900">Restablecer Valores Iniciales del Proyecto ¡PRESENTE!</h4>
              <p className="text-rose-700 font-medium">
                Reinicia los catálogos y PINes a los valores predeterminados del SEMS UdeG (Tutor: 2026 | Admin: 9988).
              </p>
              <button
                id="reset-defaults-btn"
                onClick={onResetDefaults}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Datos por Defecto</span>
              </button>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            {savedSuccess && (
              <span className="text-xs font-black text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                ¡Cambios guardados con éxito!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              id="cancel-settings-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cerrar
            </button>
            <button
              id="save-settings-btn"
              onClick={handleSaveAll}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
