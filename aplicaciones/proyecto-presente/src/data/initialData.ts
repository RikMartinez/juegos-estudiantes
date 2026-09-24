import { Group, ConvivenciaArea, Shift, AreaCategory } from '../types';

export interface CampusLandmarkPreset {
  id: string;
  name: string;
  category: AreaCategory;
  coordinates: { x: number; y: number };
  description: string;
}

export const CAMPUS_LANDMARK_PRESETS: CampusLandmarkPreset[] = [
  { id: 'cancha-multiple', name: 'Cancha de usos múltiples (Cancha Múltiple)', category: 'Deporte y Salud', coordinates: { x: 74.5, y: 19.5 }, description: 'Canchas deportivas de Básquetbol y Voleibol al nororiente' },
  { id: 'cancha-futbol', name: 'Cancha de Futbol', category: 'Deporte y Salud', coordinates: { x: 74.5, y: 6.5 }, description: 'Área deportiva norte de fútbol' },
  { id: 'ciber-jardin-1', name: 'Ciber Jardín 1', category: 'Descanso y Sombra', coordinates: { x: 34.0, y: 43.0 }, description: 'Zona verde poniente entre Edificio C y Biblioteca' },
  { id: 'ciber-jardin-2', name: 'Ciber Jardín 2', category: 'Descanso y Sombra', coordinates: { x: 89.2, y: 19.5 }, description: 'Área verde nororiente, a la derecha de la Cancha Múltiple' },
  { id: 'ciber-jardin-3', name: 'Ciber Jardín 3', category: 'Descanso y Sombra', coordinates: { x: 47.0, y: 21.0 }, description: 'Jardín arbolado junto al andador diagonal norte' },
  { id: 'ciber-jardin-4', name: 'Ciber Jardín 4', category: 'Descanso y Sombra', coordinates: { x: 61.5, y: 49.0 }, description: 'Jardín central entre Edificios C, A y B' },
  { id: 'biblioteca', name: 'Biblioteca', category: 'Arte y Cultura', coordinates: { x: 19.7, y: 62.8 }, description: 'Edificio de Biblioteca y Sala de Lectura' },
  { id: 'agora', name: 'Ágora', category: 'Música y Expresión', coordinates: { x: 13.5, y: 62.8 }, description: 'Foro al aire libre, extensión al poniente de la Biblioteca' },
  { id: 'auditorio', name: 'Auditorio', category: 'Arte y Cultura', coordinates: { x: 42.9, y: 32.5 }, description: 'Planta baja del Edificio C (debajo de las aulas 10 y 11)' },
  { id: 'sala-proyecciones', name: 'Sala de Proyecciones', category: 'Arte y Cultura', coordinates: { x: 22.0, y: 54.6 }, description: 'Espacio audiovisual exterior / norte de Biblioteca' },
  { id: 'aula-yoga', name: 'Aula de Yoga', category: 'Deporte y Salud', coordinates: { x: 61.2, y: 19.5 }, description: 'Espacio rítmico cubierto junto al Gimnasio Techado' },
  { id: 'aula-danza', name: 'Aula de Danza', category: 'Deporte y Salud', coordinates: { x: 64.7, y: 19.5 }, description: 'Salón de danza y expresión corporal' },
  { id: 'gimnasio-techado', name: 'Gimnasio Techado', category: 'Deporte y Salud', coordinates: { x: 56.0, y: 19.5 }, description: 'Instalaciones deportivas cubiertas norte' },
  { id: 'gimnasio-aire-libre', name: 'Gimnasio al aire libre', category: 'Deporte y Salud', coordinates: { x: 28.5, y: 22.0 }, description: 'Aparatos de calistenia al noroeste (junto al andador)' },
  { id: 'patio-capulin', name: 'Patio Central "El Capulín"', category: 'Socialización y Charla', coordinates: { x: 64.5, y: 61.0 }, description: 'Explanada cívica central frente a Edificios B y D' },
  { id: 'plazoleta', name: 'Plazoleta Central de Convivencia', category: 'Socialización y Charla', coordinates: { x: 67.0, y: 44.7 }, description: 'Plazoleta adoquinada entre Ciber Jardín 4 y Canchas' },
  { id: 'terraza-cafeteria', name: 'Terraza y Cafetería (Lab. Alimentos)', category: 'Socialización y Charla', coordinates: { x: 84.5, y: 39.5 }, description: 'Área de alimentos y mesas con sombrilla' }
];

export function detectCroquisPosition(name: string, locationDesc?: string): { x: number; y: number } {
  const text = `${name || ''} ${locationDesc || ''}`.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Auditorio: en la parte baja del Edificio C (debajo de aulas 10 y 11)
  if (text.includes('auditorio')) return { x: 42.9, y: 32.5 };

  // 2. Sala de Proyecciones
  if (text.includes('proyeccion') || text.includes('audiovisual')) return { x: 22.0, y: 54.6 };

  // 3. Gimnasio al aire libre (ubicado cerca del andador, a distancia similar a Gimnasio Techado)
  if (text.includes('calistenia') || (text.includes('gimnasio') && text.includes('aire libre')) || text.includes('gimnacio al aire libre')) {
    return { x: 28.5, y: 22.0 };
  }

  // 4. Gimnasio Techado
  if (text.includes('techado') || (text.includes('gimnasio') && !text.includes('aire libre') && !text.includes('calistenia'))) {
    return { x: 56.0, y: 19.5 };
  }

  // 5. Aula de Yoga & Aula de Danza
  if (text.includes('yoga')) return { x: 61.2, y: 19.5 };
  if (text.includes('danza')) return { x: 64.7, y: 19.5 };

  // 6. Canchas deportivas
  if (text.includes('futbol') || text.includes('soccer')) return { x: 74.5, y: 6.5 };
  if (text.includes('cancha') || text.includes('multiple') || text.includes('usos multiples') || text.includes('basquet') || text.includes('volei')) {
    return { x: 74.5, y: 19.5 };
  }

  // 7. Ciber Jardines (1 a 4)
  if (text.includes('jardin 2') || text.includes('ciber jardin 2') || text.includes('jardin dos')) return { x: 89.2, y: 19.5 };
  if (text.includes('jardin 1') || text.includes('ciber jardin 1') || text.includes('jardin uno')) return { x: 34.0, y: 43.0 };
  if (text.includes('jardin 3') || text.includes('ciber jardin 3') || text.includes('jardin tres')) return { x: 47.0, y: 21.0 };
  if (text.includes('jardin 4') || text.includes('ciber jardin 4') || text.includes('jardin cuatro') || text.includes('jardin central')) return { x: 61.5, y: 49.0 };

  // 8. Biblioteca & Ágora (Ágora a la altura de Biblioteca como su extensión)
  if (text.includes('agora') || text.includes('foro')) return { x: 13.5, y: 62.8 };
  if (text.includes('biblioteca') || text.includes('lectura') || text.includes('pergola') || text.includes('ajedrez')) return { x: 19.7, y: 62.8 };

  // 9. Otros puntos reconocidos
  if (text.includes('capulin') || text.includes('patio central')) return { x: 64.5, y: 61.0 };
  if (text.includes('plazoleta')) return { x: 67.0, y: 43.0 };
  if (text.includes('cafeteria') || text.includes('alimento') || text.includes('terraza')) return { x: 84.5, y: 39.5 };
  if (text.includes('corredor cultural')) return { x: 43.5, y: 50.0 };
  if (text.includes('edificio a')) return { x: 67.0, y: 61.5 };
  if (text.includes('edificio b')) return { x: 53.5, y: 61.5 };
  if (text.includes('edificio c')) return { x: 43.5, y: 38.0 };
  if (text.includes('edificio d')) return { x: 37.0, y: 61.0 };
  
  return { x: 64.5, y: 61.0 };
}

export const INITIAL_MATUTINO_GROUPS: Group[] = [
  { id: 'm-1a', name: '1ºA', grade: 1, shift: 'matutino', tutorName: 'Prof. Martha González', studentCount: 38 },
  { id: 'm-1b', name: '1ºB', grade: 1, shift: 'matutino', tutorName: 'Prof. Carlos Hernández', studentCount: 40 },
  { id: 'm-1c', name: '1ºC', grade: 1, shift: 'matutino', tutorName: 'Dra. Andrea Ramos', studentCount: 37 },
  { id: 'm-2a', name: '2ºA', grade: 2, shift: 'matutino', tutorName: 'Lic. Javier Solís', studentCount: 39 },
  { id: 'm-2b', name: '2ºB', grade: 2, shift: 'matutino', tutorName: 'Mtra. Sofía López', studentCount: 36 },
  { id: 'm-2c', name: '2ºC', grade: 2, shift: 'matutino', tutorName: 'Prof. Roberto Castro', studentCount: 41 },
  { id: 'm-3a', name: '3ºA', grade: 3, shift: 'matutino', tutorName: 'Lic. Carmen Pineda', studentCount: 38 },
  { id: 'm-3b', name: '3ºB', grade: 3, shift: 'matutino', tutorName: 'Prof. Fernando Díaz', studentCount: 39 },
  { id: 'm-3c', name: '3ºC', grade: 3, shift: 'matutino', tutorName: 'Mtra. Leticia Vargas', studentCount: 37 },
  { id: 'm-4a', name: '4ºA', grade: 4, shift: 'matutino', tutorName: 'Dr. Alejandro Morales', studentCount: 40 },
  { id: 'm-4b', name: '4ºB', grade: 4, shift: 'matutino', tutorName: 'Prof. Gabriel Torres', studentCount: 38 },
  { id: 'm-4c', name: '4ºC', grade: 4, shift: 'matutino', tutorName: 'Lic. Patricia Aguilar', studentCount: 39 },
  { id: 'm-5a', name: '5ºA', grade: 5, shift: 'matutino', tutorName: 'Mtro. Héctor Navarro', studentCount: 36 },
  { id: 'm-5b', name: '5ºB', grade: 5, shift: 'matutino', tutorName: 'Prof. Silvia Mendoza', studentCount: 37 },
  { id: 'm-5c', name: '5ºC', grade: 5, shift: 'matutino', tutorName: 'Lic. Ricardo Martínez', studentCount: 38 },
  { id: 'm-6a', name: '6ºA', grade: 6, shift: 'matutino', tutorName: 'Dra. Elena Benítez', studentCount: 42 },
  { id: 'm-6b', name: '6ºB', grade: 6, shift: 'matutino', tutorName: 'Mtro. Oscar Padilla', studentCount: 40 },
];

export const INITIAL_VESPERTINO_GROUPS: Group[] = [
  { id: 'v-1a', name: '1ºA', grade: 1, shift: 'vespertino', tutorName: 'Prof. Hugo Ramírez', studentCount: 35 },
  { id: 'v-1b', name: '1ºB', grade: 1, shift: 'vespertino', tutorName: 'Mtra. Natalia Flores', studentCount: 36 },
  { id: 'v-1c', name: '1ºC', grade: 1, shift: 'vespertino', tutorName: 'Prof. Tomás Ruiz', studentCount: 34 },
  { id: 'v-2a', name: '2ºA', grade: 2, shift: 'vespertino', tutorName: 'Lic. Beatriz Reyes', studentCount: 37 },
  { id: 'v-2b', name: '2ºB', grade: 2, shift: 'vespertino', tutorName: 'Prof. Daniel Gutiérrez', studentCount: 38 },
  { id: 'v-2c', name: '2ºC', grade: 2, shift: 'vespertino', tutorName: 'Mtra. Verónica Silva', studentCount: 35 },
  { id: 'v-3a', name: '3ºA', grade: 3, shift: 'vespertino', tutorName: 'Prof. Jorge Campos', studentCount: 36 },
  { id: 'v-3b', name: '3ºB', grade: 3, shift: 'vespertino', tutorName: 'Lic. Mónica Santos', studentCount: 37 },
  { id: 'v-3c', name: '3ºC', grade: 3, shift: 'vespertino', tutorName: 'Prof. Armando Peña', studentCount: 34 },
  { id: 'v-4a', name: '4ºA', grade: 4, shift: 'vespertino', tutorName: 'Mtra. Gloria Delgado', studentCount: 38 },
  { id: 'v-4b', name: '4ºB', grade: 4, shift: 'vespertino', tutorName: 'Prof. Manuel Estrada', studentCount: 36 },
  { id: 'v-4c', name: '4ºC', grade: 4, shift: 'vespertino', tutorName: 'Lic. Claudia Marín', studentCount: 35 },
  { id: 'v-5a', name: '5ºA', grade: 5, shift: 'vespertino', tutorName: 'Prof. Rafael Ibarra', studentCount: 37 },
  { id: 'v-5b', name: '5ºB', grade: 5, shift: 'vespertino', tutorName: 'Mtra. Isabel Romero', studentCount: 36 },
  { id: 'v-6a', name: '6ºA', grade: 6, shift: 'vespertino', tutorName: 'Dr. Gonzalo Valenzuela', studentCount: 39 },
  { id: 'v-6b', name: '6ºB', grade: 6, shift: 'vespertino', tutorName: 'Lic. Teresa Cabrera', studentCount: 38 },
];

export const INITIAL_MATUTINO_AREAS: ConvivenciaArea[] = [
  {
    id: 'area-m-cancha-multiple',
    name: 'Cancha de usos múltiples (Cancha Múltiple)',
    category: 'Deporte y Salud',
    capacity: 45,
    shift: 'matutino',
    locationDescription: 'Canchas deportivas de Básquetbol y Voleibol al nororiente',
    equipment: 'Tableros de básquetbol, red de voleibol y balones',
    color: 'amber',
    iconName: 'Dumbbell',
    croquisPosition: { x: 77.0, y: 19.5 }
  },
  {
    id: 'area-m-futbol',
    name: 'Cancha de Futbol',
    category: 'Deporte y Salud',
    capacity: 45,
    shift: 'matutino',
    locationDescription: 'Zona deportiva norte del plantel',
    equipment: 'Porterías, área despejada y balones',
    color: 'emerald',
    iconName: 'Activity',
    croquisPosition: { x: 77.0, y: 6.5 }
  },
  {
    id: 'area-m-ciber-1',
    name: 'Ciber Jardín 1',
    category: 'Descanso y Sombra',
    capacity: 35,
    shift: 'matutino',
    locationDescription: 'Zona verde poniente entre Edificio C y Biblioteca',
    equipment: 'Bancas exteriores y sombra natural',
    color: 'green',
    iconName: 'Sun',
    croquisPosition: { x: 34.0, y: 43.0 }
  },
  {
    id: 'area-m-ciber-2',
    name: 'Ciber Jardín 2',
    category: 'Descanso y Sombra',
    capacity: 35,
    shift: 'matutino',
    locationDescription: 'Área verde nororiente, a la derecha de la Cancha Múltiple',
    equipment: 'Árboles maduros, sombra y bancas',
    color: 'emerald',
    iconName: 'Leaf',
    croquisPosition: { x: 91.0, y: 19.0 }
  },
  {
    id: 'area-m-ciber-3',
    name: 'Ciber Jardín 3',
    category: 'Descanso y Sombra',
    capacity: 30,
    shift: 'matutino',
    locationDescription: 'Jardín arbolado junto al andador diagonal norte',
    equipment: 'Bancas circulares e iluminación',
    color: 'cyan',
    iconName: 'Compass',
    croquisPosition: { x: 47.2, y: 19.5 }
  },
  {
    id: 'area-m-ciber-4',
    name: 'Ciber Jardín 4',
    category: 'Descanso y Sombra',
    capacity: 35,
    shift: 'matutino',
    locationDescription: 'Jardín central entre Edificios C, A y B',
    equipment: 'Área verde, bancas y sombra de árboles',
    color: 'teal',
    iconName: 'Flower2',
    croquisPosition: { x: 61.5, y: 49.0 }
  },
  {
    id: 'area-m-biblioteca',
    name: 'Biblioteca',
    category: 'Arte y Cultura',
    capacity: 40,
    shift: 'matutino',
    locationDescription: 'Costado exterior de Biblioteca y Sala de Lectura',
    equipment: 'Pérgolas, mesas de lectura y tableros de ajedrez',
    color: 'indigo',
    iconName: 'BookOpen',
    croquisPosition: { x: 19.7, y: 62.8 }
  },
  {
    id: 'area-m-agora',
    name: 'Ágora',
    category: 'Música y Expresión',
    capacity: 45,
    shift: 'matutino',
    locationDescription: 'Foro al aire libre, extensión a la altura de la Biblioteca',
    equipment: 'Gradas escalonadas semicirculares',
    color: 'sky',
    iconName: 'Music',
    croquisPosition: { x: 13.5, y: 62.8 }
  },
  {
    id: 'area-m-auditorio',
    name: 'Auditorio',
    category: 'Arte y Cultura',
    capacity: 50,
    shift: 'matutino',
    locationDescription: 'Parte baja del Edificio C (debajo de las aulas 10 y 11)',
    equipment: 'Sillas auditorio, proyector y equipo de audio',
    color: 'blue',
    iconName: 'Users',
    croquisPosition: { x: 42.9, y: 32.5 }
  },
  {
    id: 'area-m-proyecciones',
    name: 'Sala de Proyecciones',
    category: 'Arte y Cultura',
    capacity: 35,
    shift: 'matutino',
    locationDescription: 'Espacio audiovisual norte de Biblioteca',
    equipment: 'Pantalla audiovisual y butacas',
    color: 'violet',
    iconName: 'Palette',
    croquisPosition: { x: 22.0, y: 54.6 }
  },
  {
    id: 'area-m-yoga',
    name: 'Aula de Yoga',
    category: 'Deporte y Salud',
    capacity: 30,
    shift: 'matutino',
    locationDescription: 'Salón rítmico y de relajación junto a Gimnasio Techado',
    equipment: 'Tapetes de yoga y música ambiental',
    color: 'amber',
    iconName: 'Smile',
    croquisPosition: { x: 64.2, y: 19.5 }
  },
  {
    id: 'area-m-danza',
    name: 'Aula de Danza',
    category: 'Deporte y Salud',
    capacity: 30,
    shift: 'matutino',
    locationDescription: 'Salón de expresión corporal y danza',
    equipment: 'Espejos de pared y barras de práctica',
    color: 'orange',
    iconName: 'Shield',
    croquisPosition: { x: 67.6, y: 19.5 }
  },
  {
    id: 'area-m-gimnasio-techado',
    name: 'Gimnasio Techado',
    category: 'Deporte y Salud',
    capacity: 40,
    shift: 'matutino',
    locationDescription: 'Instalaciones deportivas cubiertas norte',
    equipment: 'Colchonetas, balones y espacio de entrenamiento',
    color: 'blue',
    iconName: 'Dumbbell',
    croquisPosition: { x: 58.0, y: 19.5 }
  },
  {
    id: 'area-m-gimnasio-aire-libre',
    name: 'Gimnasio al aire libre',
    category: 'Deporte y Salud',
    capacity: 25,
    shift: 'matutino',
    locationDescription: 'Andador noroeste (junto al andador)',
    equipment: 'Aparatos de estiramiento, barras fijas y calistenia',
    color: 'red',
    iconName: 'Zap',
    croquisPosition: { x: 28.5, y: 22.0 }
  },
  {
    id: 'area-m-capulin',
    name: 'Patio Central "El Capulín"',
    category: 'Socialización y Charla',
    capacity: 45,
    shift: 'matutino',
    locationDescription: 'Explanada cívica central frente a Edificios B y D',
    equipment: 'Bancas de cantera, sombra de arbolado',
    color: 'emerald',
    iconName: 'Trees',
    croquisPosition: { x: 64.5, y: 61.0 }
  },
  {
    id: 'area-m-plazoleta',
    name: 'Plazoleta Central de Convivencia',
    category: 'Socialización y Charla',
    capacity: 50,
    shift: 'matutino',
    locationDescription: 'Plazoleta adoquinada entre Ciber Jardín 4 y Canchas',
    equipment: 'Espacio abierto ampliado para dinámicas grupales',
    color: 'blue',
    iconName: 'Users',
    croquisPosition: { x: 67.0, y: 43.0 }
  },
  {
    id: 'area-m-cafeteria',
    name: 'Terraza y Cafetería (Lab. Alimentos)',
    category: 'Socialización y Charla',
    capacity: 45,
    shift: 'matutino',
    locationDescription: 'Área gastronómica junto a Laboratorio de Alimentos',
    equipment: 'Mesas techadas con sombrillas',
    color: 'rose',
    iconName: 'Coffee',
    croquisPosition: { x: 84.5, y: 39.5 }
  }
];

export const INITIAL_VESPERTINO_AREAS: ConvivenciaArea[] = [
  {
    id: 'area-v-cancha-multiple',
    name: 'Cancha de usos múltiples (Cancha Múltiple)',
    category: 'Deporte y Salud',
    capacity: 45,
    shift: 'vespertino',
    locationDescription: 'Canchas deportivas de Básquetbol y Voleibol al nororiente',
    equipment: 'Tableros de básquetbol, red de voleibol y balones',
    color: 'amber',
    iconName: 'Dumbbell',
    croquisPosition: { x: 77.0, y: 19.5 }
  },
  {
    id: 'area-v-futbol',
    name: 'Cancha de Futbol',
    category: 'Deporte y Salud',
    capacity: 45,
    shift: 'vespertino',
    locationDescription: 'Zona deportiva norte del plantel',
    equipment: 'Porterías, área despejada y balones',
    color: 'emerald',
    iconName: 'Activity',
    croquisPosition: { x: 77.0, y: 6.5 }
  },
  {
    id: 'area-v-ciber-1',
    name: 'Ciber Jardín 1',
    category: 'Descanso y Sombra',
    capacity: 35,
    shift: 'vespertino',
    locationDescription: 'Zona verde poniente entre Edificio C y Biblioteca',
    equipment: 'Bancas exteriores y sombra natural',
    color: 'green',
    iconName: 'Sun',
    croquisPosition: { x: 34.0, y: 43.0 }
  },
  {
    id: 'area-v-ciber-2',
    name: 'Ciber Jardín 2',
    category: 'Descanso y Sombra',
    capacity: 35,
    shift: 'vespertino',
    locationDescription: 'Área verde nororiente, a la derecha de la Cancha Múltiple',
    equipment: 'Árboles maduros, sombra y bancas fijas',
    color: 'emerald',
    iconName: 'Leaf',
    croquisPosition: { x: 91.0, y: 19.0 }
  },
  {
    id: 'area-v-ciber-3',
    name: 'Ciber Jardín 3',
    category: 'Descanso y Sombra',
    capacity: 30,
    shift: 'vespertino',
    locationDescription: 'Jardín arbolado junto al andador diagonal norte',
    equipment: 'Bancas circulares e iluminación',
    color: 'cyan',
    iconName: 'Compass',
    croquisPosition: { x: 47.2, y: 19.5 }
  },
  {
    id: 'area-v-ciber-4',
    name: 'Ciber Jardín 4',
    category: 'Descanso y Sombra',
    capacity: 35,
    shift: 'vespertino',
    locationDescription: 'Jardín arbolado entre Edificio C y Edificios A y B',
    equipment: 'Área verde, mesabancas exteriores y sombra',
    color: 'teal',
    iconName: 'Flower2',
    croquisPosition: { x: 61.5, y: 49.0 }
  },
  {
    id: 'area-v-biblioteca',
    name: 'Biblioteca',
    category: 'Arte y Cultura',
    capacity: 40,
    shift: 'vespertino',
    locationDescription: 'Costado exterior de Biblioteca y Sala de Lectura',
    equipment: 'Pérgolas, mesas de lectura y tableros de ajedrez',
    color: 'indigo',
    iconName: 'BookOpen',
    croquisPosition: { x: 19.7, y: 62.8 }
  },
  {
    id: 'area-v-agora',
    name: 'Ágora',
    category: 'Música y Expresión',
    capacity: 45,
    shift: 'vespertino',
    locationDescription: 'Foro al aire libre, extensión a la altura de la Biblioteca',
    equipment: 'Gradas escalonadas semicirculares',
    color: 'sky',
    iconName: 'Music',
    croquisPosition: { x: 13.5, y: 62.8 }
  },
  {
    id: 'area-v-auditorio',
    name: 'Auditorio',
    category: 'Arte y Cultura',
    capacity: 50,
    shift: 'vespertino',
    locationDescription: 'Parte baja del Edificio C (debajo de las aulas 10 y 11)',
    equipment: 'Sillas auditorio, proyector y equipo de audio',
    color: 'blue',
    iconName: 'Users',
    croquisPosition: { x: 42.9, y: 32.5 }
  },
  {
    id: 'area-v-proyecciones',
    name: 'Sala de Proyecciones',
    category: 'Arte y Cultura',
    capacity: 35,
    shift: 'vespertino',
    locationDescription: 'Espacio audiovisual norte de Biblioteca',
    equipment: 'Pantalla audiovisual y butacas',
    color: 'violet',
    iconName: 'Palette',
    croquisPosition: { x: 22.0, y: 54.6 }
  },
  {
    id: 'area-v-yoga',
    name: 'Aula de Yoga',
    category: 'Deporte y Salud',
    capacity: 30,
    shift: 'vespertino',
    locationDescription: 'Salón rítmico y de relajación junto a Gimnasio Techado',
    equipment: 'Tapetes de yoga y música ambiental',
    color: 'amber',
    iconName: 'Smile',
    croquisPosition: { x: 64.2, y: 19.5 }
  },
  {
    id: 'area-v-danza',
    name: 'Aula de Danza',
    category: 'Deporte y Salud',
    capacity: 30,
    shift: 'vespertino',
    locationDescription: 'Salón de expresión corporal y danza',
    equipment: 'Espejos de pared y barras de práctica',
    color: 'orange',
    iconName: 'Shield',
    croquisPosition: { x: 67.6, y: 19.5 }
  },
  {
    id: 'area-v-gimnasio-techado',
    name: 'Gimnasio Techado',
    category: 'Deporte y Salud',
    capacity: 40,
    shift: 'vespertino',
    locationDescription: 'Instalaciones deportivas cubiertas norte',
    equipment: 'Colchonetas, balones y espacio de entrenamiento',
    color: 'blue',
    iconName: 'Dumbbell',
    croquisPosition: { x: 58.0, y: 19.5 }
  },
  {
    id: 'area-v-gimnasio-aire-libre',
    name: 'Gimnasio al aire libre',
    category: 'Deporte y Salud',
    capacity: 25,
    shift: 'vespertino',
    locationDescription: 'Andador noroeste (junto al andador)',
    equipment: 'Aparatos de estiramiento y barras fijas',
    color: 'red',
    iconName: 'Zap',
    croquisPosition: { x: 28.5, y: 22.0 }
  },
  {
    id: 'area-v-capulin',
    name: 'Patio Central "El Capulín"',
    category: 'Socialización y Charla',
    capacity: 45,
    shift: 'vespertino',
    locationDescription: 'Explanada cívica central frente a Edificios B y D',
    equipment: 'Bancas de cantera, sombra de arbolado',
    color: 'emerald',
    iconName: 'Trees',
    croquisPosition: { x: 64.5, y: 61.0 }
  },
  {
    id: 'area-v-plazoleta',
    name: 'Plazoleta Central de Convivencia',
    category: 'Socialización y Charla',
    capacity: 50,
    shift: 'vespertino',
    locationDescription: 'Plazoleta adoquinada entre Ciber Jardín 4 y Canchas',
    equipment: 'Espacio abierto ampliado para dinámicas grupales',
    color: 'blue',
    iconName: 'Users',
    croquisPosition: { x: 67.0, y: 43.0 }
  },
  {
    id: 'area-v-cafeteria',
    name: 'Terraza y Cafetería (Lab. Alimentos)',
    category: 'Socialización y Charla',
    capacity: 45,
    shift: 'vespertino',
    locationDescription: 'Área gastronómica junto a Laboratorio de Alimentos',
    equipment: 'Mesas techadas con sombrillas',
    color: 'rose',
    iconName: 'Coffee',
    croquisPosition: { x: 84.5, y: 39.5 }
  }
];

export const INITIAL_PRESET_ACTIVITIES = [
  {
    title: 'Torneo Relámpago de Ajedrez y Jenga',
    category: 'Juegos de Mesa y Estrategia',
    description: 'Partidas cortas de 5 minutos por turno para fomentar pensamiento estratégico y concentración cara a cara.',
    materialsNeeded: 'Tableros de ajedrez y juegos de Jenga de prefectura.',
    keyBenefit: 'Pensamiento lógico y desconexión digital.'
  },
  {
    title: 'Círculo de Diálogo y Debates Estudiantiles',
    category: 'Socialización y Charla',
    description: 'El grupo formula preguntas de interés juvenil y debaten posturas con moderación de un tutor o alumno líder.',
    materialsNeeded: 'Ninguno (solo la disposición del grupo en círculo).',
    keyBenefit: 'Oratoria, empatía y escucha activa.'
  },
  {
    title: 'Reto de Voleibol / Básquet Intergrupal',
    category: 'Deporte y Salud',
    description: 'Minipartidos a 10 puntos donde participan todos los integrantes rotando posiciones constantemente.',
    materialsNeeded: 'Balones y red o canasta.',
    keyBenefit: 'Trabajo en equipo y activación física.'
  },
  {
    title: 'Creación de Mural Colaborativo sobre Papel Kraft',
    category: 'Arte y Cultura',
    description: 'Expresión gráfica colectiva sobre un rollo de papel en el suelo con valores del Proyecto PRESENTE.',
    materialsNeeded: 'Papel Kraft, plumones y colores.',
    keyBenefit: 'Creatividad, cohesión social y libre expresión.'
  },
  {
    title: 'Taller Abierto de Lectura en Voz Alta y Poesía',
    category: 'Arte y Cultura',
    description: 'Lectura compartida de fragmentos de literatura jalisciense y mexicana al aire libre.',
    materialsNeeded: 'Libros de la biblioteca escolar.',
    keyBenefit: 'Fomento a la lectura y expresión verbal.'
  },
  {
    title: 'Circuito de Calistenia y Estiramiento Grupal',
    category: 'Deporte y Salud',
    description: 'Estaciones de 3 minutos de flexibilidad, coordinación y fuerza suave guiadas por turnos.',
    materialsNeeded: 'Barras del Gimnasio al Aire Libre y cronómetro manual.',
    keyBenefit: 'Salud postural, energía física y reducción del estrés escolar.'
  },
  {
    title: 'Dinámica Rompehielos: "2 Verdades y 1 Mentira"',
    category: 'Socialización y Charla',
    description: 'Cada alumno comparte 3 anécdotas cortas; los compañeros adivinan cuál es falsa debatiendo amistosamente.',
    materialsNeeded: 'Ninguno (actividad puramente verbal).',
    keyBenefit: 'Integración grupal, autoconfianza y empatía interpersonal.'
  },
  {
    title: 'Club de Juegos Tradicionales (Lotería, Dominó y Baraja Española)',
    category: 'Juegos de Mesa y Estrategia',
    description: 'Mesas simultáneas con juegos clásicos mexicanos fomentando la risa sana y la camaradería.',
    materialsNeeded: 'Juegos de mesa tradicionales disponibles en prefectura.',
    keyBenefit: 'Rescate de tradiciones lúdicas y convivencia intergeneracional.'
  },
  {
    title: 'Micrófono Abierto: Poesía, Canto y Expresión Libre',
    category: 'Música y Expresión',
    description: 'Espacio acústico en las gradas del Ágora donde los alumnos comparten poemas, canciones o reflexiones breves.',
    materialsNeeded: 'Guitarra acústica opcional o voz propia.',
    keyBenefit: 'Autoexpresión artística, desinhibición y aprecio cultural.'
  },
  {
    title: 'Rally del Conocimiento y Acertijos Matemáticos',
    category: 'Juegos de Mesa y Estrategia',
    description: 'Equipos de 4 integrantes resuelven pistas lógicas distribuidas por los andadores de la escuela.',
    materialsNeeded: 'Tarjetas de acertijos impresas y hojas de respuesta.',
    keyBenefit: 'Colaboración en equipo y pensamiento crítico divertido.'
  },
  {
    title: 'Mesa de Mediación y Acuerdos de Convivencia Positiva',
    category: 'Socialización y Charla',
    description: 'Sesión guiada por tutores para dialogar sobre bienestar emocional y resolución asertiva de dudas escolares.',
    materialsNeeded: 'Cuaderno de notas y guía de tutorías.',
    keyBenefit: 'Cultura de paz y prevención del acoso escolar.'
  },
  {
    title: 'Torneo de Penales y Dominadas de Balón',
    category: 'Deporte y Salud',
    description: 'Dinámica rápida de precisión y equilibrio futbolístico en la Cancha de Fútbol.',
    materialsNeeded: 'Balón de fútbol y porterías de la escuela.',
    keyBenefit: 'Coordinación motriz, entusiasmo deportivo y juego limpio.'
  }
];
