/**
 * APP LOGIC V2.0
 * Vista y controladores limpios.
 */

let editingTeamId = null;
let editingMatchId = null;
let matchSearchQuery = "";

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Escuchar cambios en los enlaces de navegación
    document.querySelectorAll('.nav-links li').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');

            // Protección de acceso
            if ((view === 'admin' || view === 'capturar') && !State.isAdmin) {
                window.loginAdmin();
                return;
            }

            State.currentView = view;
            render();
        });
    });

    window.addEventListener('stateChanged', render);
    render();
}

function render() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    // Actualizar estados de la barra de navegación
    document.querySelectorAll('.nav-links li').forEach(ni => {
        ni.classList.toggle('active', ni.getAttribute('data-view') === State.currentView);
    });

    const navAdmin = document.querySelector('[data-view="admin"]');
    const navCaptura = document.querySelector('[data-view="capturar"]');
    const authBtn = document.getElementById('auth-btn');

    if (State.isAdmin) {
        navAdmin?.classList.remove('hidden');
        navCaptura?.classList.remove('hidden');
        if (authBtn) authBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Salir';
    } else {
        navAdmin?.classList.add('hidden');
        navCaptura?.classList.add('hidden');
        if (authBtn) authBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Acceso';
    }

    // Renderizar la vista correspondiente
    viewport.innerHTML = '';

    try {
        switch (State.currentView) {
            case 'dashboard':
                updateTicker();
                renderDashboard(viewport);
                break;
            case 'report':
                renderReport(viewport);
                break;
            case 'admin':
                renderAdmin(viewport);
                break;
            case 'capturar':
                renderCaptura(viewport);
                break;
            default: renderDashboard(viewport);
        }
    } catch (err) {
        console.error("Render Error:", err);
        viewport.innerHTML = `<div style="padding: 40px; text-align: center; color: #ff4b2b;">
            <i class="fa-solid fa-circle-exclamation fa-3x" style="margin-bottom: 20px;"></i>
            <h2>Error al cargar la vista</h2>
            <p>${err.message}</p>
        </div>`;
    }
}

function updateTicker() {
    const tEl = document.getElementById('live-ticker');
    const tCont = document.querySelector('.ticker');
    if (!tCont || !tEl) return;

    tEl.classList.remove('hidden');
    
    const finishedComps = State.competitions.filter(c => c.status === 'finished');

    if (finishedComps.length > 0) {
        const tickerItems = finishedComps.map(c => {
            const results = State.eventResults
                .filter(r => r.competitionId === c.id && !r.dq && r.value)
                .sort((a, b) => {
                    const vA = window.parseFlexibleValue(a.value);
                    const vB = window.parseFlexibleValue(b.value);
                    return vB - vA;
                });
            
            if (results.length > 0) {
                const firstPlace = results[0];
                const team = State.teams.find(t => t.id === firstPlace.teamId);
                const emoji = c.type === 'calaverita' ? '💀' : (c.type === 'cuentos' ? '📖' : (c.type === 'catrines' ? '👘' : (c.type === 'altares' ? '🕯️' : '🎨')));
                return `<div class="ticker__item" style="display: inline-block; margin-right: 50px;">
                    ${emoji} ¡Felicidades a <strong>${team ? team.name : '---'}</strong> por el 1er Lugar en ${c.name}! ${emoji}
                </div>`;
            }
            return null;
        }).filter(Boolean);

        if (tickerItems.length > 0) {
            tCont.innerHTML = tickerItems.join('');
        } else {
            tCont.innerHTML = `<div class="ticker__item">🕯️ ¡Bienvenidos al Festival de Vida y Muerte 2026! - Prepa Chapala celebra nuestras raíces. 💀🌼</div>`;
        }
    } else {
        tCont.innerHTML = `<div class="ticker__item">🕯️ ¡Bienvenidos al Festival de Vida y Muerte 2026! - Prepa Chapala celebra nuestras raíces. 💀🌼</div>`;
    }
}

// --- VISTAS ---

function renderDashboard(container) {
    const competitions = State.competitions || [];
    if (!State.selectedDashboardComp) {
        State.selectedDashboardComp = 'home';
    }

    const selectedComp = competitions.find(c => c.id === State.selectedDashboardComp);
    const isHome = State.selectedDashboardComp === 'home';

    container.innerHTML = `
        <div class="dashboard-public fade-in">
            <section class="bracket-container" style="position: relative; min-height: 600px;">
                <div class="bracket-header">
                    <div>
                        <h2><i class="${isHome ? 'fa-solid fa-house' : 'fa-solid fa-list-ol'}" style="color: var(--accent-yellow)"></i> 
                            ${isHome ? 'BIENVENIDOS' : 'PUNTUACIONES Y POSICIONES'}
                        </h2>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">${isHome ? 'Portal Oficial de Resultados' : 'Calificaciones y lugares por disciplina'}</p>
                    </div>
                    <div class="comp-selector">
                        <select onchange="State.selectedDashboardComp = this.value; render();" style="background: rgba(242,223,13,0.1); border: 1px solid var(--accent-yellow); color: white; padding: 8px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            <option value="home" ${isHome ? 'selected' : ''}>🏠 INICIO / INAUGURACIÓN</option>
                            ${window.sortCompetitions(competitions).map(c => `<option value="${c.id}" ${c.id === State.selectedDashboardComp ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 20px; color: var(--accent-gold); font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                    ${isHome ? 'FESTIVAL DE VIDA Y MUERTE 2026' : (selectedComp ? `${selectedComp.name}` : 'Sin categorías')}
                </div>

                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; pointer-events: none; width: 60%;">
                    <img src="logo.png" alt="" style="width: 100%; filter: grayscale(1);">
                </div>

                <div class="bracket-visual" style="position: relative; z-index: 1;">
                    ${isHome ? `
                        <div style="text-align: center; padding: 40px 20px; max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.03); border-radius: 20px; border: 1px solid rgba(245,200,66,0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                            <div style="margin-bottom: 30px;">
                                <i class="fa-solid fa-skull fa-4x" style="color: var(--accent-primary); margin-bottom: 20px;"></i>
                                <h1 style="font-family: 'Outfit'; font-size: 2.5rem; line-height: 1.1; margin-bottom: 10px;">FESTIVAL DE VIDA Y MUERTE</h1>
                                <div style="height: 4px; width: 60px; background: var(--accent-gold); margin: 0 auto 20px;"></div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 40px;">
                                <div style="background: rgba(255,107,26,0.07); padding: 20px; border-radius: 12px; border-left: 4px solid var(--accent-primary);">
                                    <div style="font-size: 0.8rem; color: var(--accent-primary); text-transform: uppercase; margin-bottom: 5px;">Fecha del Festival</div>
                                    <div style="font-size: 1.3rem; font-weight: 800;">Octubre / Noviembre 2026</div>
                                    <div style="font-size: 1.1rem; color: var(--accent-gold);">Prepa Chapala</div>
                                </div>
                                <div style="background: rgba(245,200,66,0.05); padding: 20px; border-radius: 12px; border-left: 4px solid var(--accent-gold);">
                                    <div style="font-size: 0.8rem; color: var(--accent-gold); text-transform: uppercase; margin-bottom: 5px;">5 Categorías en Concurso</div>
                                    <div style="font-size: 0.95rem; font-weight: 600; line-height: 1.8;">💀 Calaverita Literaria &nbsp;|&nbsp; 📖 Cuentos y Leyendas<br>👘 Catrines y Catrinas &nbsp;|&nbsp; 🕯️ Altares &nbsp;|&nbsp; 🎨 Lápida y Alebrije</div>
                                </div>
                            </div>

                            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">
                                Celebramos nuestras raíces a través del arte y la tradición.<br>
                                <span style="color: white; font-weight: 600; display: block; margin-top: 15px;">Selecciona una categoría en el menú superior para consultar resultados y posiciones.</span>
                            </p>
                        </div>
                    ` : renderBracketContent(selectedComp)}
                </div>
            </section>

            <aside class="upcoming-sidebar">
                <div class="card" style="height: 100%;">
                    <h3><i class="fa-solid fa-calendar-alt"></i> Próximos Eventos</h3>
                    
                    <div style="margin-top: 15px; margin-bottom: 10px;">
                        <select onchange="State.selectedUpcomingDate = this.value; render();" style="width: 100%; background: #1a1c23; border: 1px solid var(--accent-yellow); color: white; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                            <option value="all">📅 VER TODAS LAS FECHAS</option>
                            ${[...new Set(State.matches.filter(m => {
        const comp = State.competitions.find(c => c.id === m.competitionId);
        return m.status !== 'finished' && (!comp || comp.status !== 'finished') && m.date;
    }).map(m => m.date))].sort().map(d =>
        `<option value="${d}" ${State.selectedUpcomingDate === d ? 'selected' : ''}>DÍA: ${d}</option>`
    ).join('')}
                        </select>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px; max-height: 400px; overflow-y: auto;" class="custom-scroll">
                        ${State.matches.filter(m => {
        const comp = State.competitions.find(c => c.id === m.competitionId);
        return m.status !== 'finished' && (!comp || comp.status !== 'finished');
    })
            .filter(m => !State.selectedUpcomingDate || State.selectedUpcomingDate === 'all' || m.date === State.selectedUpcomingDate)
            .sort((a, b) => {
                const dateA = a.date || '9999-12-31';
                const dateB = b.date || '9999-12-31';
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                return (a.time || '23:59').localeCompare(b.time || '23:59');
            }).map(m => {
                const comp = State.competitions.find(c => c.id === m.competitionId);
                return `
                                    <div class="item-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                                        <div style="font-size: 0.7rem; color: var(--accent-gold); font-weight: 800; text-transform: uppercase;">${comp?.name || '---'}</div>
                                        <div style="font-weight: 600; font-size: 0.9rem; width: 100%; display: flex; justify-content: space-between; align-items: center;">
                                            <span style="color: var(--text-main);"><i class="fa-solid fa-clock" style="font-size: 0.75rem; color: var(--accent-gold);"></i> ${m.time}</span>
                                            <span style="font-size: 0.7rem; color: var(--text-muted); opacity: 0.7;">${m.date}</span>
                                        </div>
                                    </div>
                                `;
            }).join('') || '<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 10px;">No hay actividades programadas.</p>'}
                    </div>

                    <h3 style="margin-top: 40px;"><i class="fa-solid fa-star" style="color: var(--accent-yellow)"></i> TABLA GENERAL DE PUNTOS</h3>
                    <div style="margin-top: 20px; max-height: 400px; overflow-y: auto;" class="custom-scroll">
                        ${[...State.teams].sort((a, b) => b.totalPoints - a.totalPoints).map((t, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                                <span style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 0.7rem; color: var(--text-muted); width: 15px;">${idx + 1}°</span>
                                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${window.translateColor(t.color)};"></span>
                                    <span style="font-size: 0.95rem; font-weight: ${idx < 3 ? '700' : '400'}">${t.name}</span>
                                </span>
                                <div style="text-align: right;">
                                    <div style="font-family: 'Outfit'; font-weight: 800; color: var(--accent-yellow); font-size: 1.1rem;">${t.totalPoints} <small style="font-size: 0.6rem; opacity: 0.5;">PTS</small></div>
                                    ${t.amonestaciones > 0 ? `
                                        <div style="font-size: 0.6rem; color: #ff4b2b; font-weight: 700;">
                                            <i class="fa-solid fa-square" style="color: #f2df0d;"></i> ${t.amonestaciones} ${Math.floor(t.amonestaciones / 3) > 0 ? `(-${Math.floor(t.amonestaciones / 3) * 5} pts)` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('') || '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 10px;">No hay equipos registrados.</p>'}
                    </div>
                </div>
            </aside>
        </div>
    `;
}

function renderBracketContent(comp) {
    if (!comp) return '';
    // Vista Ranking
    const results = State.eventResults.filter(r => r.competitionId === comp.id && r.value !== '' && r.value !== '0')
        .sort((a, b) => {
            const vA = window.parseFlexibleValue(a.value);
            const vB = window.parseFlexibleValue(b.value);
            return vB - vA; // Puntos: Más es mejor
        });

    return `
        <div style="width: 100%; max-width: 800px; margin: 0 auto; min-height: 400px;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0 10px;">
                <thead>
                    <tr style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">
                        <th style="padding: 10px; width: 60px;">Pos</th>
                        <th style="padding: 10px; text-align: left;">Participante / Grupo</th>
                        <th style="padding: 10px; text-align: right;">Calificación</th>
                    </tr>
                </thead>
                <tbody>
                    ${(() => {
                        let lastVal = null;
                        let displayPos = 0;
                        return results.map((res, idx) => {
                            const currentVal = window.parseFlexibleValue(res.value);
                            if (currentVal !== lastVal) {
                                displayPos++;
                            }
                            lastVal = currentVal;

                            const team = State.teams.find(t => t.id === res.teamId);
                            return `
                                <tr style="background: rgba(255,255,255,0.03);">
                                    <td style="padding: 15px; text-align: center; font-weight: 900; color: ${displayPos <= 3 ? 'var(--accent-yellow)' : 'var(--text-muted)'}; font-size: 1.2rem;">${displayPos}°</td>
                                    <td style="padding: 15px;">
                                        <div style="display: flex; align-items: center; gap: 15px;">
                                            <span style="width: 4px; height: 25px; background: ${window.translateColor(team?.color)};"></span>
                                            <div>
                                                ${res.participantName ? `
                                                    <div style="font-weight: 700;">${res.participantName}</div>
                                                    <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">${team?.name || '---'}</div>
                                                ` : `
                                                    <div style="font-weight: 700; color: var(--accent-gold); font-size: 1.1rem;">${team?.name || '---'}</div>
                                                `}
                                                ${res.advanced ? '<span class="pulse" style="font-size:0.6rem; color: var(--success); font-weight: 800;"><i class="fa-solid fa-medal"></i> DESTACADO</span>' : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 15px; text-align: right; font-family: \'Outfit\'; font-weight: 800; font-size: 1.1rem; color: var(--accent-gold);">${res.value} Pts</td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="3" style="text-align: center; padding: 40px; color: var(--text-muted);">Sin resultados registrados aún</td></tr>';
                    })()}
                </tbody>
            </table>
        </div>
    `;
}

function renderAdmin(container) {
    container.innerHTML = `
        <div class="admin-container fade-in">
            <h1 style="margin-bottom: 40px; font-family: var(--font-heading);"><i class="fa-solid fa-gears" style="color: var(--accent-yellow)"></i> Configuración</h1>
            <div class="admin-grid">
                <div class="card">
                    <h3><i class="fa-solid fa-users"></i> Grupos (${State.teams.length})</h3>
                    <form id="form-team" style="margin-top: 20px;">
                        <input type="text" id="t-name" placeholder="Nombre Grupo (ej. 5º A)" required value="${editingTeamId ? State.teams.find(t => t.id === editingTeamId)?.name : ''}" style="margin-bottom: 10px;">
                        <input type="text" id="t-color" placeholder="Color (ej. Azul, Rojo)" required value="${editingTeamId ? State.teams.find(t => t.id === editingTeamId)?.color : ''}" style="margin-bottom: 15px;">
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" class="btn" style="flex: 1;">${editingTeamId ? 'Actualizar' : 'Añadir'}</button>
                            ${editingTeamId ? '<button type="button" class="btn btn-secondary" onclick="editingTeamId=null; render();">Cancelar</button>' : ''}
                        </div>
                    </form>
                    <div class="item-list" style="margin-top: 20px; max-height: 250px; overflow-y: auto;">
                        ${State.teams.map(t => `
                            <div class="item-row">
                                <span style="display: flex; align-items: center; gap: 10px;">
                                    <span style="width: 10px; height: 10px; border-radius: 50%; background: ${window.translateColor(t.color)};"></span>
                                    ${t.name}
                                </span>
                                <span>
                                    <i class="fa-solid fa-edit" onclick="editingTeamId='${t.id}'; render();" style="cursor: pointer; color: var(--accent-blue); margin-right: 10px;"></i>
                                    <i class="fa-solid fa-trash" onclick="if(confirm('¿Borrar?')) {State.teams=State.teams.filter(it=>it.id!=='${t.id}'); State.save(); State.notify();}" style="cursor: pointer; color: var(--text-muted);"></i>
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card">
                    <h3><i class="fa-solid fa-medal"></i> Disciplinas (${State.competitions.length})</h3>
                    <form id="form-comp" style="margin-top: 20px;">
                        <input type="text" id="c-name" placeholder="Nombre (ej. Altares)" required style="margin-bottom: 10px;">
                        <select id="c-type" style="margin-bottom: 10px;">
                            <option value="calaverita">Calaverita Literaria</option>
                            <option value="cuentos">Cuentos y Leyendas</option>
                            <option value="catrines">Catrines y Catrinas</option>
                            <option value="altares">Altares</option>
                            <option value="lapida">Lápida y Alebrije</option>
                        </select>
                        <input type="hidden" id="c-format" value="ranking">
                        <input type="hidden" id="c-rama" value="Mixto">
                        <button type="submit" class="btn" style="width: 100%;">Añadir</button>
                    </form>
                    <div class="item-list" style="margin-top: 20px; max-height: 250px; overflow-y: auto;">
                        ${window.sortCompetitions(State.competitions).map(c => `
                            <div class="item-row">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600;">${c.name}</div>
                                    <div style="font-size: 0.6rem; color: var(--accent-yellow)">${c.type.toUpperCase()} ${c.status === 'finished' ? '<span style="color: var(--success); font-weight: 800;">[FINALIZADA]</span>' : ''}</div>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center;">
                                    ${c.status === 'finished' ? `
                                        <i class="fa-solid fa-lock-open" onclick="window.reopenComp('${c.id}')" title="Reabrir para correcciones" style="cursor: pointer; color: var(--accent-yellow);"></i>
                                    ` : ''}
                                    <i class="fa-solid fa-trash" onclick="if(confirm('¿Borrar?')) {State.competitions=State.competitions.filter(it=>it.id!=='${c.id}'); State.save(); State.notify();}" style="cursor: pointer; color: var(--text-muted);"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 30px;">
                <h3><i class="fa-solid fa-calendar-plus"></i> Programar Actividades / Evaluaciones</h3>
                <form id="form-match" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                    <div><label>Disciplina / Categoría</label><select id="m-comp">${window.sortCompetitions(State.competitions).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
                    <div><label>Fecha</label><input type="date" id="m-date"></div>
                    <div><label>Hora / Lugar</label><input type="text" id="m-time" placeholder="10:00 - Explanada"></div>
                    <div style="display: flex; gap: 10px; margin-top: 20px; grid-column: 1 / -1;">
                        <button id="btn-submit-match" type="submit" class="btn">${editingMatchId ? 'Guardar Cambios' : 'Agendar Actividad'}</button>
                        ${editingMatchId ? `<button type="button" class="btn btn-secondary" onclick="editingMatchId=null; render();">Cancelar</button>` : ''}
                    </div>
                </form>

                <div class="item-list" style="margin-top: 40px; max-height: 400px; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                        <h4 style="margin: 0;">Actividades Programadas</h4>
                        <div style="position: relative; display: flex; align-items: center; background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                            <i class="fa-solid fa-magnifying-glass" style="font-size: 0.7rem; color: var(--text-muted); margin-right: 8px;"></i>
                            <input type="text" id="match-search" placeholder="Buscar..." value="${matchSearchQuery}" 
                                oninput="matchSearchQuery = this.value; render(); const input = document.getElementById('match-search'); input.focus(); input.setSelectionRange(input.value.length, input.value.length);"
                                style="background: transparent; border: none; color: white; font-size: 0.75rem; outline: none; width: 120px;">
                        </div>
                    </div>
                    
                    ${(() => {
            const filtered = State.matches.filter(m => {
                if (!matchSearchQuery) return true;
                const q = matchSearchQuery.toLowerCase();
                const c = State.competitions.find(it => it.id === m.competitionId);
                return (c?.name?.toLowerCase().includes(q));
            }).sort((a, b) => {
                const dA = a.date || '9999-12-31';
                const dB = b.date || '9999-12-31';
                if (dA !== dB) return dA.localeCompare(dB);
                return (a.time || '23:59').localeCompare(b.time || '23:59');
            });

            if (filtered.length === 0) return `<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 20px;">${matchSearchQuery ? 'No hay coincidencias' : 'No hay actividades programadas'}</p>`;

            return filtered.map(m => {
                const c = State.competitions.find(it => it.id === m.competitionId);
                return `
                                <div class="item-row" style="padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.03);">
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.75rem; color: var(--accent-yellow); font-weight: 800;">
                                            ${c?.name || '---'}
                                        </div>
                                        <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">
                                            <i class="fa-solid fa-calendar-day"></i> ${m.date || 'Sin fecha'} | <i class="fa-solid fa-clock"></i> ${m.time || 'Sin hora'}
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 15px;">
                                        <i class="fa-solid fa-edit" onclick="editingMatchId='${m.id}'; render(); document.getElementById('form-match').scrollIntoView({behavior: 'smooth'});" style="cursor: pointer; color: var(--accent-blue);"></i>
                                        <i class="fa-solid fa-trash" onclick="if(confirm('¿Borrar actividad?')) {State.matches=State.matches.filter(it=>it.id!=='${m.id}'); State.save(); State.notify();}" style="cursor: pointer; color: var(--text-muted);"></i>
                                    </div>
                                </div>
                            `;
            }).join('');
        })()}
                </div>
            </div>

            <div style="margin-top: 60px; text-align: center; opacity: 0.3; font-size: 0.7rem; color: var(--text-muted);">
                <i class="fa-solid fa-lock"></i> Sistema de Gestión Protegido
            </div>
        </div>
    `;

    setupAdminListeners();
}

function setupAdminListeners() {
    const fTeam = document.getElementById('form-team');
    if (fTeam) {
        fTeam.onsubmit = (e) => {
            e.preventDefault();
            const n = document.getElementById('t-name').value;
            const c = document.getElementById('t-color').value;
            if (editingTeamId) State.updateTeam(editingTeamId, n, c);
            else State.addTeam(n, c);
            editingTeamId = null;
        };
    }

    const fComp = document.getElementById('form-comp');
    if (fComp) {
        fComp.onsubmit = (e) => {
            e.preventDefault();
            State.addCompetition(
                document.getElementById('c-name').value,
                document.getElementById('c-type').value,
                document.getElementById('c-format').value,
                document.getElementById('c-rama').value
            );
            alert("Disciplina añadida.");
        };
    }

    const fMatch = document.getElementById('form-match');
    if (fMatch) {
        if (editingMatchId) {
            const m = State.matches.find(m => m.id === editingMatchId);
            if (m) {
                document.getElementById('m-comp').value = m.competitionId;
                document.getElementById('m-date').value = m.date || '';
                document.getElementById('m-time').value = m.time || '';
            }
        }

        fMatch.onsubmit = (e) => {
            e.preventDefault();
            const matchData = {
                competitionId: document.getElementById('m-comp').value,
                date: document.getElementById('m-date').value,
                time: document.getElementById('m-time').value
            };

            if (editingMatchId) {
                const current = State.matches.find(m => m.id === editingMatchId);
                State.updateMatch(editingMatchId, { ...matchData, status: current.status });
                alert("Actividad modificada correctamente.");
            } else {
                State.addMatch(matchData);
                alert("Actividad agendada.");
            }

            editingMatchId = null;
            render();
        };
    }
}

function renderCaptura(container) {
    const captureComps = window.sortCompetitions(State.competitions.filter(c => c.status !== 'finished'));

    container.innerHTML = `
        <div class="admin-container fade-in">
            <h1 style="margin-bottom: 30px;"><i class="fa-solid fa-edit" style="color: var(--accent-yellow)"></i> Captura de Resultados</h1>
            
            <h2 style="margin-bottom: 20px;"><i class="fa-solid fa-list-ol"></i> Evaluación por Categorías / Grupos</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
                ${captureComps.map(c => {
        const results = State.eventResults.filter(r => r.competitionId === c.id);
        const schedule = State.matches.find(m => m.competitionId === c.id);

        return `
                        <div class="card">
                            <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h4 style="color: var(--accent-yellow); margin-bottom: 5px;">${c.name}</h4>
                                    ${schedule ? `
                                        <div style="font-size: 0.65rem; color: var(--accent-blue); font-weight: 600;">
                                            <i class="fa-solid fa-calendar-day"></i> ${schedule.date || 'Sin fecha'} | <i class="fa-solid fa-clock"></i> ${schedule.time || 'Sin hora'}
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    <button class="btn btn-secondary" style="font-size: 0.6rem; padding: 4px 8px;" onclick="window.populateTeams('${c.id}')">Cargar Grupos</button>
                                    <button class="btn btn-secondary" style="font-size: 0.6rem; padding: 4px 8px;" onclick="window.addParticipant('${c.id}')">+ Participante</button>
                                    <button class="btn" style="font-size: 0.6rem; padding: 4px 8px; background: var(--success); color: black;" onclick="window.finishComp('${c.id}')"><i class="fa-solid fa-circle-check"></i> Finalizar</button>
                                </div>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 10px;">
                                <i class="fa-solid fa-star"></i> PUNTUACIÓN DE EVALUACIÓN (0 a 100 Pts)
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${results.map(r => {
            const team = State.teams.find(t => t.id === r.teamId);
            const isEntryTeamOnly = !r.participantName;
            return `
                                        <div style="display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; border-left: 3px solid ${window.translateColor(team?.color || '#333')};">
                                            <div style="flex: 1;">
                                                ${isEntryTeamOnly ? `
                                                    <div style="font-weight: 700; font-size: 0.9rem; color: var(--accent-blue);">${team?.name || '---'}</div>
                                                    <div style="font-size: 0.6rem; color: var(--text-muted);">Puntuación Grupal</div>
                                                ` : `
                                                    <input type="text" value="${r.participantName}" placeholder="Nombre" 
                                                        onchange="window.updateName('${c.id}', '${r.teamId}', '${r.participantName}', this.value)" 
                                                        style="background: transparent; border: none; font-size: 0.85rem; width: 100%; padding: 0; font-weight: 600; color: white;">
                                                    <div style="font-size: 0.65rem; color: var(--text-muted);">${team?.name || '---'}</div>
                                                `}
                                            </div>
                                            <input type="text" value="${r.value}" placeholder="0" 
                                                onchange="window.saveEventValue('${c.id}', '${r.teamId}', '${r.participantName}', this.value)" 
                                                style="width: 80px; text-align: right; background: rgba(0,0,0,0.5); border: 1px solid var(--border-glass); border-radius: 6px; padding: 6px; font-family: monospace; color: ${r.dq ? '#ff4b2b' : 'var(--accent-yellow)'}; font-weight: 700; ${r.dq ? 'text-decoration: line-through;' : ''}">
                                            <i class="fa-solid fa-ban" 
                                                style="cursor: pointer; color: ${r.dq ? '#ff4b2b' : 'var(--text-muted)'}; font-size: 0.9rem;" 
                                                title="Descalificar"
                                                onclick="window.toggleDQ('${c.id}', '${r.teamId}', '${r.participantName}')"></i>
                                            <i class="fa-solid fa-medal ${r.advanced && !r.dq ? 'pulse' : ''}" 
                                                style="cursor: pointer; color: ${r.advanced && !r.dq ? 'var(--accent-yellow)' : 'var(--text-muted)'}; font-size: 1rem; opacity: ${r.dq ? '0.2' : '1'}" 
                                                title="Destacado / Mención"
                                                onclick="if(!'${r.dq}') window.toggleQualifier('${c.id}', '${r.teamId}', '${r.participantName}')"></i>
                                            <i class="fa-solid fa-times" onclick="window.removeEntry('${c.id}', '${r.teamId}', '${r.participantName}')" style="cursor: pointer; color: #ff4b2b; font-size: 0.75rem; opacity: 0.5;"></i>
                                        </div>
                                    `;
        }).join('') || '<p style="font-size: 0.7rem; color: var(--text-muted); text-align: center; padding: 20px;">Pulsa "Cargar Grupos" para registrar por grupo o "+ Participante" para personas específicas.</p>'}
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>

            <!-- CONTROL DE DISCIPLINA -->
            <div class="card" style="margin-top: 50px; border: 1px solid rgba(255, 75, 43, 0.2); background: rgba(255, 75, 43, 0.02);">
                <h3 style="color: #ff4b2b; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Control de Disciplina (Amonestaciones)
                </h3>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 20px;">
                    Cada 3 amonestaciones acumuladas restan automáticamente 5 puntos de la tabla general.
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">
                    ${State.teams.sort((a, b) => a.name.localeCompare(b.name)).map(t => {
        const penalties = Math.floor((t.amonestaciones || 0) / 3) * 5;
        return `
                            <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${window.translateColor(t.color)}">
                                <div>
                                    <div style="font-weight: 700; font-size: 0.9rem;">${t.name}</div>
                                    <div style="font-size: 0.8rem; color: ${t.amonestaciones > 0 ? 'var(--accent-yellow)' : 'var(--text-muted)'}; font-weight: 700; margin-top: 4px;">
                                        <i class="fa-solid fa-square" style="color: #f2df0d; font-size: 0.9rem;"></i> ${t.amonestaciones || 0}
                                    </div>
                                    ${penalties > 0 ? `<div style="font-size: 0.65rem; color: #ff4b2b; font-weight: 800; margin-top: 2px;">PENALIZACIÓN: -${penalties} PTS</div>` : ''}
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    <button class="btn" style="padding: 2px 12px; font-size: 1rem; background: #ff4b2b; border: none;" onclick="State.updateAmonestaciones('${t.id}', 1)">+</button>
                                    <button class="btn btn-secondary" style="padding: 2px 12px; font-size: 1rem;" onclick="State.updateAmonestaciones('${t.id}', -1)">-</button>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// --- HELPERS GLOBALES ---

window.sortCompetitions = (list) => {
    const typeOrder = { 'calaverita': 1, 'cuentos': 2, 'catrines': 3, 'altares': 4, 'lapida': 5 };
    const ramaOrder = { 'Varonil': 1, 'Femenil': 2, 'Mixto': 3 };
    return [...list].sort((a, b) => {
        const typeA = typeOrder[a.type] || 99;
        const typeB = typeOrder[b.type] || 99;
        if (typeA !== typeB) return typeA - typeB;
        const ramaA = ramaOrder[a.category] || 99;
        const ramaB = ramaOrder[b.category] || 99;
        if (ramaA !== ramaB) return ramaA - ramaB;
        return a.name.localeCompare(b.name);
    });
};

window.translateColor = (c) => {
    if (!c) return '#333';
    const map = {
        'azul': '#0088ff', 'rojo': '#ff4b2b', 'verde': '#00ff88', 'amarillo': '#f2df0d',
        'naranja': '#ff7e33', 'morado': '#bf00ff', 'rosa': '#ff0088', 'blanco': '#ffffff',
        'gris': '#8a8f98', 'negro': '#000000', 'cian': '#00f2ff'
    };
    return map[c.toLowerCase().trim()] || c;
};

window.parseFlexibleValue = (val) => {
    if (!val || val === '0' || val === '') return 0;
    if (typeof val === 'number') return val;
    const sVal = String(val).trim();
    if (sVal.includes(':')) {
        const parts = sVal.split(':');
        return (parseInt(parts[0]) * 60) + (parseFloat(parts[1] || 0));
    }
    return parseFloat(sVal) || 0;
};

window.loginAdmin = () => {
    if (document.getElementById('m-login')) return;
    const m = document.createElement('div');
    m.id = 'm-login';
    m.className = 'modal-overlay';
    m.innerHTML = `
        <div class="modal-content" style="width: 300px;">
            <h3 style="color: var(--accent-yellow); margin-bottom: 20px;">ACCESO ADMIN</h3>
            <input type="password" id="p-pass" placeholder="••••" style="text-align: center; font-size: 1.5rem; letter-spacing: 5px; width: 100%; margin-bottom: 20px;" autofocus onkeydown="if(event.key==='Enter') window.verifyLogin()">
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" onclick="document.getElementById('m-login').remove()" style="flex: 1;">Cancelar</button>
                <button class="btn" onclick="window.verifyLogin()" style="flex: 1;">Entrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(m);
    setTimeout(() => document.getElementById('p-pass').focus(), 100);
};

window.verifyLogin = () => {
    const p = document.getElementById('p-pass');
    if (p.value === '1234q') {
        const btn = document.querySelector('#m-login .btn:not(.btn-secondary)');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
        if (State.isCloudEnabled && typeof firebase !== 'undefined') {
            firebase.auth().signInWithEmailAndPassword('admin@chapala.udg.mx', p.value + '6')
                .then(() => {
                    State.setAdmin(true);
                    const modal = document.getElementById('m-login');
                    if (modal) modal.remove();
                })
                .catch(err => {
                    console.error("Firebase auth error:", err);
                    alert("Error de autenticación en la nube: " + err.message + "\n\nSe iniciará en modo local / sin conexión.");
                    State.setAdmin(true);
                    const modal = document.getElementById('m-login');
                    if (modal) modal.remove();
                });
        } else {
            State.setAdmin(true);
            const modal = document.getElementById('m-login');
            if (modal) modal.remove();
        }
    } else {
        alert("Clave incorrecta.");
        p.value = ''; p.focus();
    }
};

window.logoutAdmin = () => {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().catch(err => console.log("SignOut error:", err));
    }
    State.setAdmin(false);
    State.currentView = 'dashboard';
    render();
};

window.toggleAuth = () => State.isAdmin ? window.logoutAdmin() : window.loginAdmin();

window.reopenComp = (id) => {
    if (confirm("¿Reabrir esta competencia para hacer correcciones? Volverá a aparecer en la pestaña de Captura.")) {
        State.reopenCompetition(id);
        render();
    }
};

window.finishComp = (id) => {
    if (confirm("¿Finalizar esta competencia? Ya no aparecerá en la lista de captura ni en próximos eventos.")) {
        State.finishCompetition(id);
    }
};

window.resetTournament = () => {
    if (confirm("¿ESTÁS SEGURO? Se borrará TODO permanentemente de la nube y local y el torneo volverá a ceros con los equipos base.")) {
        State.clearAll();
    }
};

window.populateTeams = (compId) => {
    if (confirm("¿Cargar todos los grupos registrados para esta competencia?")) {
        State.teams.forEach(team => {
            // Solo añadir si no existe ya un registro para ese grupo sin nombre de participante
            const exists = State.eventResults.find(r => r.competitionId === compId && r.teamId === team.id && !r.participantName);
            if (!exists) {
                State.submitEventResult(compId, team.id, "", "0");
            }
        });
        alert("Grupos cargados.");
    }
};

window.addParticipant = (compId) => {
    const tNum = prompt("Selecciona grupo (Número):\n" + State.teams.map((t, i) => `${i + 1}. ${t.name}`).join('\n'));
    if (tNum) {
        const team = State.teams[parseInt(tNum) - 1];
        if (team) {
            const name = prompt("Nombre del participante (o deja vacío):") || "";
            State.submitEventResult(compId, team.id, name, "0");
        } else {
            alert("Grupo inválido.");
        }
    }
};

window.saveEventValue = (compId, teamId, pName, val) => {
    const res = State.eventResults.find(r => r.competitionId === compId && r.teamId === teamId && r.participantName === pName);
    State.submitEventResult(compId, teamId, pName, val, res ? res.dq : false);
};

window.toggleDQ = (compId, teamId, pName) => {
    const res = State.eventResults.find(r => r.competitionId === compId && r.teamId === teamId && r.participantName === pName);
    if (res) {
        State.submitEventResult(compId, teamId, pName, res.value, !res.dq);
    }
};

window.toggleQualifier = (compId, teamId, pName) => {
    const res = State.eventResults.find(r => r.competitionId === compId && r.teamId === teamId && r.participantName === pName);
    if (res) {
        res.advanced = !res.advanced;
        State.save();
        State.notify();
    }
};

window.removeEntry = (compId, teamId, pName) => {
    if (confirm("¿Borrar este registro permanentemente?")) {
        State.removeEventResult(compId, teamId, pName);
    }
};

window.updateName = (compId, teamId, oldName, newName) => {
    const res = State.eventResults.find(r => r.competitionId === compId && r.teamId === teamId && r.participantName === oldName);
    if (res) {
        res.participantName = newName;
        State.save();
        render(); // Re-renderizamos para actualizar las referencias en los botones de borrar
    }
};

window.printQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>QR Pizarra Pública - Festival Vida y Muerte 2026</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                    body { font-family: 'Outfit', sans-serif; text-align: center; padding: 50px; color: #1a1c23; }
                    .container { border: 10px solid #00ff88; padding: 40px; border-radius: 30px; max-width: 600px; margin: 0 auto; }
                    h1 { color: #00f2ff; font-size: 2.5rem; margin-bottom: 10px; text-transform: uppercase; font-weight: 900; }
                    h2 { font-size: 1.5rem; margin-bottom: 30px; color: #555; }
                    .qr-box { background: #fff; padding: 20px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 20px; margin: 20px 0; }
                    .footer { margin-top: 40px; font-weight: 700; color: #00ff88; font-size: 1.2rem; }
                    .desc { font-size: 1.1rem; color: #666; margin: 20px 0; line-height: 1.5; }
                    @media print { .btn-print { display: none; } }
                    .btn-print { background: #00ff88; border: none; padding: 10px 20px; font-weight: 700; cursor: pointer; border-radius: 10px; margin-top: 20px; color: black; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>FESTIVAL DE VIDA Y MUERTE 2026</h1>
                    <h2>PREPA CHAPALA</h2>
                    <p class="desc">Sigue todas las actividades, evaluaciones y tabla de posiciones en tiempo real escaneando este código:</p>
                    <div class="qr-box">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https%3A%2F%2Fwww.prepachapala.edu.mx%2F" width="300">
                    </div>
                    <div class="footer">prepachapala.edu.mx</div>
                    <button class="btn-print" onclick="window.print()">IMPRIMIR AHORA</button>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
};

function renderReport(container) {
    const teamsSorted = [...State.teams].sort((a, b) => b.totalPoints - a.totalPoints);

    container.innerHTML = `
        <div class="admin-container fade-in">
            <h1 style="margin-bottom: 20px;"><i class="fa-solid fa-file-invoice" style="color: var(--accent-yellow)"></i> Auditoría de Resultados</h1>
            <p style="color: var(--text-muted); margin-bottom: 40px;">Desglose oficial de puntos obtenidos por grupo y disciplina.</p>

            <div style="display: flex; flex-direction: column; gap: 40px;">
                ${teamsSorted.map(team => {
        const penalties = Math.floor((team.amonestaciones || 0) / 3) * 5;
        return `
                        <div class="card" style="border-left: 8px solid ${window.translateColor(team.color)};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
                                <h2 style="margin:0; font-size: 1.8rem; color: white;">${team.name}</h2>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Total Acumulado</div>
                                    <div style="font-size: 2rem; font-weight: 900; color: var(--accent-blue);">${team.totalPoints} <span style="font-size: 1rem;">pts</span></div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                                ${['calaverita', 'cuentos', 'catrines', 'altares', 'lapida'].map(type => {
            const icon = type === 'calaverita' ? 'skull' : (type === 'cuentos' ? 'book' : (type === 'catrines' ? 'mask' : (type === 'altares' ? 'fire' : 'palette')));
            const compsOfType = State.competitions.filter(c => c.type === type);

            return `
                                        <div>
                                            <h4 style="text-transform: uppercase; color: var(--accent-yellow); margin-bottom: 15px; border-bottom: 2px solid var(--accent-blue); display: inline-block;">
                                                <i class="fa-solid fa-${icon}"></i> ${type}
                                            </h4>
                                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                                ${renderTeamDetails(team.id, compsOfType)}
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                                
                                <div>
                                    <h4 style="text-transform: uppercase; color: #ff4b2b; margin-bottom: 15px; border-bottom: 2px solid #ff4b2b; display: inline-block;">
                                        <i class="fa-solid fa-triangle-exclamation"></i> Penalizaciones
                                    </h4>
                                    <div style="background: rgba(255, 75, 43, 0.1); padding: 10px; border-radius: 8px;">
                                        <div style="display: flex; justify-content: space-between;">
                                            <span>Amonestaciones (${team.amonestaciones || 0})</span>
                                            <span style="color: #ff4b2b; font-weight: 800;">-${penalties} pts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

function renderTeamDetails(teamId, competitions) {
    const details = [];
    const parseVal = (val) => {
        if (!val || val === '0') return 0;
        if (typeof val === 'number') return val;
        const sVal = String(val).trim();
        if (sVal.includes(':')) {
            const parts = sVal.split(':');
            return (parseInt(parts[0]) * 60) + (parseFloat(parts[1] || 0));
        }
        return parseFloat(sVal) || 0;
    };

    competitions.forEach(comp => {
        let points = 0;
        let pos = 0;

        const results = State.eventResults
            .filter(r => r.competitionId === comp.id && !r.dq && r.value)
            .sort((a, b) => {
                const vA = parseVal(a.value); const vB = parseVal(b.value);
                return vB - vA; // Todos son formato ranking en el Festival cultural
            });

        let lastValue = null;
        let densePos = 0;
        let teamPositions = [];
        results.forEach((res, idx) => {
            const currentVal = parseVal(res.value);
            if (currentVal !== lastValue) densePos++;
            if (res.teamId === teamId) {
                points += State.pointTable[densePos - 1] || 0;
                teamPositions.push(densePos);
            }
            lastValue = currentVal;
        });
        pos = teamPositions;

        if (points > 0) {
            const posDisplay = Array.isArray(pos) ? pos.join('°, ') + '°' : pos + '°';
            details.push(`
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px;">
                    <span style="color: var(--text-muted); flex: 1;">${comp.name} <br> <span style="color: var(--accent-yellow); font-size: 0.75rem;">Posiciones: ${posDisplay}</span></span>
                    <span style="font-weight: 700; color: var(--accent-blue); align-self: center;">+${points}</span>
                </div>
            `);
        }
    });

    return details.join('') || '<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Sin puntos en esta categoría.</div>';
}
