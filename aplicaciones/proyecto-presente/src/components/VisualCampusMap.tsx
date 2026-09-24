import React, { useState, useRef } from 'react';
import { ConvivenciaArea, AreaAssignment, Group, Shift } from '../types';
import { detectCroquisPosition, CAMPUS_LANDMARK_PRESETS } from '../data/initialData';
import { EscudoUdeGGroup } from './EscudoUdeG';
import { BlueprintNorthGroup } from './BlueprintNorthSymbol';
import { 
  MapPin, 
  Users, 
  Sparkles, 
  Dumbbell, 
  Trees, 
  Gamepad2, 
  Coffee, 
  BookOpen, 
  Music, 
  Palette, 
  Compass, 
  PlusCircle, 
  XCircle,
  Activity,
  Smile,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Upload,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sun,
  ShieldAlert,
  HelpCircle,
  LayoutGrid,
  Map as MapIcon,
  Navigation
} from 'lucide-react';

interface VisualCampusMapProps {
  shift: Shift;
  areas: ConvivenciaArea[];
  groups: Group[];
  assignments: Record<string, AreaAssignment>;
  onAssignGroup: (groupId: string, areaId: string, activityDescription?: string) => void;
  onUnassignGroup: (groupId: string) => void;
  onOpenActivityAI: (groupId?: string, areaId?: string) => void;
  onUpdateAreaPosition?: (areaId: string, newPos: { x: number; y: number }) => void;
}

export const VisualCampusMap: React.FC<VisualCampusMapProps> = ({
  shift,
  areas,
  groups,
  assignments,
  onAssignGroup,
  onUnassignGroup,
  onOpenActivityAI,
  onUpdateAreaPosition
}) => {
  const [viewMode, setViewMode] = useState<'blueprint' | 'cards'>('blueprint');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedArea, setSelectedArea] = useState<ConvivenciaArea | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'free' | 'occupied'>('all');
  const [hoveredArea, setHoveredArea] = useState<ConvivenciaArea | null>(null);
  const [showTechnicalAdjustments, setShowTechnicalAdjustments] = useState<boolean>(true);
  const [showNorthIndicator, setShowNorthIndicator] = useState<boolean>(true);

  // User scanned image overlay support
  const [userUploadedImage, setUserUploadedImage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.35);
  const [showOverlayImage, setShowOverlayImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assignment Modal
  const [selectedAreaForAssign, setSelectedAreaForAssign] = useState<ConvivenciaArea | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [activityNote, setActivityNote] = useState<string>('');

  const currentShiftAreas = areas.filter(a => a.shift === shift);
  const currentShiftGroups = groups.filter(g => g.shift === shift);

  // Helper to find occupying assignment
  const getOccupyingAssignment = (areaId: string): AreaAssignment | undefined => {
    return (Object.values(assignments) as AreaAssignment[]).find(a => a.areaId === areaId);
  };

  const getIconForCategory = (cat: string) => {
    switch (cat) {
      case 'Deporte y Salud':
      case 'Deporte & Salud': return <Dumbbell className="w-4 h-4" />;
      case 'Juegos de Mesa y Estrategia':
      case 'Juegos de Mesa & Estrategia': return <Gamepad2 className="w-4 h-4" />;
      case 'Arte y Cultura':
      case 'Arte & Cultura': return <Palette className="w-4 h-4" />;
      case 'Descanso y Sombra':
      case 'Descanso & Sombra': return <Trees className="w-4 h-4" />;
      case 'Música y Expresión':
      case 'Música & Expresión': return <Music className="w-4 h-4" />;
      default: return <Smile className="w-4 h-4" />;
    }
  };

  // Filtered areas
  const filteredAreas = currentShiftAreas.filter(area => {
    const assignment = getOccupyingAssignment(area.id);
    const assignedGroup = assignment ? groups.find(g => g.id === assignment.groupId) : null;

    if (filterStatus === 'free' && assignment) return false;
    if (filterStatus === 'occupied' && !assignment) return false;

    if (filterCategory !== 'all' && area.category !== filterCategory) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = area.name.toLowerCase().includes(q);
      const matchDesc = area.locationDescription.toLowerCase().includes(q);
      const matchGroup = assignedGroup?.name.toLowerCase().includes(q);
      const matchTutor = assignedGroup?.tutorName?.toLowerCase().includes(q);
      return matchName || matchDesc || matchGroup || matchTutor;
    }

    return true;
  });

  const handleOpenAssignModal = (area: ConvivenciaArea) => {
    setSelectedAreaForAssign(area);
    const occupying = getOccupyingAssignment(area.id);
    if (occupying) {
      setSelectedGroupId(occupying.groupId);
      setActivityNote(occupying.activityDescription || '');
    } else {
      const assignedGroupIds = new Set(Object.keys(assignments));
      const firstFreeGroup = currentShiftGroups.find(g => !assignedGroupIds.has(g.id));
      setSelectedGroupId(firstFreeGroup ? firstFreeGroup.id : (currentShiftGroups[0]?.id || ''));
      setActivityNote('Convivencia activa y dinámicas grupales sin pantalla');
    }
  };

  const handleConfirmAssignment = () => {
    if (!selectedAreaForAssign || !selectedGroupId) return;
    onAssignGroup(selectedGroupId, selectedAreaForAssign.id, activityNote);
    setSelectedAreaForAssign(null);
  };

  // Preset Focus Zooms
  const handleFocusZone = (zone: 'all' | 'sports' | 'gardens' | 'buildings') => {
    if (zone === 'all') {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    } else if (zone === 'sports') {
      setZoomLevel(1.5);
      setPanOffset({ x: -180, y: 60 });
    } else if (zone === 'gardens') {
      setZoomLevel(1.4);
      setPanOffset({ x: -20, y: -20 });
    } else if (zone === 'buildings') {
      setZoomLevel(1.4);
      setPanOffset({ x: 120, y: -80 });
    }
  };

  // Handle image upload from user
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUserUploadedImage(event.target.result as string);
          setShowOverlayImage(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">

      {/* Main Banner with Live Indicator */}
      <div className="bg-blue-600 rounded-3xl p-6 text-white border-2 border-blue-500 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-yellow-400 text-blue-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
              Croquis Oficial UdeG
            </span>
            <span className="text-xs text-blue-100 font-semibold opacity-90">
              Preparatoria Regional de Chapala • {shift === 'matutino' ? 'Turno Matutino' : 'Turno Vespertino'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Plano Arquitectónico y Croquis Interactivo
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl mt-1 font-medium leading-relaxed">
            Representación fiel de las instalaciones de la escuela con la actualización oficial (Gimnasio al Aire Libre y Ciber Jardines 1 al 4). Supervisa en tiempo real qué espacios están ocupados por cada grupo durante el receso activo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Stats Counter */}
          <div className="bg-blue-700/80 p-3.5 rounded-2xl border border-blue-400/60 text-xs">
            <span className="text-blue-200 block text-[10px] font-bold uppercase tracking-wider">Ocupación Actual</span>
            <span className="text-yellow-300 font-black text-2xl">
              {currentShiftAreas.filter(a => !!getOccupyingAssignment(a.id)).length} / {currentShiftAreas.length}
            </span>
            <span className="text-[10px] text-blue-200 block font-semibold">Áreas Convivencia</span>
          </div>

          {/* View Switcher */}
          <div className="flex bg-blue-800/90 p-1.5 rounded-2xl border border-blue-500 shadow-inner">
            <button
              id="view-blueprint-btn"
              onClick={() => setViewMode('blueprint')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                viewMode === 'blueprint'
                  ? 'bg-yellow-400 text-blue-950 shadow-sm'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Plano Oficial</span>
            </button>
            <button
              id="view-cards-btn"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                viewMode === 'cards'
                  ? 'bg-yellow-400 text-blue-950 shadow-sm'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Fichas ({currentShiftAreas.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Category Filters, Quick Focus Presets */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-area-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar aula, jardín, cancha, grupo o tutor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({currentShiftAreas.length})
            </button>
            <button
              onClick={() => setFilterStatus('occupied')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                filterStatus === 'occupied' ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              Ocupadas ({currentShiftAreas.filter(a => !!getOccupyingAssignment(a.id)).length})
            </button>
            <button
              onClick={() => setFilterStatus('free')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                filterStatus === 'free' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Libres ({currentShiftAreas.filter(a => !getOccupyingAssignment(a.id)).length})
            </button>
          </div>

          {/* Image Overlay Toggle */}
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            
            {userUploadedImage ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900">
                <button
                  onClick={() => setShowOverlayImage(!showOverlayImage)}
                  className="flex items-center gap-1 hover:underline"
                  title="Activar/desactivar imagen escaneada original"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>{showOverlayImage ? 'Ocultar Escaneo' : 'Ver Escaneo'}</span>
                </button>
                {showOverlayImage && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="w-16 h-1.5 accent-amber-600 cursor-pointer"
                    title="Opacidad del croquis escaneado"
                  />
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-xs"
                title="Superponer archivo Croquis Prepa Chapala_2.jpg escaneado"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Superponer Escaneo JPG</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* BLUEPRINT INTERACTIVE MAP VIEW */}
      {viewMode === 'blueprint' && (
        <div className="bg-slate-900 rounded-3xl p-3 sm:p-5 border-2 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col gap-4">
          
          {/* Map Toolbar (Zoom, Presets, Reset) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700 text-xs text-white z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-300 mr-1">Enfoque:</span>
              <button
                onClick={() => handleFocusZone('all')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition-colors"
              >
                Plantel Completo
              </button>
              <button
                onClick={() => handleFocusZone('gardens')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition-colors text-emerald-300"
              >
                Ciber Jardines y Ágora
              </button>
              <button
                onClick={() => handleFocusZone('sports')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition-colors text-amber-300"
              >
                Deportes y Gimnasio
              </button>
              <button
                onClick={() => handleFocusZone('buildings')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition-colors text-blue-300"
              >
                Edificios y Aulas
              </button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
                title="Acercar plano"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-black w-10 text-center font-mono">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
                title="Alejar plano"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold ml-1"
                title="Restablecer vista"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Toggle real North indicator / omit */}
              <button
                onClick={() => setShowNorthIndicator(prev => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-colors ml-1.5 ${
                  showNorthIndicator 
                    ? 'bg-blue-600/90 text-white hover:bg-blue-500 shadow-xs' 
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                }`}
                title={showNorthIndicator ? "Clic para omitir el indicador de Norte" : "Clic para mostrar el Norte oficial del plano"}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{showNorthIndicator ? 'Norte: Visible' : 'Norte: Omitido'}</span>
              </button>
            </div>
          </div>

          {/* SVG Map Canvas Container */}
          <div className="relative w-full aspect-[1000/760] bg-[#faf8f5] rounded-2xl overflow-hidden border border-slate-300 shadow-inner select-none cursor-crosshair">
            
            <div 
              className="w-full h-full transition-transform duration-300 ease-out origin-center"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`
              }}
            >
              {/* Optional Scanned Raster Overlay */}
              {userUploadedImage && showOverlayImage && (
                <img
                  src={userUploadedImage}
                  alt="Croquis Original Escaneado"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
                  style={{ opacity: overlayOpacity }}
                />
              )}

              {/* HIGH PRECISION ARCHITECTURAL SVG BLUEPRINT */}
              <svg 
                viewBox="0 0 1000 760" 
                className="w-full h-full absolute inset-0 z-10"
                style={{ fontFamily: 'sans-serif' }}
              >
                <defs>
                  {/* Pavement pattern */}
                  <pattern id="plazoleta-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
                    <rect width="16" height="16" fill="#f4ece1" />
                    <path d="M 0,8 l 16,0 M 8,0 l 0,16" stroke="#d5c8b5" strokeWidth="0.75" />
                  </pattern>
                  <pattern id="grass-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                    <rect width="20" height="20" fill="#eef7ee" />
                    <circle cx="5" cy="5" r="1.5" fill="#c3e4c3" opacity="0.6" />
                    <circle cx="15" cy="15" r="1.5" fill="#c3e4c3" opacity="0.6" />
                  </pattern>
                </defs>

                {/* Outer Architectural Double Border */}
                <rect x="15" y="15" width="970" height="730" fill="none" stroke="#222" strokeWidth="1.5" />
                <rect x="20" y="20" width="960" height="720" fill="none" stroke="#444" strokeWidth="0.75" />

                {/* INSTITUTIONAL TITLE BLOCK (BOTTOM) */}
                <g id="title-block" transform="translate(20, 605)">
                  <rect x="0" y="0" width="960" height="135" fill="#ffffff" stroke="#222" strokeWidth="1.5" />
                  
                  {/* UdeG Seal & Hierarchy */}
                  <g transform="translate(25, 12)">
                    {/* Escudo Oficial de la Universidad de Guadalajara (SVG oficial de Wikimedia Commons) */}
                    <EscudoUdeGGroup
                      x={0}
                      y={0}
                      width={80}
                      height={108.6}
                    />

                    <g transform="translate(100, 22)">
                      <text x="0" y="20" fontSize="21" fontWeight="900" fill="#1e293b" letterSpacing="-0.5">
                        Universidad de Guadalajara
                      </text>
                      <text x="0" y="44" fontSize="13.5" fontWeight="700" fill="#475569">
                        Sistema de Educación Media Superior
                      </text>
                      <text x="0" y="68" fontSize="14" fontWeight="800" fill="#0284c7">
                        Preparatoria Regional de Chapala
                      </text>
                    </g>
                  </g>

                  {/* Subtle vertical divider */}
                  <line x1="465" y1="20" x2="465" y2="115" stroke="#e2e8f0" strokeWidth="1.2" />

                  {/* Croquis de la escuela title & Project info */}
                  <g transform="translate(495, 24)">
                    <text x="0" y="32" fontSize="28" fontWeight="900" fill="#0f172a" letterSpacing="-0.5">
                      Croquis de la escuela
                    </text>
                    <text x="0" y="58" fontSize="13" fontWeight="700" fill="#475569">
                      Distribución de Edificios, Canchas y Áreas de Convivencia
                    </text>
                    <g transform="translate(0, 72)">
                      <rect x="0" y="0" width="280" height="22" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                      <text x="140" y="15" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1d4ed8">
                        PROYECTO ¡PRESENTE! • ESPACIOS DE CONVIVENCIA
                      </text>
                    </g>
                  </g>

                  {/* Authentic Blueprint North Indicator (as in official architectural plan image) */}
                  {showNorthIndicator && (
                    <g transform="translate(895, 67)">
                      <BlueprintNorthGroup
                        scale={1.1}
                        onClick={() => setShowNorthIndicator(false)}
                        title="Sentido real del Norte según el croquis oficial. Haz clic para omitir."
                      />
                    </g>
                  )}
                </g>

                {/* SURROUNDING STREETS */}
                {/* Calle Teofilo Silva (Bottom) */}
                <g id="calle-teofilo-silva">
                  <line x1="120" y1="570" x2="880" y2="570" stroke="#333" strokeWidth="1.2" strokeDasharray="6,4" />
                  <text x="500" y="590" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569" letterSpacing="1.5">
                    CALLE TEOFILO SILVA
                  </text>
                </g>

                {/* Calle Parota (West / Left) */}
                <g id="calle-parota" transform="translate(50, 480) rotate(-90)">
                  <text x="0" y="0" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569" letterSpacing="1.5">
                    CALLE PAROTA
                  </text>
                </g>

                {/* PEDESTRIAN WALKWAYS (ANDADORES) - ARCHITECTURAL DUAL CONTOUR */}
                <g id="walkways-base">
                  {/* Outer pavement border / edge */}
                  <g fill="none" stroke="#94a3b8" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
                    {/* Main continuous Andador: West under Gimnasio al Aire Libre -> Sweeping arch over Edificio C -> Diagonal descent along Ciber Jardín 3 and Gimnasio -> Horizontal corridor under Sports block */}
                    <path d="M 170 210 L 315 210 C 355 210, 365 110, 430 110 C 475 110, 500 120, 535 160 L 575 210 C 583 218, 592 220, 605 220 L 865 220" />
                    {/* Branch up into Ciber Jardín 2 */}
                    <path d="M 865 220 L 865 145" />
                    {/* Branch down into Plazoleta */}
                    <path d="M 670 220 L 670 295" />
                    {/* Branch to Laboratorio de Alimentos */}
                    <path d="M 825 220 L 825 248" />
                    {/* Plazoleta radial branches */}
                    <path d="M 625 340 L 560 340" />
                    <path d="M 715 340 L 775 340" />
                    <path d="M 670 385 L 670 470 L 640 470" />
                    {/* Ciber Jardín 1 central node connectors */}
                    <path d="M 340 310 L 340 210" />
                    <path d="M 354 325 L 405 325" />
                    <path d="M 326 325 L 190 325" />
                    <path d="M 340 340 L 340 395 L 220 395" />
                    {/* Connector between Edificio C and East wing */}
                    <path d="M 453 260 L 510 260" />
                  </g>

                  {/* Inner pavement surface */}
                  <g fill="none" stroke="#f8fafc" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 170 210 L 315 210 C 355 210, 365 110, 430 110 C 475 110, 500 120, 535 160 L 575 210 C 583 218, 592 220, 605 220 L 865 220" />
                    <path d="M 865 220 L 865 145" />
                    <path d="M 670 220 L 670 295" />
                    <path d="M 825 220 L 825 248" />
                    <path d="M 625 340 L 560 340" />
                    <path d="M 715 340 L 775 340" />
                    <path d="M 670 385 L 670 470 L 640 470" />
                    <path d="M 340 310 L 340 210" />
                    <path d="M 354 325 L 405 325" />
                    <path d="M 326 325 L 190 325" />
                    <path d="M 340 340 L 340 395 L 220 395" />
                    <path d="M 453 260 L 510 260" />
                  </g>
                </g>

                {/* WALKWAY LABELS (EXACTLY AS IN SCANNED ORIGINAL CROQUIS) */}
                <text x="245" y="213" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#475569" letterSpacing="1">ANDADOR</text>
                <text x="625" y="223" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#475569" letterSpacing="1">ANDADOR</text>

                {/* ZONAS VERDES DE FONDO (Ciber Jardines) */}
                {/* Ciber Jardín 1 con su nodo central */}
                <g id="ciber-jardin-1-group">
                  <rect x="290" y="275" width="95" height="105" rx="14" fill="url(#grass-pattern)" stroke="#86efac" strokeWidth="1" />
                  {/* Iconic central plaza hub of Ciber Jardín 1 */}
                  <circle cx="340" cy="325" r="16" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                  <circle cx="340" cy="325" r="7" fill="#bbf7d0" stroke="#16a34a" strokeWidth="0.8" />
                </g>
                
                {/* Ciber Jardín 3 (Jardín arbolado junto a la curva y diagonal del andador) */}
                <polygon points="370,145 430,115 500,120 540,175 480,205 405,205" fill="url(#grass-pattern)" stroke="#86efac" strokeWidth="1.2" />

                {/* Ciber Jardín 4 (Central) */}
                <rect x="560" y="325" width="95" height="95" rx="14" fill="url(#grass-pattern)" stroke="#86efac" strokeWidth="1" />

                {/* Ciber Jardín 2 (Nororiente - a la derecha de Cancha Múltiple) */}
                <rect x="835" y="95" width="115" height="113" rx="14" fill="url(#grass-pattern)" stroke="#86efac" strokeWidth="1.2" />

                {/* PLAZOLETA (Octagonal open square) */}
                <polygon points="650,295 690,295 715,320 715,360 690,385 650,385 625,360 625,320" fill="url(#plazoleta-pattern)" stroke="#94a3b8" strokeWidth="1.8" />
                <text x="670" y="343" textAnchor="middle" fontSize="10" fontWeight="900" fill="#334155" letterSpacing="0.8">
                  PLAZOLETA
                </text>

                {/* CANCHA DE FUTBOL (NORTH) */}
                <g id="cancha-futbol" transform="translate(665, 25)">
                  <rect x="0" y="0" width="160" height="55" rx="6" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" strokeDasharray="4,3" />
                  <line x1="80" y1="0" x2="80" y2="55" stroke="#86efac" strokeWidth="1" strokeDasharray="2,2" />
                  <circle cx="80" cy="27.5" r="14" fill="none" stroke="#86efac" strokeWidth="1" />
                  <rect x="0" y="16" width="14" height="23" fill="none" stroke="#86efac" strokeWidth="1" />
                  <rect x="146" y="16" width="14" height="23" fill="none" stroke="#86efac" strokeWidth="1" />
                  <text x="80" y="31" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#15803d">
                    CANCHA DE FÚTBOL
                  </text>
                </g>

                {/* CANCHA DE USOS MÚLTIPLES (Cancha Múltiple - Básquetbol y Voleibol) */}
                <g id="cancha-multiple" transform="translate(665, 95)">
                  <rect x="0" y="0" width="160" height="113" rx="3" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.8" />
                  {/* Basketball center line & circle */}
                  <line x1="80" y1="0" x2="80" y2="113" stroke="#475569" strokeWidth="1.2" />
                  <circle cx="80" cy="56.5" r="18" fill="none" stroke="#475569" strokeWidth="1.2" />
                  {/* Left basketball key */}
                  <rect x="0" y="38" width="36" height="37" fill="#f1f5f9" stroke="#475569" strokeWidth="1.2" />
                  <path d="M 36 38 A 18.5 18.5 0 0 1 36 75" fill="none" stroke="#475569" strokeWidth="1.2" />
                  {/* Right basketball key */}
                  <rect x="124" y="38" width="36" height="37" fill="#f1f5f9" stroke="#475569" strokeWidth="1.2" />
                  <path d="M 124 38 A 18.5 18.5 0 0 0 124 75" fill="none" stroke="#475569" strokeWidth="1.2" />
                  {/* Volleyball markings */}
                  <line x1="60" y1="14" x2="100" y2="14" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
                  <line x1="60" y1="99" x2="100" y2="99" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
                  <text x="80" y="94" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#0f172a" letterSpacing="0.5">
                    CANCHA MÚLTIPLE
                  </text>
                  <text x="80" y="105" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#64748b">
                    (Cancha de usos múltiples)
                  </text>
                </g>

                {/* GIMNASIO TECHADO, AULA DE YOGA Y AULA DE DANZA */}
                <g id="gimnasio-yoga">
                  {/* Gimnasio Techado (Con fachada poniente diagonal fiel al croquis original) */}
                  <polygon 
                    points="515,95 595,95 595,208 578,208" 
                    fill="#ffffff" 
                    stroke="#1e293b" 
                    strokeWidth="1.8" 
                  />
                  <line x1="535" y1="132" x2="595" y2="132" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="555" y1="168" x2="595" y2="168" stroke="#e2e8f0" strokeWidth="1" />
                  <text x="562" y="145" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#1e293b" letterSpacing="0.5">
                    GIMNASIO
                  </text>
                  <text x="562" y="157" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#475569">
                    TECHADO
                  </text>
                  {/* Entrance indicator */}
                  <rect x="580" y="205" width="12" height="4" fill="#3b82f6" rx="1" />

                  {/* Aula de Yoga */}
                  <rect x="595" y="95" width="35" height="113" rx="1" fill="#fffdf2" stroke="#1e293b" strokeWidth="1.8" />
                  <text x="612.5" y="142" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#1e293b">
                    AULA DE
                  </text>
                  <text x="612.5" y="153" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#b45309">
                    YOGA
                  </text>
                  <rect x="604" y="204" width="16" height="4" fill="#f59e0b" rx="1" />

                  {/* Aula de Danza */}
                  <rect x="630" y="95" width="35" height="113" rx="1" fill="#fff8f0" stroke="#1e293b" strokeWidth="1.8" />
                  <text x="647.5" y="142" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#1e293b">
                    AULA DE
                  </text>
                  <text x="647.5" y="153" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#ea580c">
                    DANZA
                  </text>
                  <rect x="639" y="204" width="16" height="4" fill="#ea580c" rx="1" />
                </g>

                {/* GIMNASIO AL AIRE LIBRE (Ubicado cerca del andador, a distancia equivalente a la del Gimnasio Techado) */}
                <g id="gimnasio-aire-libre" transform="translate(245, 150)">
                  <rect x="0" y="0" width="80" height="34" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="3,2" />
                  <text x="40" y="14" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#991b1b">
                    GIMNASIO AL
                  </text>
                  <text x="40" y="24" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#991b1b">
                    AIRE LIBRE
                  </text>
                  {/* Calisthenics bar icon hint */}
                  <line x1="16" y1="28" x2="64" y2="28" stroke="#ef4444" strokeWidth="1" />
                  <line x1="24" y1="28" x2="24" y2="32" stroke="#ef4444" strokeWidth="1" />
                  <line x1="56" y1="28" x2="56" y2="32" stroke="#ef4444" strokeWidth="1" />
                </g>

                {/* CIBER JARDÍN LABELS */}
                <text x="312" y="340" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#166534">
                  CIBER JARDÍN 1
                </text>
                <text x="892" y="145" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#166534">
                  CIBER JARDÍN 2
                </text>
                <text x="892" y="157" textAnchor="middle" fontSize="6" fontWeight="700" fill="#15803d">
                  (Nororiente)
                </text>
                <g transform="translate(470, 160) rotate(38)">
                  <text x="0" y="0" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#15803d" letterSpacing="1.5">
                    CIBER JARDÍN 3
                  </text>
                </g>
                <text x="607" y="375" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#166534">
                  CIBER JARDÍN 4
                </text>

                {/* SERVICIOS EDUCATIVOS 1 & COLEGIO DEPARTAMENTAL (NORTHWEST) */}
                <g id="servicios-educativos" transform="translate(145, 260)">
                  <rect x="0" y="0" width="45" height="42" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="22.5" y="18" textAnchor="middle" fontSize="6" fontWeight="700" fill="#334155">Servicios</text>
                  <text x="22.5" y="27" textAnchor="middle" fontSize="6" fontWeight="700" fill="#334155">Educativos 1</text>
                  
                  <rect x="0" y="47" width="45" height="35" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="22.5" y="62" textAnchor="middle" fontSize="6" fontWeight="700" fill="#334155">Colegio</text>
                  <text x="22.5" y="71" textAnchor="middle" fontSize="6" fontWeight="700" fill="#334155">Departamental</text>
                </g>

                {/* BIBLIOTECA, SALA DE PROYECCIONES & EL ÁGORA */}
                <g id="biblioteca-agora" transform="translate(110, 395)">
                  {/* El Ágora (Extensión al poniente a la altura de la Biblioteca) */}
                  <g id="agora-foro">
                    <path d="M 42 48 A 35 35 0 0 0 42 118 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.6" />
                    {/* Concentric tiers / gradas del foro */}
                    <path d="M 42 58 A 25 25 0 0 0 42 108" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
                    <path d="M 42 68 A 15 15 0 0 0 42 98" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="37" cy="83" r="3" fill="#3b82f6" opacity="0.6" />
                    <text x="23" y="80" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#0f172a">
                      Ágora
                    </text>
                    <text x="23" y="90" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#64748b">
                      (Foro)
                    </text>
                  </g>

                  {/* Sala de Proyecciones (North attached to library) */}
                  <rect x="75" y="0" width="70" height="40" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="110" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill="#334155">Sala de</text>
                  <text x="110" y="28" textAnchor="middle" fontSize="7" fontWeight="700" fill="#334155">proyecciones</text>

                  {/* Main Biblioteca Building */}
                  <rect x="42" y="45" width="90" height="75" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                  <text x="87" y="60" textAnchor="middle" fontSize="11" fontWeight="900" fill="#0f172a">
                    BIBLIOTECA
                  </text>
                  
                  {/* Sala de lectura */}
                  <text x="65" y="75" fontSize="7" fill="#475569">Sala de</text>
                  <text x="65" y="84" fontSize="7" fill="#475569">lectura</text>

                  {/* Sala de computo */}
                  <rect x="42" y="92" width="45" height="28" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.75" />
                  <text x="64" y="104" textAnchor="middle" fontSize="6.5" fill="#334155">Sala de</text>
                  <text x="64" y="113" textAnchor="middle" fontSize="6.5" fill="#334155">cómputo</text>

                  {/* Servicios Educativos / Tutorías */}
                  <rect x="62" y="120" width="42" height="28" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="83" y="132" textAnchor="middle" fontSize="6.5" fill="#334155">Servicios</text>
                  <text x="83" y="141" textAnchor="middle" fontSize="6.5" fill="#334155">Educativos</text>
                  <text x="83" y="150" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#0284c7">Tutorías</text>
                </g>

                {/* EDIFICIO C (AULAS 6-15, AUDITORIO, PREFECTURA, SISTEMAS) */}
                <g id="edificio-c" transform="translate(405, 205)">
                  {/* North Wing (Aulas 10, 11, 12, Auditorio en PB debajo de aulas 10 y 11) */}
                  <rect x="0" y="0" width="48" height="98" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                  
                  {/* Visual highlight for Auditorio spanning the footprint of Aulas 10 and 11 in Planta Baja */}
                  <rect x="1" y="1" width="46" height="63" fill="#eff6ff" opacity="0.85" />
                  
                  <line x1="0" y1="32" x2="48" y2="32" stroke="#475569" strokeWidth="0.75" />
                  <line x1="0" y1="65" x2="48" y2="65" stroke="#475569" strokeWidth="0.75" />
                  
                  {/* Aula 10 & Planta Baja Auditorio */}
                  <text x="24" y="15" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#0f172a">Aula 10</text>
                  <text x="24" y="25" textAnchor="middle" fontSize="5" fontWeight="800" fill="#2563eb">AUDITORIO (PB)</text>
                  
                  {/* Aula 11 & Planta Baja Auditorio */}
                  <text x="24" y="47" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#0f172a">Aula 11</text>
                  <text x="24" y="57" textAnchor="middle" fontSize="5" fontWeight="800" fill="#2563eb">AUDITORIO (PB)</text>
                  
                  {/* Aula 12 & Prefectura */}
                  <text x="24" y="80" textAnchor="middle" fontSize="6.5" fontWeight="700">Aula 12</text>
                  <text x="24" y="90" textAnchor="middle" fontSize="5" fontWeight="600" fill="#64748b">Prefectura (PB)</text>

                  {/* Architectural callout tab for Auditorio on the west exterior edge */}
                  <g transform="translate(-46, 10)">
                    <rect x="0" y="0" width="42" height="46" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.2" />
                    <text x="21" y="16" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#1e40af">AUDITORIO</text>
                    <text x="21" y="27" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#2563eb">(Planta Baja)</text>
                    <text x="21" y="37" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#475569">Bajo Aulas</text>
                    <text x="21" y="43" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#475569">10 y 11</text>
                    <line x1="42" y1="23" x2="46" y2="23" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="1.5,1.5" />
                  </g>

                  {/* Stairs / Escaleras */}
                  <rect x="0" y="100" width="48" height="18" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" />
                  <line x1="12" y1="100" x2="12" y2="118" stroke="#64748b" />
                  <line x1="24" y1="100" x2="24" y2="118" stroke="#64748b" />
                  <line x1="36" y1="100" x2="36" y2="118" stroke="#64748b" />

                  {/* South Wing (Aulas 13, 14, 15, Sanitarios) */}
                  <rect x="0" y="120" width="48" height="85" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="0" y1="162" x2="48" y2="162" stroke="#475569" strokeWidth="0.75" />
                  <text x="24" y="145" textAnchor="middle" fontSize="7" fontWeight="700">Aula 13</text>
                  <text x="24" y="185" textAnchor="middle" fontSize="7" fontWeight="700">Aula 14</text>
                  <g transform="translate(-8, 195) rotate(-90)">
                    <text x="0" y="0" fontSize="5.5" fontWeight="700" fill="#64748b">(PLANTA BAJA) Sanitarios Aula 15</text>
                  </g>

                  {/* East Wing (Aulas 6, 7, 8, 9, Sistemas) */}
                  <rect x="105" y="120" width="48" height="85" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="105" y1="148" x2="153" y2="148" stroke="#475569" strokeWidth="0.75" />
                  <line x1="105" y1="176" x2="153" y2="176" stroke="#475569" strokeWidth="0.75" />
                  <text x="129" y="137" textAnchor="middle" fontSize="7" fontWeight="700">Aula 6</text>
                  <text x="129" y="165" textAnchor="middle" fontSize="7" fontWeight="700">Aula 7</text>
                  <text x="129" y="193" textAnchor="middle" fontSize="7" fontWeight="700">Aula 8</text>
                  <g transform="translate(97, 195) rotate(-90)">
                    <text x="0" y="0" fontSize="5.5" fontWeight="700" fill="#64748b">(PLANTA BAJA) Sistemas Lab cómputo 3 Aula 9</text>
                  </g>

                  {/* Stairs east */}
                  <rect x="105" y="207" width="48" height="15" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" />
                  <line x1="117" y1="207" x2="117" y2="222" stroke="#64748b" />
                  <line x1="129" y1="207" x2="129" y2="222" stroke="#64748b" />
                  <line x1="141" y1="207" x2="141" y2="222" stroke="#64748b" />

                  {/* EDIFICIO C Label */}
                  <text x="24" y="222" textAnchor="middle" fontSize="9" fontWeight="900" fill="#0f172a">
                    EDIFICIO C
                  </text>
                </g>

                {/* EDIFICIO D (DIRECCIÓN, CONTROL ESCOLAR, CÓMPUTO 2) */}
                <g id="edificio-d" transform="translate(300, 440)">
                  <rect x="0" y="0" width="140" height="42" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="42" y1="0" x2="42" y2="42" stroke="#475569" strokeWidth="0.75" />
                  <line x1="72" y1="0" x2="72" y2="42" stroke="#475569" strokeWidth="0.75" />
                  <line x1="102" y1="0" x2="102" y2="42" stroke="#475569" strokeWidth="0.75" />

                  <text x="21" y="18" textAnchor="middle" fontSize="6" fill="#334155">Laboratorio</text>
                  <text x="21" y="26" textAnchor="middle" fontSize="6" fill="#334155">de cómputo</text>
                  <text x="21" y="34" textAnchor="middle" fontSize="6" fontWeight="700">2</text>

                  <text x="57" y="22" textAnchor="middle" fontSize="6" fill="#334155">Sala de</text>
                  <text x="57" y="30" textAnchor="middle" fontSize="6" fontWeight="700">gobierno</text>

                  <text x="87" y="26" textAnchor="middle" fontSize="6" fontWeight="800">Dirección</text>

                  <text x="121" y="16" textAnchor="middle" fontSize="5.5" fill="#334155">Secretario</text>
                  <text x="121" y="24" textAnchor="middle" fontSize="5.5" fill="#334155">Oficial Mayor</text>
                  <text x="121" y="32" textAnchor="middle" fontSize="5.5" fontWeight="700">Control Escolar</text>

                  <text x="70" y="55" textAnchor="middle" fontSize="9" fontWeight="900" fill="#0f172a">
                    EDIFICIO D
                  </text>
                </g>

                {/* EDIFICIO B (SALA DE MAESTROS, CÓMPUTO 1) */}
                <g id="edificio-b" transform="translate(510, 440)">
                  <rect x="0" y="0" width="48" height="42" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                  <text x="24" y="20" textAnchor="middle" fontSize="6" fill="#334155">Laboratorio</text>
                  <text x="24" y="28" textAnchor="middle" fontSize="6" fill="#334155">de cómputo</text>
                  <text x="24" y="36" textAnchor="middle" fontSize="6" fontWeight="700">1</text>
                  <g transform="translate(-8, 38) rotate(-90)">
                    <text x="0" y="0" fontSize="5.5" fontWeight="700" fill="#64748b">(PLANTA BAJA) Sala de maestros</text>
                  </g>
                  <text x="24" y="55" textAnchor="middle" fontSize="9" fontWeight="900" fill="#0f172a">
                    EDIFICIO B
                  </text>
                </g>

                {/* EDIFICIO A (AULAS 1-5, ESCALERAS, LAB CIENCIAS, BTT) */}
                <g id="edificio-a" transform="translate(775, 330)">
                  <rect x="0" y="0" width="40" height="175" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="0" y1="35" x2="40" y2="35" stroke="#475569" strokeWidth="0.75" />
                  <line x1="0" y1="70" x2="40" y2="70" stroke="#475569" strokeWidth="0.75" />
                  <line x1="0" y1="105" x2="40" y2="105" stroke="#475569" strokeWidth="0.75" />
                  <line x1="0" y1="140" x2="40" y2="140" stroke="#475569" strokeWidth="0.75" />

                  <text x="20" y="22" textAnchor="middle" fontSize="7" fontWeight="700">Aula 2</text>
                  <text x="20" y="57" textAnchor="middle" fontSize="7" fontWeight="700">Aula 3</text>
                  
                  {/* Escaleras entre Aula 3 y Aula 4 */}
                  <rect x="0.5" y="70.5" width="39" height="34" fill="#f8fafc" />
                  <line x1="5" y1="76" x2="35" y2="76" stroke="#cbd5e1" strokeWidth="0.8" />
                  <line x1="5" y1="81" x2="35" y2="81" stroke="#cbd5e1" strokeWidth="0.8" />
                  <line x1="5" y1="94" x2="35" y2="94" stroke="#cbd5e1" strokeWidth="0.8" />
                  <line x1="5" y1="99" x2="35" y2="99" stroke="#cbd5e1" strokeWidth="0.8" />
                  <text x="20" y="89" textAnchor="middle" fontSize="6" fontWeight="800" fill="#475569">Escaleras</text>

                  <text x="20" y="125" textAnchor="middle" fontSize="7" fontWeight="700">Aula 4</text>
                  <text x="20" y="160" textAnchor="middle" fontSize="7" fontWeight="700">Aula 5</text>
                  <g transform="translate(48, 65) rotate(90)">
                    <text x="0" y="0" fontSize="5.5" fontWeight="700" fill="#64748b">Laboratorio de ciencias (PLANTA BAJA)</text>
                  </g>
                  <g transform="translate(48, 150) rotate(90)">
                    <text x="0" y="0" fontSize="5.5" fontWeight="700" fill="#64748b">Sanitarios BTT (PLANTA BAJA) Aula 1</text>
                  </g>

                  <text x="20" y="190" textAnchor="middle" fontSize="9" fontWeight="900" fill="#0f172a">
                    EDIFICIO A
                  </text>
                </g>

                {/* LABORATORIO DE ALIMENTOS (EAST EDGE) */}
                <g id="lab-alimentos" transform="translate(820, 248)">
                  <rect x="0" y="0" width="40" height="50" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="20" y="22" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#334155">LABORATORIO</text>
                  <text x="20" y="32" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#334155">DE ALIMENTOS</text>
                </g>

                {/* SOUTH PERIMETER: INGRESO, VIGILANCIA, ESTACIONAMIENTO */}
                <g id="south-facilities">
                  <text x="490" y="545" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">Estacionamiento</text>
                  <text x="785" y="545" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">Estacionamiento</text>
                  
                  {/* Ingreso principal */}
                  <rect x="640" y="525" width="42" height="24" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="661" y="540" textAnchor="middle" fontSize="7" fontWeight="900" fill="#002d62">INGRESO</text>
                  
                  {/* Vigilancia */}
                  <rect x="686" y="500" width="28" height="20" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="700" y="513" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#334155">Vigilancia</text>
                </g>

                {/* HAND-DRAWN ARCHITECTURAL TREES (ARBOLADO REAL DEL CROQUIS ORIGINAL) */}
                {[
                  // Trees along the curved arch over Edificio C (matching original croquis)
                  { cx: 325, cy: 175, r: 9 },
                  { cx: 355, cy: 130, r: 9 },
                  { cx: 395, cy: 95, r: 9 },
                  { cx: 435, cy: 88, r: 9 },
                  { cx: 475, cy: 95, r: 9 },
                  { cx: 510, cy: 125, r: 9 },
                  // Trees inside Ciber Jardín 3
                  { cx: 440, cy: 165, r: 8 },
                  { cx: 475, cy: 190, r: 8 },
                  // Northwest trees near Gimnasio al Aire libre & Servicios
                  { cx: 135, cy: 195, r: 9 },
                  { cx: 230, cy: 250, r: 9 },
                  { cx: 280, cy: 260, r: 9 },
                  // Ciber Jardín 1 trees
                  { cx: 275, cy: 280, r: 8 },
                  { cx: 275, cy: 370, r: 9 },
                  { cx: 375, cy: 275, r: 9 },
                  { cx: 375, cy: 375, r: 9 },
                  // Row of trees between Edificio C and East wing (Aulas 6-8)
                  { cx: 485, cy: 325, r: 8 },
                  { cx: 485, cy: 355, r: 8 },
                  { cx: 485, cy: 385, r: 8 },
                  // Central Plaza / Ciber Jardín 4 trees
                  { cx: 585, cy: 360, r: 9 },
                  { cx: 630, cy: 265, r: 9 },
                  { cx: 630, cy: 400, r: 9 },
                  { cx: 710, cy: 365, r: 9 },
                  { cx: 755, cy: 365, r: 9 },
                  { cx: 725, cy: 450, r: 10 },
                  { cx: 585, cy: 440, r: 10 },
                  // North east trees (Ciber Jardín 2)
                  { cx: 875, cy: 115, r: 8 },
                  { cx: 935, cy: 115, r: 8 },
                  { cx: 875, cy: 175, r: 8 },
                  { cx: 935, cy: 175, r: 8 },
                  // South fence trees
                  { cx: 340, cy: 505, r: 8 },
                  { cx: 440, cy: 515, r: 8 },
                  { cx: 550, cy: 515, r: 8 },
                  { cx: 600, cy: 515, r: 8 },
                  { cx: 730, cy: 515, r: 8 },
                  { cx: 810, cy: 515, r: 8 },
                  { cx: 855, cy: 515, r: 8 },
                ].map((tree, idx) => (
                  <g key={`tree-${idx}`} transform={`translate(${tree.cx}, ${tree.cy})`}>
                    <circle cx="0" cy="0" r={tree.r} fill="#dcfce7" stroke="#15803d" strokeWidth="0.8" />
                    <path d={`M 0 -${tree.r} L 0 ${tree.r} M -${tree.r} 0 L ${tree.r} 0 M -${tree.r*0.7} -${tree.r*0.7} L ${tree.r*0.7} ${tree.r*0.7} M -${tree.r*0.7} ${tree.r*0.7} L ${tree.r*0.7} -${tree.r*0.7}`} stroke="#15803d" strokeWidth="0.5" />
                  </g>
                ))}

                {/* ============================================================ */}
                {/* REAL-TIME INTERACTIVE MARKERS ON EVERY CONVIVENCIA AREA       */}
                {/* ============================================================ */}
                {filteredAreas.map((area) => {
                  const assignment = getOccupyingAssignment(area.id);
                  const group = assignment ? groups.find(g => g.id === assignment.groupId) : null;
                  const rawPos = area.croquisPosition;
                  const isDefaultOrMissing = !rawPos || (Math.abs(rawPos.x - 50) < 0.01 && Math.abs(rawPos.y - 50) < 0.01);
                  const pos = isDefaultOrMissing ? detectCroquisPosition(area.name, area.locationDescription) : rawPos;
                  
                  // Convert percentage (0-100) to SVG viewbox coords (1000 x 760)
                  const svgX = (pos.x / 100) * 1000;
                  const svgY = (pos.y / 100) * 760;

                  const isHovered = hoveredArea?.id === area.id;
                  const isOccupied = !!assignment;

                  return (
                    <g 
                      key={area.id}
                      transform={`translate(${svgX}, ${svgY})`}
                      className="cursor-pointer transition-all duration-150"
                      onClick={() => handleOpenAssignModal(area)}
                      onMouseEnter={() => setHoveredArea(area)}
                      onMouseLeave={() => setHoveredArea(null)}
                    >
                      {/* Pulse circle */}
                      <circle
                        cx="0"
                        cy="0"
                        r={isOccupied ? 17 : 14}
                        fill={isOccupied ? '#f59e0b' : '#10b981'}
                        opacity={isHovered ? 0.45 : 0.25}
                        className="animate-pulse"
                      />

                      {/* Pin Outer circle */}
                      <circle
                        cx="0"
                        cy="0"
                        r={isOccupied ? 14 : 11}
                        fill={isOccupied ? '#fef08a' : '#d1fae5'}
                        stroke={isOccupied ? '#b45309' : '#059669'}
                        strokeWidth={isHovered ? 2.5 : 1.75}
                      />

                      {/* Pin Center content */}
                      {isOccupied && group ? (
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="900"
                          fill="#78350f"
                        >
                          {group.name}
                        </text>
                      ) : (
                        <circle
                          cx="0"
                          cy="0"
                          r="4"
                          fill="#059669"
                        />
                      )}

                      {/* Area Label Tag */}
                      <g transform="translate(0, 18)">
                        <rect
                          x={-Math.min(area.name.length * 3.3, 50)}
                          y="0"
                          width={Math.min(area.name.length * 6.6, 100)}
                          height="14"
                          rx="4"
                          fill={isOccupied ? '#78350f' : '#064e3b'}
                          opacity={0.9}
                        />
                        <text
                          x="0"
                          y="10"
                          textAnchor="middle"
                          fontSize="7"
                          fontWeight="800"
                          fill="#ffffff"
                        >
                          {area.name.length > 20 ? `${area.name.slice(0, 19)}…` : area.name}
                        </text>
                      </g>

                    </g>
                  );
                })}

              </svg>
            </div>

            {/* FLOATING HOVER TOOLTIP */}
            {hoveredArea && (
              <div className="absolute top-4 right-4 z-20 bg-slate-900/95 text-white p-4 rounded-2xl shadow-xl border border-slate-700 max-w-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    {hoveredArea.category}
                  </span>
                  {getOccupyingAssignment(hoveredArea.id) ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                      OCUPADA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                      DISPONIBLE
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-white">
                  {hoveredArea.name}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  📍 {hoveredArea.locationDescription}
                </p>

                {(() => {
                  const assignment = getOccupyingAssignment(hoveredArea.id);
                  const group = assignment ? groups.find(g => g.id === assignment.groupId) : null;
                  if (assignment && group) {
                    return (
                      <div className="mt-2.5 pt-2 border-t border-slate-700 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-yellow-400 text-blue-950 font-black text-xs">
                            {group.name}
                          </span>
                          <span className="font-bold text-white">
                            Tutor: {group.tutorName}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200 italic font-medium">
                          "{assignment.activityDescription || 'Convivencia activa'}"
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p className="text-[11px] text-emerald-300 mt-2 pt-2 border-t border-slate-700">
                      ✨ Clic para asignar un grupo a esta zona
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Map Legend (Bottom Left) */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-300 text-[11px] font-bold text-slate-700 shadow-md flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-700"></span>
                <span>Espacio Libre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-600"></span>
                <span>Ocupado por Grupo</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-slate-500 font-medium">
                <span>💡 Clic en cualquier punto para gestionar</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CARDS GRID VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAreas.map((area, idx) => {
            const assignment = getOccupyingAssignment(area.id);
            const group = assignment ? groups.find(g => g.id === assignment.groupId) : null;

            return (
              <div
                key={area.id}
                className="rounded-3xl bg-white transition-all duration-200 p-5 flex flex-col justify-between relative overflow-hidden shadow-xs border-2 border-slate-200 hover:border-blue-400"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 border bg-slate-100 text-slate-800 border-slate-200">
                      {getIconForCategory(area.category)}
                      <span>{area.category}</span>
                    </span>

                    {assignment ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Ocupada ({group?.name})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Disponible
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug mb-1">
                    {area.name}
                  </h3>

                  <p className="text-xs text-slate-500 mb-3 font-medium">
                    📍 {area.locationDescription}
                  </p>

                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-[11px] text-slate-600 mb-4 space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Equipamiento:</span>
                      <span className="font-extrabold text-slate-800">{area.equipment || 'Estándar'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Capacidad sugerida:</span>
                      <span className="font-bold text-slate-700">~{area.capacity} alumnos</span>
                    </div>
                  </div>

                  {group && assignment ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-blue-900">Grupo Activo</span>
                        <span className="text-[10px] text-blue-700 font-bold">{assignment.startTime} hrs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-yellow-400 text-blue-950 font-black text-xs flex items-center justify-center shadow-xs">
                          {group.name}
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-900">Grupo {group.name}</p>
                          <p className="text-[10px] text-slate-600 font-medium">Tutor: {group.tutorName}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 italic pt-1 border-t border-blue-200/60 font-medium">
                        "{assignment.activityDescription || 'Convivencia activa'}"
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-3 mb-4 text-center">
                      <p className="text-xs font-bold text-slate-400">Espacio Libre para Convivencia</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`assign-area-btn-${area.id}`}
                      onClick={() => handleOpenAssignModal(area)}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-yellow-300" />
                      <span>{assignment ? 'Cambiar Grupo' : 'Asignar Grupo'}</span>
                    </button>

                    {assignment && (
                      <button
                        id={`free-area-btn-${area.id}`}
                        onClick={() => onUnassignGroup(assignment.groupId)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold"
                        title="Liberar espacio"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    id={`ai-area-btn-${area.id}`}
                    onClick={() => onOpenActivityAI(group?.id, area.id)}
                    className="w-full py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Sugerir Dinámicas (AI)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TECHNICAL ADJUSTMENTS & ORGANIZATIONAL RECOMMENDATIONS PANEL */}
      <div className="bg-amber-50/80 rounded-3xl p-6 border-2 border-amber-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
              <Sun className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-amber-950">
                Ajustes y Recomendaciones Técnicas para el Plantel (Proyecto ¡PRESENTE!)
              </h3>
              <p className="text-xs text-amber-800 font-medium">
                Criterios sugeridos para optimizar el uso de los espacios marcados en el nuevo croquis
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTechnicalAdjustments(!showTechnicalAdjustments)}
            className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1 rounded-xl transition-colors"
          >
            {showTechnicalAdjustments ? 'Ocultar Criterios' : 'Ver Criterios'}
          </button>
        </div>

        {showTechnicalAdjustments && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-amber-200 text-xs">
            <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
              <span className="font-black text-amber-950 flex items-center gap-1">
                ☀️ 1. Zonificación Térmica y Sombra
              </span>
              <p className="text-slate-600 leading-relaxed">
                Los <strong>Ciber Jardines 1, 3 y 4</strong> junto con el <strong>Ágora</strong> cuentan con arbolado maduro que brinda sombra constante, ideales para ajedrez y diálogo en días calurosos.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
              <span className="font-black text-amber-950 flex items-center gap-1">
                👥 2. Capacidad Dinámica por Zona
              </span>
              <p className="text-slate-600 leading-relaxed">
                La <strong>Cancha Múltiple</strong> y la <strong>Plazoleta</strong> soportan hasta 45-50 alumnos simultáneos (retos deportivos), mientras que el <strong>Gimnasio al Aire Libre</strong> funciona mejor con turnos de 20-25 estudiantes.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
              <span className="font-black text-amber-950 flex items-center gap-1">
                ⚽ 3. Centro de Préstamo Lúdico
              </span>
              <p className="text-slate-600 leading-relaxed">
                Centralizar el préstamo de balones y tableros en <strong>Prefectura (Edificio C)</strong> y <strong>Biblioteca</strong>, agilizando el flujo hacia el andador norte y canchas sin cruzar salones.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
              <span className="font-black text-amber-950 flex items-center gap-1">
                💧 4. Hidratación y Seguridad
              </span>
              <p className="text-slate-600 leading-relaxed">
                Los accesos a bebederos se ubican próximos al <strong>Edificio B</strong> y <strong>Laboratorio de Alimentos</strong>; para primeros auxilios en deportes, el botiquín de respuesta rápida está en Dirección (Edificio D).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ASSIGNMENT MODAL */}
      {selectedAreaForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                  Ubicación en Croquis Oficial
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedAreaForAssign.name}
                </h3>
              </div>
              <button
                id="close-area-assign-modal"
                onClick={() => setSelectedAreaForAssign(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleccionar Grupo para Asignar ({shift === 'matutino' ? 'Matutino' : 'Vespertino'})
                </label>
                <select
                  id="modal-select-group"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {currentShiftGroups.map((group) => {
                    const isAssigned = !!assignments[group.id];
                    return (
                      <option key={group.id} value={group.id}>
                        Grupo {group.name} ({group.grade}º Semestre) {isAssigned ? '• (Reubicar)' : '• (Disponible)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dinámica / Actividad sin Pantalla
                </label>
                <input
                  id="modal-activity-input"
                  type="text"
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  placeholder="Ej: Torneo relámpago de voleibol, ajedrez, lectura colectiva..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                id="cancel-area-modal"
                onClick={() => setSelectedAreaForAssign(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                id="confirm-area-modal"
                onClick={handleConfirmAssignment}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black rounded-xl text-xs shadow-xs transition-colors"
              >
                Confirmar Asignación
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
