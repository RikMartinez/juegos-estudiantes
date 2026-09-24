import React, { useState, useEffect } from 'react';
import { Shift, Group, ConvivenciaArea, AreaCategory, AreaAssignment, ActivityLogItem, UserRole } from './types';
import { 
  INITIAL_MATUTINO_GROUPS, 
  INITIAL_VESPERTINO_GROUPS, 
  INITIAL_MATUTINO_AREAS, 
  INITIAL_VESPERTINO_AREAS,
  detectCroquisPosition
} from './data/initialData';
import { Header } from './components/Header';
import { LiveAssignmentBoard } from './components/LiveAssignmentBoard';
import { VisualCampusMap } from './components/VisualCampusMap';
import { ActivityLogView } from './components/ActivityLogView';
import { GeminiActivityAssistant } from './components/GeminiActivityAssistant';
import { SettingsModal } from './components/SettingsModal';
import { PrintableReportModal } from './components/PrintableReportModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [shift, setShift] = useState<Shift>('matutino');
  const [activeTab, setActiveTab] = useState<'board' | 'map' | 'log' | 'ai'>('board');

  // Role & Authentication State
  const [userRole, setUserRole] = useState<UserRole>('public');
  
  const [tutorPin, setTutorPin] = useState<string>(() => {
    return localStorage.getItem('presente_tutor_pin_v1') || '2026';
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('presente_admin_pin_v1') || '9988';
  });

  // Auth Modal Pending Action State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionLabel, setAuthActionLabel] = useState<string>('');
  const [authRequiredRole, setAuthRequiredRole] = useState<'tutor' | 'admin'>('tutor');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Groups and Areas
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('presente_groups_v1');
    return saved ? JSON.parse(saved) : [...INITIAL_MATUTINO_GROUPS, ...INITIAL_VESPERTINO_GROUPS];
  });

  const [areas, setAreas] = useState<ConvivenciaArea[]>(() => {
    const savedV2 = localStorage.getItem('presente_areas_v2');
    if (savedV2) {
      try {
        const parsed: ConvivenciaArea[] = JSON.parse(savedV2);
        return parsed.map((a: ConvivenciaArea) => {
          const autoPos = detectCroquisPosition(a.name, a.locationDescription);
          return {
            ...a,
            croquisPosition: autoPos
          };
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Migrate from v1 or load fresh defaults with 14 official planteles zones
    const savedV1 = localStorage.getItem('presente_areas_v1');
    if (savedV1) {
      try {
        const rawAreas: ConvivenciaArea[] = JSON.parse(savedV1);
        const updated = rawAreas.map((a: ConvivenciaArea) => {
          const autoPos = detectCroquisPosition(a.name, a.locationDescription);
          return {
            ...a,
            name: a.name ? a.name.replace(/\s*&\s*/g, ' y ') : a.name,
            category: (a.category ? (a.category as string).replace(/\s*&\s*/g, ' y ') : 'Socialización y Charla') as AreaCategory,
            croquisPosition: autoPos
          };
        });
        localStorage.setItem('presente_areas_v2', JSON.stringify(updated));
        return updated;
      } catch (e) {
        console.error(e);
      }
    }

    const defaultAreas = [...INITIAL_MATUTINO_AREAS, ...INITIAL_VESPERTINO_AREAS];
    localStorage.setItem('presente_areas_v2', JSON.stringify(defaultAreas));
    return defaultAreas;
  });

  const handleUpdateAreaPosition = (areaId: string, newPos: { x: number; y: number }) => {
    setAreas(prev => {
      const updated = prev.map(a => a.id === areaId ? { ...a, croquisPosition: newPos } : a);
      localStorage.setItem('presente_areas_v2', JSON.stringify(updated));
      return updated;
    });
  };

  // Current Assignments { groupId: AreaAssignment }
  const [assignments, setAssignments] = useState<Record<string, AreaAssignment>>(() => {
    const saved = localStorage.getItem('presente_assignments_v1');
    if (saved) return JSON.parse(saved);

    // Initial demo setup so the app opens with sample assignments populated
    const initialDemo: Record<string, AreaAssignment> = {};
    
    // Assign first 12 Matutino groups to first 12 areas
    INITIAL_MATUTINO_GROUPS.slice(0, 12).forEach((g, idx) => {
      const area = INITIAL_MATUTINO_AREAS[idx];
      if (area) {
        initialDemo[g.id] = {
          groupId: g.id,
          areaId: area.id,
          shift: 'matutino',
          timestamp: new Date().toISOString(),
          startTime: '09:40',
          activityDescription: 'Juegos de mesa, ajedrez y diálogo libre',
          status: 'active'
        };
      }
    });

    // Assign first 10 Vespertino groups to first 10 vespertino areas
    INITIAL_VESPERTINO_GROUPS.slice(0, 10).forEach((g, idx) => {
      const area = INITIAL_VESPERTINO_AREAS[idx];
      if (area) {
        initialDemo[g.id] = {
          groupId: g.id,
          areaId: area.id,
          shift: 'vespertino',
          timestamp: new Date().toISOString(),
          startTime: '16:20',
          activityDescription: 'Torneo relámpago de básquetbol y voleibol',
          status: 'active'
        };
      }
    });

    return initialDemo;
  });

  // Logs
  const [logs, setLogs] = useState<ActivityLogItem[]>(() => {
    const saved = localStorage.getItem('presente_logs_v1');
    if (saved) return JSON.parse(saved);

    const todayStr = new Date().toLocaleDateString('es-MX');
    return [
      {
        id: 'log-1',
        timestamp: '09:40',
        dateStr: todayStr,
        shift: 'matutino',
        groupName: '1ºA',
        areaName: 'Patio Central "El Capulín"',
        activityDescription: 'Círculo de diálogo y rompehielos de integración',
        actionType: 'check-in'
      },
      {
        id: 'log-2',
        timestamp: '09:45',
        dateStr: todayStr,
        shift: 'matutino',
        groupName: '3ºB',
        areaName: 'Pérgola de Lectura y Juegos de Mesa',
        activityDescription: 'Torneo de Ajedrez Rápido y Jenga',
        actionType: 'check-in'
      }
    ];
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  
  // Selected IDs for AI transition
  const [aiSelectedGroupId, setAiSelectedGroupId] = useState<string | undefined>();
  const [aiSelectedAreaId, setAiSelectedAreaId] = useState<string | undefined>();

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('presente_groups_v1', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('presente_areas_v2', JSON.stringify(areas));
  }, [areas]);

  useEffect(() => {
    localStorage.setItem('presente_assignments_v1', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('presente_logs_v1', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('presente_tutor_pin_v1', tutorPin);
  }, [tutorPin]);

  useEffect(() => {
    localStorage.setItem('presente_admin_pin_v1', adminPin);
  }, [adminPin]);

  /**
   * Helper method to request authentication if user is not logged in
   * or doesn't have sufficient privileges.
   */
  const requestAuth = (actionLabel: string, requiredRole: 'tutor' | 'admin', action: () => void) => {
    // Admin has access to all actions
    if (userRole === 'admin') {
      action();
      return;
    }

    // Tutor has access to tutor-level actions
    if (userRole === 'tutor' && requiredRole === 'tutor') {
      action();
      return;
    }

    // Otherwise prompt for PIN
    setAuthActionLabel(actionLabel);
    setAuthRequiredRole(requiredRole);
    setPendingAction(() => action);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (role: 'tutor' | 'admin') => {
    setUserRole(role);
    setIsAuthModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleLogout = () => {
    setUserRole('public');
  };

  const handleUpdatePins = (newTutorPin: string, newAdminPin: string) => {
    setTutorPin(newTutorPin);
    setAdminPin(newAdminPin);
  };

  // Handlers for assignments
  const handleAssignGroup = (groupId: string, areaId: string, activityDescription?: string) => {
    requestAuth('registrar la ubicación del grupo', 'tutor', () => {
      const group = groups.find(g => g.id === groupId);
      const area = areas.find(a => a.id === areaId);
      if (!group || !area) return;

      const timeNow = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateStr = new Date().toLocaleDateString('es-MX');

      const isExisting = !!assignments[groupId];

      const newAssignment: AreaAssignment = {
        groupId,
        areaId,
        shift: group.shift,
        timestamp: new Date().toISOString(),
        startTime: timeNow,
        activityDescription: activityDescription || 'Convivencia libre y juegos de mesa',
        status: 'active'
      };

      setAssignments(prev => ({
        ...prev,
        [groupId]: newAssignment
      }));

      // Add to activity log
      const newLogItem: ActivityLogItem = {
        id: `log-${Date.now()}`,
        timestamp: timeNow,
        dateStr,
        shift: group.shift,
        groupName: group.name,
        areaName: area.name,
        activityDescription: activityDescription || 'Convivencia libre y actividad sin pantallas',
        actionType: isExisting ? 'reassign' : 'check-in'
      };

      setLogs(prev => [newLogItem, ...prev]);
    });
  };

  const handleUnassignGroup = (groupId: string) => {
    requestAuth('liberar el área ocupada', 'tutor', () => {
      const group = groups.find(g => g.id === groupId);
      const existing = assignments[groupId];
      const area = existing ? areas.find(a => a.id === existing.areaId) : null;

      if (!group) return;

      setAssignments(prev => {
        const copy = { ...prev };
        delete copy[groupId];
        return copy;
      });

      if (area) {
        const timeNow = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = new Date().toLocaleDateString('es-MX');

        const logItem: ActivityLogItem = {
          id: `log-${Date.now()}`,
          timestamp: timeNow,
          dateStr,
          shift: group.shift,
          groupName: group.name,
          areaName: area.name,
          activityDescription: 'Liberación de espacio para retorno a aula',
          actionType: 'checkout'
        };

        setLogs(prev => [logItem, ...prev]);
      }
    });
  };

  const handleAutoAssignAll = () => {
    requestAuth('realizar la asignación automática masiva', 'admin', () => {
      const shiftGroups = groups.filter(g => g.shift === shift);
      const shiftAreas = areas.filter(a => a.shift === shift);
      const timeNow = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateStr = new Date().toLocaleDateString('es-MX');

      const updatedAssignments = { ...assignments };
      const newLogs: ActivityLogItem[] = [];

      shiftGroups.forEach((group, idx) => {
        const area = shiftAreas[idx % shiftAreas.length];
        if (area) {
          updatedAssignments[group.id] = {
            groupId: group.id,
            areaId: area.id,
            shift: shift,
            timestamp: new Date().toISOString(),
            startTime: timeNow,
            activityDescription: `Actividades de convivencia Proyecto PRESENTE en ${area.name}`,
            status: 'active'
          };

          newLogs.push({
            id: `log-${Date.now()}-${idx}`,
            timestamp: timeNow,
            dateStr,
            shift: shift,
            groupName: group.name,
            areaName: area.name,
            activityDescription: `Asignación automática del grupo al área`,
            actionType: 'check-in'
          });
        }
      });

      setAssignments(updatedAssignments);
      setLogs(prev => [...newLogs, ...prev]);
    });
  };

  const handleClearAllAssignments = () => {
    requestAuth('liberar todas las áreas asignadas', 'admin', () => {
      const shiftGroups = groups.filter(g => g.shift === shift);
      const shiftGroupIds = new Set(shiftGroups.map(g => g.id));

      setAssignments(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(gid => {
          if (shiftGroupIds.has(gid)) {
            delete copy[gid];
          }
        });
        return copy;
      });
    });
  };

  const handleResetDefaults = () => {
    requestAuth('restablecer los catálogos por defecto', 'admin', () => {
      setGroups([...INITIAL_MATUTINO_GROUPS, ...INITIAL_VESPERTINO_GROUPS]);
      setAreas([...INITIAL_MATUTINO_AREAS, ...INITIAL_VESPERTINO_AREAS]);
      setAssignments({});
      setLogs([]);
      setTutorPin('2026');
      setAdminPin('9988');
      setIsSettingsOpen(false);
    });
  };

  const handleClearLogs = () => {
    requestAuth('vaciar el historial de la bitácora', 'admin', () => {
      setLogs([]);
    });
  };

  const handleOpenActivityAI = (groupId?: string, areaId?: string) => {
    setAiSelectedGroupId(groupId);
    setAiSelectedAreaId(areaId);
    setActiveTab('ai');
  };

  const handleApplyAIActivity = (groupId: string, areaId: string, activityTitle: string) => {
    handleAssignGroup(groupId, areaId, activityTitle);
  };

  const handleOpenSettings = () => {
    requestAuth('acceder a la Configuración del Plantel', 'admin', () => {
      setIsSettingsOpen(true);
    });
  };

  const shiftGroupsCount = groups.filter(g => g.shift === shift).length;
  const shiftAssignedCount = groups.filter(g => g.shift === shift && !!assignments[g.id]).length;
  const shiftAreasCount = areas.filter(a => a.shift === shift).length;
  const shiftOccupiedAreasCount = areas.filter(a => a.shift === shift && Object.values(assignments).some(aItem => (aItem as AreaAssignment).areaId === a.id)).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col antialiased">
      
      {/* Header */}
      <Header
        shift={shift}
        onShiftChange={setShift}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalGroupsCount={shiftGroupsCount}
        assignedGroupsCount={shiftAssignedCount}
        totalAreasCount={shiftAreasCount}
        occupiedAreasCount={shiftOccupiedAreasCount}
        userRole={userRole}
        onOpenAuthModal={() => requestAuth('iniciar sesión con tu PIN', 'tutor', () => {})}
        onLogout={handleLogout}
        onOpenQuickAssign={() => setActiveTab('board')}
        onOpenSettings={handleOpenSettings}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
        onAutoAssignDemo={handleAutoAssignAll}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'board' && (
          <LiveAssignmentBoard
            shift={shift}
            groups={groups}
            areas={areas}
            assignments={assignments}
            onAssignGroup={handleAssignGroup}
            onUnassignGroup={handleUnassignGroup}
            onOpenActivityAI={handleOpenActivityAI}
            onAutoAssignAll={handleAutoAssignAll}
            onClearAllAssignments={handleClearAllAssignments}
          />
        )}

        {activeTab === 'map' && (
          <VisualCampusMap
            shift={shift}
            areas={areas}
            groups={groups}
            assignments={assignments}
            onAssignGroup={handleAssignGroup}
            onUnassignGroup={handleUnassignGroup}
            onOpenActivityAI={handleOpenActivityAI}
            onUpdateAreaPosition={handleUpdateAreaPosition}
          />
        )}

        {activeTab === 'log' && (
          <ActivityLogView
            shift={shift}
            logs={logs}
            onClearLogs={handleClearLogs}
            onOpenPrintReport={() => setIsPrintReportOpen(true)}
          />
        )}

        {activeTab === 'ai' && (
          <GeminiActivityAssistant
            shift={shift}
            groups={groups}
            areas={areas}
            preSelectedGroupId={aiSelectedGroupId}
            preSelectedAreaId={aiSelectedAreaId}
            onApplyActivityToGroup={handleApplyAIActivity}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 text-xs text-center shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>© SEMS UdeG</span>
            <span>•</span>
            <span>Proyecto ¡PRESENTE! Chapala</span>
          </div>
          <p className="font-semibold text-slate-600">
            Preparatoria Regional de Chapala — Sistema de Educación Media Superior
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          tutorPin={tutorPin}
          adminPin={adminPin}
          targetActionLabel={authActionLabel}
          requiredRole={authRequiredRole}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          shift={shift}
          groups={groups}
          areas={areas}
          onUpdateGroups={setGroups}
          onUpdateAreas={setAreas}
          onResetDefaults={handleResetDefaults}
          onClose={() => setIsSettingsOpen(false)}
          tutorPin={tutorPin}
          adminPin={adminPin}
          onUpdatePins={handleUpdatePins}
        />
      )}

      {/* Printable Report Modal */}
      {isPrintReportOpen && (
        <PrintableReportModal
          shift={shift}
          groups={groups}
          areas={areas}
          assignments={assignments}
          onClose={() => setIsPrintReportOpen(false)}
        />
      )}

    </div>
  );
}
