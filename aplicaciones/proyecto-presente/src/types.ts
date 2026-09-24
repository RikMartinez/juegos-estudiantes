export type UserRole = 'public' | 'tutor' | 'admin';

export interface PinConfig {
  tutorPin: string;
  adminPin: string;
}

export type Shift = 'matutino' | 'vespertino';

export type AreaCategory = 
  | 'Deporte y Salud' 
  | 'Juegos de Mesa y Estrategia' 
  | 'Arte y Cultura' 
  | 'Socialización y Charla' 
  | 'Descanso y Sombra' 
  | 'Música y Expresión';

export interface Group {
  id: string;
  name: string; // e.g. "1ºA", "3ºB", "6ºA"
  grade: number; // 1 to 6
  shift: Shift;
  tutorName?: string;
  studentCount?: number;
}

export interface ConvivenciaArea {
  id: string;
  name: string; // e.g., "Patio Central 'El Capulín'"
  category: AreaCategory;
  capacity: number; // Max recommended students
  shift: Shift;
  locationDescription: string;
  equipment?: string; // e.g., "Muebles de descanso, Sombrillas"
  color: string; // Hex or Tailwind color class
  iconName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  croquisPosition?: {
    x: number; // percentage from 0 to 100 on the croquis width
    y: number; // percentage from 0 to 100 on the croquis height
  };
}

export interface AreaAssignment {
  groupId: string;
  areaId: string;
  shift: Shift;
  timestamp: string; // ISO date string
  startTime: string; // HH:mm
  activityDescription?: string;
  responsibleTeacher?: string;
  status: 'active' | 'completed' | 'scheduled';
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  dateStr: string;
  shift: Shift;
  groupName: string;
  areaName: string;
  activityDescription: string;
  teacherName?: string;
  actionType: 'check-in' | 'checkout' | 'reassign';
}

export interface ActivitySuggestion {
  title: string;
  category: string;
  description: string;
  materialsNeeded: string;
  keyBenefit: string;
}
