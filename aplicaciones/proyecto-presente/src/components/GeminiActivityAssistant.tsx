import React, { useState } from 'react';
import { Group, ConvivenciaArea, Shift, ActivitySuggestion } from '../types';
import { INITIAL_PRESET_ACTIVITIES } from '../data/initialData';
import { 
  Sparkles, 
  RefreshCw, 
  Users, 
  MapPin, 
  Check, 
  Lightbulb, 
  Clock, 
  ShieldCheck, 
  PhoneOff,
  Smile,
  ArrowRight
} from 'lucide-react';

interface GeminiActivityAssistantProps {
  shift: Shift;
  groups: Group[];
  areas: ConvivenciaArea[];
  preSelectedGroupId?: string;
  preSelectedAreaId?: string;
  onApplyActivityToGroup: (groupId: string, areaId: string, activityTitle: string) => void;
}

export const GeminiActivityAssistant: React.FC<GeminiActivityAssistantProps> = ({
  shift,
  groups,
  areas,
  preSelectedGroupId,
  preSelectedAreaId,
  onApplyActivityToGroup
}) => {
  const currentShiftGroups = groups.filter(g => g.shift === shift);
  const currentShiftAreas = areas.filter(a => a.shift === shift);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    preSelectedGroupId || currentShiftGroups[0]?.id || ''
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    preSelectedAreaId || currentShiftAreas[0]?.id || ''
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(20);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>(INITIAL_PRESET_ACTIVITIES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedArea = areas.find(a => a.id === selectedAreaId);

  const handleGenerateActivities = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setAppliedIndex(null);

    // Filter and shuffle preset activities according to selected area category
    const getLocalTailoredActivities = (): ActivitySuggestion[] => {
      const areaCategory = selectedArea?.category?.toLowerCase() || '';
      
      // Separate matching vs other activities
      const matching = INITIAL_PRESET_ACTIVITIES.filter(act => 
        act.category.toLowerCase().includes(areaCategory) || 
        areaCategory.includes(act.category.toLowerCase())
      );
      const others = INITIAL_PRESET_ACTIVITIES.filter(act => !matching.includes(act));

      // Shuffle arrays
      const shuffledMatching = [...matching].sort(() => Math.random() - 0.5);
      const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

      const combined = [...shuffledMatching, ...shuffledOthers].slice(0, 4);
      return combined.length > 0 ? combined : INITIAL_PRESET_ACTIVITIES.slice(0, 3);
    };

    try {
      const response = await fetch('/api/gemini/suggest-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaName: selectedArea?.name || 'Área de Convivencia',
          areaCategory: selectedArea?.category || 'Recreativa',
          groupName: selectedGroup?.name || 'Grupo de Preparatoria',
          shift: shift,
          durationMinutes: durationMinutes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.activities) && data.activities.length > 0) {
          setSuggestions(data.activities);
          return;
        }
      }
      // If endpoint is not available (static host or zero-cost setup), use tailored local bank
      setSuggestions(getLocalTailoredActivities());
    } catch {
      // Offline / zero-cost mode: select seamlessly from curated bank without error banner
      setSuggestions(getLocalTailoredActivities());
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (idx: number, suggestion: ActivitySuggestion) => {
    if (!selectedGroupId || !selectedAreaId) return;
    onApplyActivityToGroup(selectedGroupId, selectedAreaId, `${suggestion.title}: ${suggestion.description}`);
    setAppliedIndex(idx);
    setTimeout(() => setAppliedIndex(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* AI Assistant Hero Banner */}
      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-md border-2 border-blue-500 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-blue-950 font-black flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-7 h-7 text-blue-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-blue-950 px-2.5 py-0.5 rounded-full">
                Gemini 2.5 AI
              </span>
              <span className="text-xs text-blue-100 font-semibold">
                Asistente Pedagógico Proyecto ¡PRESENTE!
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Generador de Dinámicas Socializadoras Sin Pantallas
            </h2>
          </div>
        </div>

        <p className="text-xs text-blue-100 max-w-2xl leading-relaxed font-medium">
          Diseña instantáneamente dinámicas de integración, juegos tradicionales, retos deportivos y espacios de diálogo a la medida del área y del grupo de la Preparatoria Regional de Chapala.
        </p>

        {/* Form Selectors */}
        <div className="bg-blue-700/80 p-4 rounded-2xl border border-blue-400/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div>
            <label className="block text-[11px] font-black text-blue-100 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-yellow-300" />
              <span>Grupo Participante</span>
            </label>
            <select
              id="ai-select-group"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-blue-900/90 border border-blue-400/60 text-white rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-yellow-400 outline-none"
            >
              {currentShiftGroups.map(g => (
                <option key={g.id} value={g.id}>
                  Grupo {g.name} ({g.grade}º Semestre)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-blue-100 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-yellow-300" />
              <span>Área de Convivencia</span>
            </label>
            <select
              id="ai-select-area"
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="w-full bg-blue-900/90 border border-blue-400/60 text-white rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-yellow-400 outline-none"
            >
              {currentShiftAreas.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} [{a.category}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-blue-100 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-yellow-300" />
              <span>Duración Estimada</span>
            </label>
            <select
              id="ai-select-duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-blue-900/90 border border-blue-400/60 text-white rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-yellow-400 outline-none"
            >
              <option value={10}>10 Minutos (Pausa corta)</option>
              <option value={15}>15 Minutos (Receso regular)</option>
              <option value={20}>20 Minutos (Receso amplio)</option>
              <option value={30}>30 Minutos (Actividad especial)</option>
            </select>
          </div>

        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            id="generate-ai-btn"
            onClick={handleGenerateActivities}
            disabled={isLoading}
            className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-md transition-transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-950" />
                <span>Generando con Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-950" />
                <span>Generar 3 Dinámicas Personalizadas</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Error Message if API fails */}
      {errorMessage && (
        <div className="bg-yellow-50 border-2 border-yellow-300 text-blue-950 p-4 rounded-2xl text-xs flex items-center justify-between font-medium">
          <span>{errorMessage}</span>
          <span className="text-[10px] bg-yellow-200 px-2 py-0.5 rounded font-black">
            Modo Resguardo
          </span>
        </div>
      )}

      {/* Dynamic Results Grid */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span>Dinámicas Recomendadas para Grupo {selectedGroup?.name} en "{selectedArea?.name}"</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestions.map((item, idx) => {
            const cardBorders = ['border-2 border-blue-200', 'border-2 border-green-200', 'border-2 border-orange-200'];
            const borderStyle = cardBorders[idx % cardBorders.length];

            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl ${borderStyle} p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                      {item.category || 'Convivencia'}
                    </span>
                    <span className="text-[10px] font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                      <PhoneOff className="w-3 h-3 text-green-600" />
                      Sin Pantallas
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                    <p className="text-slate-500">
                      <strong className="text-slate-700">Materiales:</strong> {item.materialsNeeded || 'Ninguno'}
                    </p>
                    <p className="text-blue-900 font-medium">
                      ✨ <strong>Beneficio:</strong> {item.keyBenefit || 'Fomenta la convivencia cara a cara.'}
                    </p>
                  </div>
                </div>

                <button
                  id={`apply-activity-btn-${idx}`}
                  onClick={() => handleApply(idx, item)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    appliedIndex === idx
                      ? 'bg-green-600 text-white shadow'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {appliedIndex === idx ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>¡Asignado con Éxito al Grupo!</span>
                    </>
                  ) : (
                    <>
                      <span>Aplicar esta Dinámica al Grupo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
