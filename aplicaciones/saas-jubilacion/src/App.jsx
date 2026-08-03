import React, { useState } from 'react';
import { calcularJubilacion, generarProyeccion } from './calculadora';
import './index.css';

const TIPO_LABEL = {
  jubilacion:  { texto: 'Jubilación Plena 🎉', cls: 'badge-success' },
  vejez:       { texto: 'Retiro por Vejez',    cls: 'badge-warning' },
  anticipado:  { texto: 'Retiro Anticipado',   cls: 'badge-info'    },
  no_elegible: { texto: 'No elegible',         cls: 'badge-error'   },
};

function App() {
  const [step, setStep] = useState(1);
  const [dob, setDob] = useState('');
  const [doe, setDoe] = useState('');
  const [resultado, setResultado] = useState(null);
  const [proyeccion, setProyeccion] = useState([]);
  const [showDocs, setShowDocs] = useState(false);

  const handleNext = () => {
    if (step === 1 && dob) setStep(2);
    else if (step === 2 && doe) {
      const res = calcularJubilacion(dob, doe);
      const proj = generarProyeccion(dob, doe);
      setResultado(res);
      setProyeccion(proj);
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const reset = () => {
    setStep(1);
    setDob('');
    setDoe('');
    setResultado(null);
    setProyeccion([]);
  };

  return (
    <div className="app-container">
      <div className="wizard-card">
        <header className="wizard-header">
          <h1>Simulador de Jubilación</h1>
          <p>Universidad de Guadalajara / STAUdeG</p>
        </header>

        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        <div className="wizard-content">
          {/* ─── PASO 1 ─── */}
          {step === 1 && (
            <div className="step-container slide-in">
              <h2>¿Cuál es tu fecha de nacimiento?</h2>
              <p>Requerimos este dato para calcular tu edad actual.</p>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="date-input"
              />
            </div>
          )}

          {/* ─── PASO 2 ─── */}
          {step === 2 && (
            <div className="step-container slide-in">
              <h2>¿Cuál es tu fecha de ingreso?</h2>
              <p>Fecha en que comenzaste a cotizar o ingresar a la Universidad.</p>
              <input
                type="date"
                value={doe}
                onChange={(e) => setDoe(e.target.value)}
                className="date-input"
              />
            </div>
          )}

          {/* ─── PASO 3: RESULTADOS ─── */}
          {step === 3 && resultado && (
            <div className="step-container slide-in result-container">
              <h2>Resultados de tu Simulación</h2>

              {/* Tarjeta de datos actuales */}
              <div className="result-card">
                <div className="result-item">
                  <span className="label">Tu Grupo:</span>
                  <span className="value text-highlight">{resultado.grupoStr}</span>
                </div>
                <div className="result-item">
                  <span className="label">Edad actual:</span>
                  <span className="value">{resultado.edad} años</span>
                </div>
                <div className="result-item">
                  <span className="label">Años de servicio:</span>
                  <span className="value">{resultado.antiguedad} años</span>
                </div>
              </div>

              {/* Banner de estado actual */}
              <div className={`status-banner ${resultado.elegible100 ? 'success' : resultado.elegibleAnticipada ? 'warning' : 'error'}`}>
                {resultado.elegible100 ? (
                  <>
                    <h3>¡Felicidades!</h3>
                    <p>Cumples con los requisitos para una pensión por jubilación al <b>100%</b>.</p>
                  </>
                ) : resultado.elegibleAnticipada ? (
                  <>
                    <h3>Retiro Anticipado Disponible</h3>
                    <p>Eres elegible para un retiro anticipado con un porcentaje estimado del <b>{resultado.porcentaje}%</b> de tu salario regulador.</p>
                  </>
                ) : (
                  <>
                    <h3>Aún no eres elegible</h3>
                    <p>{resultado.mensajeError}</p>
                  </>
                )}
              </div>

              {/* ─── TABLA DE PROYECCIÓN ─── */}
              {proyeccion.length > 0 && (
                <div className="proyeccion-section">
                  <h3 className="proyeccion-title">
                    📊 Proyección por año de espera
                  </h3>
                  <p className="proyeccion-desc">
                    Así cambia tu beneficio si decides esperar uno o más años antes de iniciar el trámite.
                  </p>
                  <div className="tabla-wrapper">
                    <table className="tabla-proyeccion">
                      <thead>
                        <tr>
                          <th>Espera</th>
                          <th>Edad</th>
                          <th>Antigüedad</th>
                          <th>% Pensión</th>
                          <th>Situación</th>
                          <th>Falta para 100%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proyeccion.map((fila) => (
                          <tr
                            key={fila.delta}
                            className={`${fila.delta === 0 ? 'fila-actual' : ''} ${fila.esMáximo ? 'fila-maximo' : ''}`}
                          >
                            <td className="td-espera">
                              {fila.delta === 0 ? 'Hoy' : `+${fila.delta} año${fila.delta > 1 ? 's' : ''}`}
                            </td>
                            <td>{fila.edad}</td>
                            <td>{fila.antiguedad} años</td>
                            <td className="td-porcentaje">
                              <div className="pct-wrap">
                                <div
                                  className="pct-bar"
                                  style={{ width: `${fila.porcentaje}%` }}
                                />
                                <span className="pct-label">{fila.porcentaje}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${TIPO_LABEL[fila.tipo]?.cls ?? 'badge-error'}`}>
                                {TIPO_LABEL[fila.tipo]?.texto ?? '—'}
                              </span>
                            </td>
                            <td className="td-falta">
                              {fila.faltaPara100 > 0
                                ? `${fila.faltaPara100} años`
                                : <span className="check">✔</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="action-buttons">
                <button className="primary-btn" onClick={reset}>Calcular de nuevo</button>
                <button className="secondary-btn" onClick={() => setShowDocs(true)}>Ver Requisitos de Trámite</button>
              </div>
            </div>
          )}
        </div>

        {/* Navegación del wizard */}
        {step < 3 && (
          <div className="wizard-footer">
            <button
              className="secondary-btn"
              onClick={handleBack}
              disabled={step === 1}
            >
              Atrás
            </button>
            <button
              className="primary-btn"
              onClick={handleNext}
              disabled={(step === 1 && !dob) || (step === 2 && !doe)}
            >
              Continuar
            </button>
          </div>
        )}
      </div>

      {/* ─── MODAL DE DOCUMENTACIÓN ─── */}
      {showDocs && (
        <div className="modal-overlay" onClick={() => setShowDocs(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Documentación Requerida</h2>
              <button className="close-btn" onClick={() => setShowDocs(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Para la jubilación o retiro anticipado, debes presentar:</p>
              <ul>
                <li>Solicitud debidamente requisitada.</li>
                <li>Acta de nacimiento certificada (no mayor a 180 días).</li>
                <li>Copia de identificación oficial vigente (INE, pasaporte, cédula o FM3).</li>
                <li>CURP y Comprobante de domicilio.</li>
                <li>Constancia de Situación Fiscal (no mayor a 30 días).</li>
                <li>Estado de cuenta bancario.</li>
              </ul>

              <h3 className="mt-4">Contacto y Recepción</h3>
              <p><strong>Horario:</strong> Lunes a Viernes de 8:30 am a 4:00 pm</p>
              <p><strong>Oficina:</strong> Coordinación del Régimen de Pensiones, Jubilaciones y Prestaciones de Seguridad Social.</p>
              <p><strong>Correo:</strong> dirfingestionpensiones@udg.mx</p>
              <p><strong>Teléfonos:</strong> (33) 3134-2288, extensiones 12593 y 12588.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
