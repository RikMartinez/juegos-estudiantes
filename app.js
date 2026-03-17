/**
 * APP LOGIC V2.0
 * Vista y controladores limpios.
 */

let editingTeamId = null;
let editingMatchId = null;

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
    const recent = State.matches.filter(m => m.status === 'finished').slice(-5);

    if (recent.length > 0) {
        tCont.innerHTML = recent.map(m => {
            const comp = State.competitions.find(c => c.id === m.competitionId);
            return `<div class="ticker__item">
                <i class="fa-solid fa-trophy"></i> ${comp?.name || '---'}: 
                ${m.player1Name || '---'} (${m.team1Score}) vs ${m.player2Name || '---'} (${m.team2Score})
            </div>`;
        }).join('');
    } else {
        tCont.innerHTML = `<div class="ticker__item">¡Bienvenidos a Los Juegos de los Estudiantes! - Sigue los resultados en vivo aquí.</div>`;
    }
}

// --- VISTAS ---

function renderDashboard(container) {
    const competitions = State.competitions || [];
    if (!State.selectedDashboardComp && competitions.length > 0) {
        State.selectedDashboardComp = competitions[0].id;
    }

    const selectedComp = competitions.find(c => c.id === State.selectedDashboardComp);

    container.innerHTML = `
        <div class="dashboard-public fade-in">
            <section class="bracket-container" style="position: relative;">
                <div class="bracket-header">
                    <div>
                        <h2><i class="${selectedComp?.format === 'bracket' ? 'fa-solid fa-sitemap' : 'fa-solid fa-list-ol'}" style="color: var(--accent-yellow)"></i> ${selectedComp?.format === 'bracket' ? 'LLAVES DEL TORNEO' : 'RESULTADOS Y POSICIONES'}</h2>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">${selectedComp?.format === 'bracket' ? 'Progreso en tiempo real' : 'Marcas y tiempos oficiales'}</p>
                    </div>
                    <div class="comp-selector">
                        <select onchange="State.selectedDashboardComp = this.value; render();" style="background: rgba(242,223,13,0.1); border: 1px solid var(--accent-yellow); color: white; padding: 8px; border-radius: 8px; cursor: pointer;">
                            ${competitions.map(c => `<option value="${c.id}" ${c.id === State.selectedDashboardComp ? 'selected' : ''}>${c.name} (${c.category})</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 20px; color: var(--accent-blue); font-weight: bold; text-transform: uppercase;">
                    ${selectedComp ? `${selectedComp.name} - RAMA: ${selectedComp.category.toUpperCase()}` : 'Sin disciplinas'}
                </div>

                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; pointer-events: none; width: 60%;">
                    <img src="logo.png" alt="" style="width: 100%; filter: grayscale(1);">
                </div>

                <div class="bracket-visual" style="position: relative; z-index: 1;">
                    ${renderBracketContent(selectedComp)}
                </div>
            </section>

            <aside class="upcoming-sidebar">
                <div class="card" style="height: 100%;">
                    <h3><i class="fa-solid fa-calendar-alt"></i> Próximos Encuentros</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px; max-height: 300px; overflow-y: auto;" class="custom-scroll">
                        ${State.matches.filter(m => m.status !== 'finished').map(m => {
        const comp = State.competitions.find(c => c.id === m.competitionId);
        const t1 = State.teams.find(t => t.id === m.team1Id);
        const t2 = State.teams.find(t => t.id === m.team2Id);
        return `
                                <div class="item-row" style="flex-direction: column; align-items: flex-start;">
                                    <div style="font-size: 0.7rem; color: var(--accent-blue);">${comp?.name || '---'} ${m.round && m.round !== 'N/A' ? `- ${m.round.toUpperCase()}` : ''}</div>
                                    <div style="font-weight: 600; font-size: 0.9rem; width: 100%; display: flex; justify-content: space-between;">
                                        <span>
                                            ${(m.player1Name || t1?.name) ? 
                                                `${m.player1Name || t1?.name || '?'} vs ${m.player2Name || t2?.name || '?'}` : 
                                                '<span style="color: var(--accent-yellow)"><i class="fa-solid fa-users"></i> Todos los equipos</span>'
                                            }
                                        </span>
                                        <span style="font-size: 0.7rem; color: var(--text-muted);">${m.time}</span>
                                    </div>
                                    ${m.date ? `<div style="font-size: 0.6rem; color: var(--text-muted); opacity: 0.7;">${m.date}</div>` : ''}
                                </div>
                            `;
    }).join('') || '<p style="color: var(--text-muted); font-size: 0.8rem;">No hay partidos pendientes.</p>'}
                    </div>

                    <h3 style="margin-top: 40px;"><i class="fa-solid fa-star" style="color: var(--accent-yellow)"></i> MEDALLERO GENERAL</h3>
                    <div style="margin-top: 20px; max-height: 400px; overflow-y: auto;" class="custom-scroll">
                        ${[...State.teams].sort((a, b) => b.totalPoints - a.totalPoints).map((t, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                                <span style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 0.7rem; color: var(--text-muted); width: 15px;">${idx + 1}°</span>
                                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${window.translateColor(t.color)};"></span>
                                    <span style="font-size: 0.95rem; font-weight: ${idx < 3 ? '700' : '400'}">${t.name}</span>
                                </span>
                                <span style="font-family: 'Outfit'; font-weight: 800; color: var(--accent-yellow);">${t.totalPoints} <small style="font-size: 0.6rem; opacity: 0.5;">PTS</small></span>
                            </div>
                        `).join('') || '<p>No hay equipos registrados.</p>'}
                    </div>
                </div>
            </aside>
        </div>
    `;
}

function renderBracketContent(comp) {
    if (!comp) return '';
    const isBracket = comp.format === 'bracket';

    if (isBracket) {
        const rounds = [];
        const has16 = State.matches.some(m => m.competitionId === comp.id && m.round === 'dieciseisavos');
        if (has16) rounds.push({ id: 'dieciseisavos', label: '16avos', count: 16 });
        rounds.push({ id: 'octavos', label: 'Octavos', count: 8 });
        rounds.push({ id: 'cuartos', label: 'Cuartos', count: 4 });
        rounds.push({ id: 'semifinal', label: 'Semifinal', count: 2 });
        rounds.push({ id: 'final', label: 'Gran Final', count: 1 });

        return rounds.map(r => `
            <div class="bracket-column">
                <div class="column-title">${r.label}</div>
                <div class="bracket-column-body">
                    ${Array.from({ length: r.count }, (_, i) => i + 1).map(n => renderBracketBox(comp.id, r.id, n)).join('')}
                </div>
            </div>
        `).join('');
    } else {
        // Vista Ranking/Carrera
        const results = State.eventResults.filter(r => r.competitionId === comp.id && r.value !== '' && r.value !== '0')
            .sort((a, b) => {
                const vA = window.parseFlexibleValue(a.value);
                const vB = window.parseFlexibleValue(b.value);
                if (comp.format === 'ranking') return vB - vA; // Puntos: Más es mejor
                return vA - vB; // Carrera: Menos es mejor
            });

        return `
            <div style="width: 100%; max-width: 800px; margin: 0 auto; min-height: 400px;">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0 10px;">
                    <thead>
                        <tr style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">
                            <th style="padding: 10px; width: 60px;">Pos</th>
                            <th style="padding: 10px; text-align: left;">Participante / Equipo</th>
                            <th style="padding: 10px; text-align: right;">${comp.format === 'ranking' ? 'Puntos' : 'Tiempo'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map((res, idx) => {
            const team = State.teams.find(t => t.id === res.teamId);
            return `
                                <tr style="background: rgba(255,255,255,0.03);">
                                    <td style="padding: 15px; text-align: center; font-weight: 900; color: ${idx < 3 ? 'var(--accent-yellow)' : 'var(--text-muted)'}; font-size: 1.2rem;">${idx + 1}°</td>
                                    <td style="padding: 15px;">
                                        <div style="display: flex; align-items: center; gap: 15px;">
                                            <span style="width: 4px; height: 25px; background: ${window.translateColor(team?.color)};"></span>
                                            <div>
                                                ${res.participantName ? `
                                                    <div style="font-weight: 700;">${res.participantName}</div>
                                                    <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">${team?.name || '---'}</div>
                                                ` : `
                                                    <div style="font-weight: 700; color: var(--accent-blue); font-size: 1.1rem;">${team?.name || '---'}</div>
                                                `}
                                                ${res.advanced ? '<span class="pulse" style="font-size:0.6rem; color: var(--success); font-weight: 800;"><i class="fa-solid fa-check"></i> CALIFICA</span>' : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 15px; text-align: right; font-family: 'Outfit'; font-weight: 800; font-size: 1.1rem; color: var(--accent-blue);">${res.value}</td>
                                </tr>
                            `;
        }).join('') || '<tr><td colspan="3" style="text-align: center; padding: 40px; color: var(--text-muted);">Sin resultados</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }
}

function renderBracketBox(compId, round, num) {
    const match = State.matches.find(m => m.competitionId === compId && m.round === round && parseInt(m.matchNum) === num);
    const t1 = State.teams.find(t => t.id === match?.team1Id);
    const t2 = State.teams.find(t => t.id === match?.team2Id);

    const s1 = match?.team1Score || 0;
    const s2 = match?.team2Score || 0;
    const isFinished = match?.status === 'finished';

    return `
        <div class="bracket-match" style="border: 1px solid ${match?.status === 'in-progress' ? 'var(--accent-blue)' : 'var(--border-glass)'};">
            <div style="font-size: 0.55rem; color: var(--text-muted); margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">${round === 'final' ? 'FINAL' : 'P' + num}</div>
            <div class="team-row ${isFinished && s1 > s2 ? 'winner' : ''}">
                <span style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
                    <span style="width: 3px; height: 14px; background: ${window.translateColor(t1?.color || '#333')}; flex-shrink: 0;"></span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; font-weight: 500;">${match?.player1Name || t1?.name || 'PENDIENTE'}</span>
                </span>
                <span class="score">${s1}</span>
            </div>
            <div class="team-row ${isFinished && s2 > s1 ? 'winner' : ''}">
                <span style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
                    <span style="width: 3px; height: 14px; background: ${window.translateColor(t2?.color || '#333')}; flex-shrink: 0;"></span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; font-weight: 500;">${match?.player2Name || t2?.name || 'PENDIENTE'}</span>
                </span>
                <span class="score">${s2}</span>
            </div>
            ${match?.status === 'in-progress' ? '<div style="position: absolute; top: -5px; right: -5px; font-size: 0.5rem; background: var(--accent-blue); color: black; padding: 2px 4px; border-radius: 4px; font-weight: 800; animation: pulse 1s infinite;">LIVE</div>' : ''}
        </div>
    `;
}

function renderAdmin(container) {
    container.innerHTML = `
        <div class="admin-container fade-in">
            <h1 style="margin-bottom: 40px; font-family: var(--font-heading);"><i class="fa-solid fa-gears" style="color: var(--accent-yellow)"></i> Configuración</h1>
            <div class="admin-grid">
                <div class="card">
                    <h3><i class="fa-solid fa-users"></i> Equipos (${State.teams.length})</h3>
                    <form id="form-team" style="margin-top: 20px;">
                        <input type="text" id="t-name" placeholder="Nombre Equipo" required value="${editingTeamId ? State.teams.find(t => t.id === editingTeamId)?.name : ''}" style="margin-bottom: 10px;">
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
                        <input type="text" id="c-name" placeholder="Nombre (ej. Futbol)" required style="margin-bottom: 10px;">
                        <select id="c-type" style="margin-bottom: 10px;">
                            <option value="deportiva">Deportiva</option>
                            <option value="mental">Mental</option>
                            <option value="atletismo">Atletismo</option>
                        </select>
                        <select id="c-format" style="margin-bottom: 10px;">
                            <option value="bracket">Llaves (1 vs 1)</option>
                            <option value="ranking">Ranking (Puntos)</option>
                            <option value="race">Carrera (Tiempos)</option>
                        </select>
                        <select id="c-rama" style="margin-bottom: 15px;">
                            <option value="Varonil">Varonil</option>
                            <option value="Femenil">Femenil</option>
                            <option value="Mixto">Mixto</option>
                        </select>
                        <button type="submit" class="btn" style="width: 100%;">Añadir</button>
                    </form>
                    <div class="item-list" style="margin-top: 20px; max-height: 250px; overflow-y: auto;">
                        ${State.competitions.map(c => `
                            <div class="item-row">
                                <div>
                                    <div style="font-weight: 600;">${c.name}</div>
                                    <div style="font-size: 0.6rem; color: var(--accent-yellow)">RAMA: ${c.category.toUpperCase()} | ${c.type.toUpperCase()}</div>
                                </div>
                                <i class="fa-solid fa-trash" onclick="if(confirm('¿Borrar?')) {State.competitions=State.competitions.filter(it=>it.id!=='${c.id}'); State.save(); State.notify();}" style="cursor: pointer; color: var(--text-muted);"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 30px;">
                <h3><i class="fa-solid fa-calendar-plus"></i> Programar Eventos / Partidos</h3>
                <form id="form-match" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                    <div><label>Disciplina</label><select id="m-comp" onchange="window.toggleMatchFields()">${State.competitions.map(c => `<option value="${c.id}">${c.name}${c.category && c.category.toLowerCase() !== 'mixto' ? ' (' + c.category + ')' : ''}</option>`).join('')}</select></div>
                    <div class="bracket-only"><label>Ronda</label><select id="m-round"><option value="N/A">---</option><option value="dieciseisavos">16avos</option><option value="octavos">Octavos</option><option value="cuartos">Cuartos</option><option value="semifinal">Semifinal</option><option value="final">Final</option></select></div>
                    <div class="bracket-only"><label># Partido</label><select id="m-num"><option value="0">---</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(n => `<option>${n}</option>`).join('')}</select></div>
                    <div class="bracket-only"><label>Equipo 1</label><select id="m-t1"><option value="">Ninguno / General</option>${State.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
                    <div class="bracket-only"><label>Sujeto 1 (Opcional)</label><input type="text" id="m-p1" placeholder="Nombre"></div>
                    <div class="bracket-only"><label>Equipo 2</label><select id="m-t2"><option value="">Ninguno / General</option>${State.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
                    <div class="bracket-only"><label>Sujeto 2 (Opcional)</label><input type="text" id="m-p2" placeholder="Nombre"></div>
                    <div><label>Fecha</label><input type="date" id="m-date"></div>
                    <div><label>Hora / Lugar</label><input type="text" id="m-time" placeholder="10:00 - Cancha 1"></div>
                    <div style="display: flex; gap: 10px; margin-top: 20px; grid-column: 1 / -1;">
                        <button id="btn-submit-match" type="submit" class="btn">${editingMatchId ? 'Guardar Cambios' : 'Agendar'}</button>
                        ${editingMatchId ? `<button type="button" class="btn btn-secondary" onclick="editingMatchId=null; render();">Cancelar</button>` : ''}
                    </div>
                </form>

                <div class="item-list" style="margin-top: 40px; max-height: 400px; overflow-y: auto;">
                    <h4 style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Partidos Agendados</h4>
                    ${State.matches.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.8rem;">No hay partidos programados.</p>' :
            State.matches.sort((a, b) => a.round.localeCompare(b.round)).map(m => {
                const c = State.competitions.find(it => it.id === m.competitionId);
                const t1 = State.teams.find(it => it.id === m.team1Id);
                const t2 = State.teams.find(it => it.id === m.team2Id);
                return `
                                <div class="item-row" style="padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.03);">
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.75rem; color: var(--accent-yellow); font-weight: 800;">
                                            ${c?.name || '---'} ${m.round && m.round !== 'N/A' ? `- ${m.round.toUpperCase()}` : ''}
                                        </div>
                                        <div style="font-size: 0.95rem; font-weight: 600;">
                                            ${(m.player1Name || t1?.name) ? 
                                                `${m.player1Name || t1?.name || '?'} vs ${m.player2Name || t2?.name || '?'}` : 
                                                'Evento General'
                                            }
                                        </div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted);">${m.date || 'Sin fecha'} | ${m.time}</div>
                                    </div>
                                    <div style="display: flex; gap: 15px;">
                                        <i class="fa-solid fa-edit" onclick="editingMatchId='${m.id}'; render(); document.getElementById('form-match').scrollIntoView({behavior: 'smooth'});" style="cursor: pointer; color: var(--accent-blue);"></i>
                                        <i class="fa-solid fa-trash" onclick="if(confirm('¿Borrar partido?')) {State.matches=State.matches.filter(it=>it.id!=='${m.id}'); State.save(); State.notify();}" style="cursor: pointer; color: var(--text-muted);"></i>
                                    </div>
                                </div>
                            `;
            }).join('')
        }
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
        // Ejecutar toggle al cargar para setear estado inicial
        window.toggleMatchFields();

        if (editingMatchId) {
            const m = State.matches.find(m => m.id === editingMatchId);
            if (m) {
                document.getElementById('m-comp').value = m.competitionId;
                window.toggleMatchFields(); // Update vis based on selected comp
                document.getElementById('m-round').value = m.round;
                document.getElementById('m-num').value = m.matchNum;
                document.getElementById('m-t1').value = m.team1Id;
                document.getElementById('m-p1').value = m.player1Name || '';
                document.getElementById('m-t2').value = m.team2Id;
                document.getElementById('m-p2').value = m.player2Name || '';
                document.getElementById('m-date').value = m.date || '';
                document.getElementById('m-time').value = m.time || '';
            }
        }

        fMatch.onsubmit = (e) => {
            e.preventDefault();
            const matchData = {
                competitionId: document.getElementById('m-comp').value,
                round: document.getElementById('m-round').value,
                matchNum: document.getElementById('m-num').value,
                team1Id: document.getElementById('m-t1').value,
                team1Score: 0,
                team2Id: document.getElementById('m-t2').value,
                team2Score: 0,
                player1Name: document.getElementById('m-p1').value,
                player2Name: document.getElementById('m-p2').value,
                date: document.getElementById('m-date').value,
                time: document.getElementById('m-time').value,
                location: ''
            };

            if (editingMatchId) {
                State.updateMatch(editingMatchId, matchData);
                alert("Evento modificado correctamente.");
            } else {
                State.addMatch(matchData);
                alert("Evento agendado.");
            }
            
            editingMatchId = null;
            render();
        };
    }
}

window.toggleMatchFields = () => {
    const compId = document.getElementById('m-comp')?.value;
    const comp = State.competitions.find(c => c.id === compId);
    const bracketFields = document.querySelectorAll('.bracket-only');
    
    if (comp && comp.format !== 'bracket') {
        bracketFields.forEach(f => f.style.display = 'none');
    } else {
        bracketFields.forEach(f => f.style.display = 'block');
    }
};

function renderCaptura(container) {
    const activeMatches = State.matches.filter(m => {
        const comp = State.competitions.find(c => c.id === m.competitionId);
        return m.status !== 'finished' && comp && comp.format === 'bracket';
    });
    const rankingComps = State.competitions.filter(c => c.format !== 'bracket');

    container.innerHTML = `
        <div class="admin-container fade-in">
            <h1 style="margin-bottom: 30px;"><i class="fa-solid fa-edit" style="color: var(--accent-yellow)"></i> Captura de Resultados</h1>
            
            <h2 style="margin-bottom: 20px;">Partidos en Vivo (Bracket)</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; margin-bottom: 50px;">
                ${activeMatches.map(m => {
        const comp = State.competitions.find(c => c.id === m.competitionId);
        const t1 = State.teams.find(t => t.id === m.team1Id);
        const t2 = State.teams.find(t => t.id === m.team2Id);
        return `
                        <div class="card" style="padding: 20px;">
                            <div style="font-size: 0.7rem; color: var(--accent-blue); margin-bottom: 10px;">${comp?.name || '---'} | ${m.round.toUpperCase()}</div>
                            <div class="item-row">
                            <div class="item-row">
                                <span style="flex: 1;">${m.player1Name || t1?.name || 'TBD'}</span>
                                <input type="number" id="s1-${m.id}" value="${m.team1Score}" onchange="window.syncScore('${m.id}', 1, this.value)" style="width: 50px; text-align: center;">
                                <label style="font-size: 0.65rem; color: var(--text-muted); cursor: pointer;"><input type="checkbox" id="dq1-${m.id}" ${m.team1DQ ? 'checked' : ''} onchange="window.syncScore('${m.id}', 1, document.getElementById('s1-${m.id}').value)"> DQ</label>
                            </div>
                            <div class="item-row">
                                <span style="flex: 1;">${m.player2Name || t2?.name || 'TBD'}</span>
                                <input type="number" id="s2-${m.id}" value="${m.team2Score}" onchange="window.syncScore('${m.id}', 2, this.value)" style="width: 50px; text-align: center;">
                                <label style="font-size: 0.65rem; color: var(--text-muted); cursor: pointer;"><input type="checkbox" id="dq2-${m.id}" ${m.team2DQ ? 'checked' : ''} onchange="window.syncScore('${m.id}', 2, document.getElementById('s2-${m.id}').value)"> DQ</label>
                            </div>
                            <button class="btn" onclick="window.finishMatch('${m.id}')" style="width: 100%; margin-top: 15px; background: var(--success); color: black;">FINALIZAR Y AVANZAR</button>
                        </div>
                    `;
    }).join('') || '<p style="color: var(--text-muted);">Sin partidos pendientes.</p>'}
            </div>

            <h2 style="margin-bottom: 20px;"><i class="fa-solid fa-list-ol"></i> Ranking / Carreras / Equipos</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
                ${rankingComps.map(c => {
        const results = State.eventResults.filter(r => r.competitionId === c.id);
        const schedule = State.matches.find(m => m.competitionId === c.id);

        return `
                        <div class="card">
                            <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h4 style="color: var(--accent-yellow); margin-bottom: 5px;">${c.name} (${c.rama || c.category || 'Mixto'})</h4>
                                    ${schedule ? `
                                        <div style="font-size: 0.65rem; color: var(--accent-blue); font-weight: 600;">
                                            <i class="fa-solid fa-calendar-day"></i> ${schedule.date || 'Sin fecha'} | <i class="fa-solid fa-clock"></i> ${schedule.time || 'Sin hora'}
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    <button class="btn btn-secondary" style="font-size: 0.6rem; padding: 4px 8px;" onclick="window.populateTeams('${c.id}')">Cargar Equipos</button>
                                    <button class="btn btn-secondary" style="font-size: 0.6rem; padding: 4px 8px;" onclick="window.addParticipant('${c.id}')">+ Individuo</button>
                                </div>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 10px;">
                                <i class="fa-solid fa-stopwatch"></i> ${c.format === 'ranking' ? 'PUNTOS / MARCAS' : 'CRONÓMETRO (Ej. 1:20)'}
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
                                                    <div style="font-size: 0.6rem; color: var(--text-muted);">Puntuación Colectiva</div>
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
                                                title="Descalificar / Falta"
                                                onclick="window.toggleDQ('${c.id}', '${r.teamId}', '${r.participantName}')"></i>
                                            <i class="fa-solid fa-medal ${r.advanced && !r.dq ? 'pulse' : ''}" 
                                                style="cursor: pointer; color: ${r.advanced && !r.dq ? 'var(--accent-yellow)' : 'var(--text-muted)'}; font-size: 1rem; opacity: ${r.dq ? '0.2' : '1'}" 
                                                title="Marcar como Ganador/Pódium"
                                                onclick="if(!'${r.dq}') window.toggleQualifier('${c.id}', '${r.teamId}', '${r.participantName}')"></i>
                                            <i class="fa-solid fa-times" onclick="window.removeEntry('${c.id}', '${r.teamId}', '${r.participantName}')" style="cursor: pointer; color: #ff4b2b; font-size: 0.75rem; opacity: 0.5;"></i>
                                        </div>
                                    `;
        }).join('') || '<p style="font-size: 0.7rem; color: var(--text-muted); text-align: center; padding: 20px;">Pulsa "Cargar Equipos" para registrar por equipo o "+ Individuo" para personas específicas.</p>'}
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

// --- HELPERS GLOBALES ---

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
    if (p.value === '1234q') { // Nueva contraseña
        State.setAdmin(true);
        document.getElementById('m-login').remove();
    } else {
        alert("Clave incorrecta.");
        p.value = ''; p.focus();
    }
};

window.logoutAdmin = () => {
    State.setAdmin(false);
    State.currentView = 'dashboard';
    render();
};

window.toggleAuth = () => State.isAdmin ? window.logoutAdmin() : window.loginAdmin();

window.syncScore = (id, teamNum, val) => {
    const m = State.matches.find(it => it.id === id);
    if (m) {
        if (teamNum === 1) m.team1Score = parseInt(val) || 0;
        else m.team2Score = parseInt(val) || 0;
        
        m.team1DQ = document.getElementById(`dq1-${id}`)?.checked || false;
        m.team2DQ = document.getElementById(`dq2-${id}`)?.checked || false;
        
        State.save();
    }
};

window.finishMatch = (id) => {
    if (confirm("¿Finalizar encuentro? El ganador avanzará en las llaves automáticamente.")) {
        const m = State.matches.find(it => it.id === id);
        if (m) {
            const dq1 = document.getElementById(`dq1-${id}`)?.checked || false;
            const dq2 = document.getElementById(`dq2-${id}`)?.checked || false;
            State.updateMatchResult(id, m.team1Score, m.team2Score, true, dq1, dq2);
        }
    }
};

window.resetTournament = () => {
    if (confirm("¿ESTÁS SEGURO? Se borrará TODO permanentemente de la nube y local y el torneo volverá a ceros con los equipos base.")) {
        State.clearAll();
    }
};

window.populateTeams = (compId) => {
    if (confirm("¿Cargar todos los equipos registrados para esta competencia?")) {
        State.teams.forEach(team => {
            // Solo añadir si no existe ya un registro para ese equipo sin nombre de participante
            const exists = State.eventResults.find(r => r.competitionId === compId && r.teamId === team.id && !r.participantName);
            if (!exists) {
                State.submitEventResult(compId, team.id, "", "0");
            }
        });
        alert("Equipos cargados.");
    }
};

window.addParticipant = (compId) => {
    const tNum = prompt("Selecciona equipo (Número):\n" + State.teams.map((t, i) => `${i + 1}. ${t.name}`).join('\n'));
    if (tNum) {
        const team = State.teams[parseInt(tNum) - 1];
        if (team) {
            const name = prompt("Nombre del participante (o deja vacío):") || "";
            State.submitEventResult(compId, team.id, name, "0");
        } else {
            alert("Equipo inválido.");
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
                <title>QR Pizarra Pública - Prepa Chapala</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                    body { font-family: 'Outfit', sans-serif; text-align: center; padding: 50px; color: #1a1c23; }
                    .container { border: 10px solid #f2df0d; padding: 40px; border-radius: 30px; max-width: 600px; margin: 0 auto; }
                    h1 { color: #0088ff; font-size: 3rem; margin-bottom: 10px; text-transform: uppercase; font-weight: 900; }
                    h2 { font-size: 1.5rem; margin-bottom: 30px; color: #555; }
                    .qr-box { background: #fff; padding: 20px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 20px; margin: 20px 0; }
                    .footer { margin-top: 40px; font-weight: 700; color: #0088ff; font-size: 1.2rem; }
                    .desc { font-size: 1.1rem; color: #666; margin: 20px 0; line-height: 1.5; }
                    @media print { .btn-print { display: none; } }
                    .btn-print { background: #f2df0d; border: none; padding: 10px 20px; font-weight: 700; cursor: pointer; border-radius: 10px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>JUEGOS ESTUDIANTILES</h1>
                    <h2>PREPA CHAPALA</h2>
                    <p class="desc">Sigue todos los resultados, tablas de posiciones y brackets en tiempo real escaneando este código:</p>
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
