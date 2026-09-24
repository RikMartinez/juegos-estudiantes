import React from 'react';
import { Shift, UserRole } from '../types';
import { EscudoUdeG } from './EscudoUdeG';
import { 
  Building2, 
  Sun, 
  Moon, 
  MapPin, 
  Grid, 
  FileText, 
  Sparkles, 
  Settings, 
  Printer, 
  PlusCircle, 
  Users, 
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  UserCheck,
  Eye
} from 'lucide-react';

interface HeaderProps {
  shift: Shift;
  onShiftChange: (shift: Shift) => void;
  activeTab: 'board' | 'map' | 'log' | 'ai';
  onTabChange: (tab: 'board' | 'map' | 'log' | 'ai') => void;
  totalGroupsCount: number;
  assignedGroupsCount: number;
  totalAreasCount: number;
  occupiedAreasCount: number;
  userRole: UserRole;
  onOpenAuthModal: (actionLabel?: string, requiredRole?: 'tutor' | 'admin') => void;
  onLogout: () => void;
  onOpenQuickAssign: () => void;
  onOpenSettings: () => void;
  onOpenPrintReport: () => void;
  onAutoAssignDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shift,
  onShiftChange,
  activeTab,
  onTabChange,
  totalGroupsCount,
  assignedGroupsCount,
  totalAreasCount,
  occupiedAreasCount,
  userRole,
  onOpenAuthModal,
  onLogout,
  onOpenQuickAssign,
  onOpenSettings,
  onOpenPrintReport,
  onAutoAssignDemo
}) => {
  const percentageAssigned = totalGroupsCount > 0 
    ? Math.round((assignedGroupsCount / totalGroupsCount) * 100) 
    : 0;

  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-30">
      {/* Top Bar - Institutional UdeG Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & School Title */}
          <div className="flex items-center gap-3">
            <div className="bg-white/95 p-1 rounded-xl shadow-md border border-amber-300 flex items-center justify-center shrink-0">
              <EscudoUdeG width={34} height={46} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-700/80 text-blue-100 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-blue-400/40">
                  SEMS - UdeG
                </span>
                <span className="text-xs text-blue-100 font-semibold opacity-90">
                  Preparatoria Regional de Chapala
                </span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Proyecto <span className="text-yellow-300">¡PRESENTE!</span>
              </h1>
            </div>
          </div>

          {/* Turno Switcher & Quick Stats */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Shift Selector Pill */}
            <div className="flex bg-blue-700/90 p-1 rounded-full border border-blue-500 shadow-inner items-center">
              <button
                id="shift-matutino-btn"
                onClick={() => onShiftChange('matutino')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-200 ${
                  shift === 'matutino'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Matutino (17)</span>
              </button>
              <button
                id="shift-vespertino-btn"
                onClick={() => onShiftChange('vespertino')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-200 ${
                  shift === 'vespertino'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Vespertino (16)</span>
              </button>
            </div>

            {/* Quick Stats Pill */}
            <div className="hidden sm:flex items-center gap-3 bg-blue-700/60 px-3.5 py-1.5 rounded-full border border-blue-500/60 text-xs">
              <div className="flex items-center gap-1.5 text-green-300 font-extrabold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{assignedGroupsCount}/{totalGroupsCount} Grupos en Área</span>
              </div>
              <div className="h-3 w-px bg-blue-400/50"></div>
              <div className="text-blue-100 font-medium">
                <span className="font-black text-white">{occupiedAreasCount}/{totalAreasCount}</span> Áreas Activas
              </div>
            </div>

            {/* Role Access Indicator & Auth Button */}
            <div className="flex items-center gap-2 bg-blue-700/90 p-1 pl-3 rounded-full border border-blue-400/60 text-xs">
              {userRole === 'public' && (
                <div className="flex items-center gap-1.5 text-blue-100 font-bold">
                  <Eye className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="hidden sm:inline">Modo Consulta</span>
                </div>
              )}
              {userRole === 'tutor' && (
                <div className="flex items-center gap-1.5 text-white font-black">
                  <UserCheck className="w-3.5 h-3.5 text-green-300" />
                  <span className="hidden sm:inline">Profesor/Tutor</span>
                </div>
              )}
              {userRole === 'admin' && (
                <div className="flex items-center gap-1.5 text-yellow-300 font-black">
                  <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="hidden sm:inline">Administrador</span>
                </div>
              )}

              {userRole === 'public' ? (
                <button
                  id="login-pin-btn"
                  onClick={() => onOpenAuthModal('acceder a las herramientas de gestión')}
                  className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Ingresar PIN</span>
                </button>
              ) : (
                <button
                  id="logout-pin-btn"
                  onClick={onLogout}
                  className="bg-blue-800 hover:bg-blue-900 text-blue-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Bloquear y volver a Modo Consulta Pública"
                >
                  <Lock className="w-3 h-3 text-yellow-300" />
                  <span>Salir</span>
                </button>
              )}
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="quick-assign-btn"
                onClick={onOpenQuickAssign}
                className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-blue-900" />
                <span className="hidden md:inline">Registrar Ubicación</span>
              </button>

              <button
                id="print-report-btn"
                onClick={onOpenPrintReport}
                className="bg-blue-700 hover:bg-blue-800 text-white border border-blue-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Generar Evidencia Imprimible UdeG"
              >
                <Printer className="w-4 h-4 text-yellow-300" />
                <span className="hidden lg:inline">Imprimir Evidencia</span>
              </button>

              <button
                id="settings-btn"
                onClick={onOpenSettings}
                className="bg-blue-700 hover:bg-blue-800 text-blue-100 hover:text-white p-2 rounded-xl border border-blue-500 transition-colors"
                title="Configuración de Grupos y Áreas"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-blue-700 border-t border-blue-500/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 scrollbar-none">
            
            <button
              id="tab-board-btn"
              onClick={() => onTabChange('board')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                activeTab === 'board'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-600/80'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Tablero de Grupos ({shift === 'matutino' ? '17' : '16'})</span>
            </button>

            <button
              id="tab-map-btn"
              onClick={() => onTabChange('map')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-600/80'
              }`}
            >
              <MapPin className="w-4 h-4 text-yellow-300" />
              <span>Croquis Oficial del Plantel</span>
            </button>

            <button
              id="tab-log-btn"
              onClick={() => onTabChange('log')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                activeTab === 'log'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-600/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Bitácora y Evidencia UdeG</span>
            </button>

            <button
              id="tab-ai-btn"
              onClick={() => onTabChange('ai')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'bg-yellow-400 text-blue-950 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-600/80'
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Dinámicas sin Pantalla (AI)</span>
            </button>

            {onAutoAssignDemo && (
              <button
                id="auto-demo-btn"
                onClick={onAutoAssignDemo}
                className="ml-auto text-xs text-yellow-300 hover:text-white font-black px-2 py-1 transition-colors flex items-center gap-1"
                title="Poblar áreas con datos de prueba rápida para simulación"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simular Asignación Completa</span>
              </button>
            )}

          </nav>
        </div>
      </div>
    </header>
  );
};
