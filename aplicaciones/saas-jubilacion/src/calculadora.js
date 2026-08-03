const MS_POR_ANIO = 1000 * 60 * 60 * 24 * 365.25;

function determinarGrupo(fechaIngreso) {
  const fechaI = new Date(fechaIngreso);
  const limiteGrupo1 = new Date('1997-06-30T23:59:59');
  const limiteGrupo2 = new Date('2003-12-31T23:59:59');

  if (fechaI <= limiteGrupo1) {
    return {
      grupo: 1,
      grupoStr: 'Trabajador Actual (Ingreso hasta Jun 1997)',
      minAntiguedad: 9 + (4.5 / 12),
      reqAntiguedad100: 30,
      tasaPorAnio: 3.33,
    };
  } else if (fechaI <= limiteGrupo2) {
    return {
      grupo: 2,
      grupoStr: 'Trabajador Actual (Ingreso Jul 1997 – Dic 2003)',
      minAntiguedad: 15,
      reqAntiguedad100: 30,
      tasaPorAnio: 3.33,
    };
  } else {
    return {
      grupo: 3,
      grupoStr: 'Trabajador Nuevo (Ingreso post-2003)',
      minAntiguedad: 24 + (14 / 365.25),
      reqAntiguedad100: 35,
      tasaPorAnio: 2.86,
    };
  }
}

// Calcula el porcentaje de pensión dada la edad y antigüedad (en años decimales)
function calcularPorcentaje(edad, antiguedad, { minAntiguedad, reqAntiguedad100, tasaPorAnio }) {
  // Jubilación plena
  if (edad >= 65 && antiguedad >= reqAntiguedad100) {
    return { porcentaje: 100, tipo: 'jubilacion', elegible: true };
  }

  if (antiguedad >= minAntiguedad) {
    if (edad >= 65) {
      // Retiro por vejez (antigüedad parcial)
      const base = Math.min(100, Math.floor(antiguedad) * tasaPorAnio);
      return { porcentaje: parseFloat(base.toFixed(2)), tipo: 'vejez', elegible: true };
    } else if (edad >= 60) {
      // Retiro anticipado por edad avanzada – descuento 5% por año que falte para 65
      const base = Math.floor(antiguedad) * tasaPorAnio;
      const reduccion = Math.ceil(65 - edad) * 5;
      const pct = parseFloat(Math.min(100, Math.max(0, base - reduccion)).toFixed(2));
      return { porcentaje: pct, tipo: 'anticipado', elegible: true };
    }
  }
  return { porcentaje: 0, tipo: 'no_elegible', elegible: false };
}

export function calcularJubilacion(fechaNacimiento, fechaIngreso) {
  const hoy = new Date();
  const dob = new Date(fechaNacimiento);
  const doe = new Date(fechaIngreso);

  const edad = (hoy - dob) / MS_POR_ANIO;
  const antiguedad = (hoy - doe) / MS_POR_ANIO;

  const grupoInfo = determinarGrupo(fechaIngreso);
  const { grupo, grupoStr, minAntiguedad, reqAntiguedad100 } = grupoInfo;

  const { porcentaje, tipo, elegible } = calcularPorcentaje(edad, antiguedad, grupoInfo);

  const faltanEdad = Math.max(0, 65 - edad);
  const faltanAnt = Math.max(0, reqAntiguedad100 - antiguedad);
  const faltaPara100 = Math.max(faltanEdad, faltanAnt);

  let mensajeError = null;
  if (!elegible) {
    if (antiguedad < minAntiguedad) {
      const labels = { 1: '9 años, 4 meses y 15 días', 2: '15 años', 3: '24 años y 2 semanas' };
      mensajeError = `Aún no cumples la antigüedad mínima requerida de ${labels[grupo]} para tu grupo.`;
    } else {
      mensajeError = 'Aún no cumples la edad mínima de 60 años para el retiro anticipado.';
    }
  }

  return {
    edad: parseFloat(edad.toFixed(2)),
    antiguedad: parseFloat(antiguedad.toFixed(2)),
    grupo,
    grupoStr,
    elegible100: tipo === 'jubilacion',
    elegibleAnticipada: elegible && tipo !== 'jubilacion',
    porcentaje,
    mensajeError,
    faltaPara100: parseFloat(faltaPara100.toFixed(2)),
  };
}

/**
 * Genera una tabla de proyección año a año.
 * Para cada año adicional de espera (0 = hoy, 1 = +1 año, …) calcula
 * la edad, la antigüedad y el porcentaje de pensión.
 * Se detiene cuando se alcanza el 100% o un máximo razonable de años.
 */
export function generarProyeccion(fechaNacimiento, fechaIngreso) {
  const hoy = new Date();
  const dob = new Date(fechaNacimiento);
  const doe = new Date(fechaIngreso);

  const edadHoy = (hoy - dob) / MS_POR_ANIO;
  const antHoy = (hoy - doe) / MS_POR_ANIO;

  const grupoInfo = determinarGrupo(fechaIngreso);
  const { reqAntiguedad100 } = grupoInfo;

  // Años máximos de proyección: hasta llegar a 100% o no más de 15 años extra
  const MAX_ANIOS = 15;
  const filas = [];

  for (let delta = 0; delta <= MAX_ANIOS; delta++) {
    const edad = edadHoy + delta;
    const ant = antHoy + delta;

    const { porcentaje, tipo, elegible } = calcularPorcentaje(edad, ant, grupoInfo);

    const faltanEdad = Math.max(0, 65 - edad);
    const faltanAnt = Math.max(0, reqAntiguedad100 - ant);
    const faltaPara100 = parseFloat(Math.max(faltanEdad, faltanAnt).toFixed(1));

    filas.push({
      delta,                                          // años adicionales de espera
      edad: parseFloat(edad.toFixed(1)),
      antiguedad: parseFloat(ant.toFixed(1)),
      porcentaje,
      tipo,
      elegible,
      faltaPara100: faltaPara100 > 0 ? faltaPara100 : 0,
      esMáximo: tipo === 'jubilacion',
    });

    // Si ya se alcanzó el 100%, no proyectar más
    if (tipo === 'jubilacion') break;
  }

  return filas;
}
