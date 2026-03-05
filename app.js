/**
 * APP LOGIC V2.0
 * Vista y controladores limpios.
 */

let editingTeamId = null;

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
                        <h2><i class="fa-solid fa-sitemap" style="color: var(--accent-yellow)"></i> LLAVES DEL TORNEO</h2>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">Progreso en tiempo real</p>
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
                                    <div style="font-size: 0.7rem; color: var(--accent-blue);">${comp?.name || '---'}</div>
                                    <div style="font-weight: 600; font-size: 0.9rem; width: 100%; display: flex; justify-content: space-between;">
                                        <span>${m.player1Name || t1?.name || 'TBD'} vs ${m.player2Name || t2?.name || 'TBD'}</span>
                                        <span style="font-size: 0.7rem; color: var(--text-muted);">${m.time}</span>
                                    </div>
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
    const hasMatches = State.matches.some(m => m.competitionId === comp.id);
    const isBracket = comp.format === 'bracket' || hasMatches;

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
        const results = State.eventResults.filter(r => r.competitionId === comp.id)
            .sort((a, b) => {
                if (comp.format === 'ranking') return (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0);
                return a.value.localeCompare(b.value);
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
                                                <div style="font-weight: 700;">${res.participantName || '---'}</div>
                                                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">${team?.name || '---'}</div>
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
                <span style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                    <span style="width: 3px; height: 12px; background: ${window.translateColor(t1?.color || '#333')};"></span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${match?.player1Name || t1?.name || 'TBD'}</span>
                </span>
                <span class="score">${s1}</span>
            </div>
            <div class="team-row ${isFinished && s2 > s1 ? 'winner' : ''}">
                <span style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                    <span style="width: 3px; height: 12px; background: ${window.translateColor(t2?.color || '#333')};"></span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${match?.player2Name || t2?.name || 'TBD'}</span>
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
                <h3><i class="fa-solid fa-calendar-plus"></i> Programar Partidos (Llaves)</h3>
                <form id="form-match" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                    <div><label>Disciplina</label><select id="m-comp">${State.competitions.filter(c => c.format === 'bracket').map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
                    <div><label>Ronda</label><select id="m-round"><option value="dieciseisavos">16avos</option><option value="octavos">Octavos</option><option value="cuartos">Cuartos</option><option value="semifinal">Semifinal</option><option value="final">Final</option></select></div>
                    <div><label># Partido</label><select id="m-num">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(n => `<option>${n}</option>`).join('')}</select></div>
                    <div><label>Equipo 1</label><select id="m-t1">${State.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
                    <div><label>Sujeto 1 (Opcional)</label><input type="text" id="m-p1" placeholder="Nombre"></div>
                    <div><label>Equipo 2</label><select id="m-t2">${State.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
                    <div><label>Sujeto 2 (Opcional)</label><input type="text" id="m-p2" placeholder="Nombre"></div>
                    <div><label>Hora / Lugar</label><input type="text" id="m-time" placeholder="10:00 - Cancha 1"></div>
                    <button type="submit" class="btn" style="margin-top: 20px;">Agendar</button>
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
                                        <div style="font-size: 0.75rem; color: var(--accent-yellow); font-weight: 800;">${c?.name || '---'} - ${m.round.toUpperCase()} (P${m.matchNum})</div>
                                        <div style="font-size: 0.95rem; font-weight: 600;">
                                            ${m.player1Name || t1?.name || '?'} vs ${m.player2Name || t2?.name || '?'}
                                        </div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted);">${m.time}</div>
                                    </div>
                                    <div style="display: flex; gap: 15px;">
                                        <i class="fa-solid fa-trash" onclick="if(confirm('¿Borrar partido?')) {State.matches=State.matches.filter(it=>it.id!=='${m.id}'); State.save(); State.notify();}" style="cursor: pointer; color: var(--text-muted);"></i>
                                    </div>
                                </div>
                            `;
            }).join('')
        }
                </div>
            </div>

            <div style="margin-top: 60px; text-align: center; opacity: 0.5;">
                <button class="btn btn-secondary" onclick="window.resetTournament()" style="background: #ff4b2b; color: white; border: none;">REINICIAR TODO EL TORNEO</button>
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
        fMatch.onsubmit = (e) => {
            e.preventDefault();
            State.addMatch({
                competitionId: document.getElementById('m-comp').value,
                round: document.getElementById('m-round').value,
                matchNum: document.getElementById('m-num').value,
                team1Id: document.getElementById('m-t1').value,
                team2Id: document.getElementById('m-t2').value,
                player1Name: document.getElementById('m-p1').value,
                player2Name: document.getElementById('m-p2').value,
                time: document.getElementById('m-time').value,
                location: ''
            });
            alert("Partido agendado.");
        };
    }
}

function renderCaptura(container) {
    const activeMatches = State.matches.filter(m => m.status !== 'finished');
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
                                <span>${m.player1Name || t1?.name || 'TBD'}</span>
                                <input type="number" value="${m.team1Score}" onchange="window.syncScore('${m.id}', 1, this.value)" style="width: 60px; text-align: center;">
                            </div>
                            <div class="item-row">
                                <span>${m.player2Name || t2?.name || 'TBD'}</span>
                                <input type="number" value="${m.team2Score}" onchange="window.syncScore('${m.id}', 2, this.value)" style="width: 60px; text-align: center;">
                            </div>
                            <button class="btn" onclick="window.finishMatch('${m.id}')" style="width: 100%; margin-top: 15px; background: var(--success); color: black;">FINALIZAR Y AVANZAR</button>
                        </div>
                    `;
    }).join('') || '<p style="color: var(--text-muted);">Sin partidos pendientes.</p>'}
            </div>

            <h2 style="margin-bottom: 20px;">Ranking / Carreras / Equipos</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
                ${rankingComps.map(c => {
        const results = State.eventResults.filter(r => r.competitionId === c.id);
        const isTeamOnly = c.type === 'deportiva' || c.type === 'atletismo';

        return `
                        <div class="card">
                            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h4 style="color: var(--accent-yellow);">${c.name} (${c.rama || c.category})</h4>
                                <button class="btn btn-secondary" style="font-size: 0.6rem; padding: 4px 8px;" onclick="window.addParticipant('${c.id}')">+ Añadir</button>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 10px;">${c.format === 'ranking' ? 'PUNTOS' : 'CRONÓMETRO'}</div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${results.map(r => {
            const team = State.teams.find(t => t.id === r.teamId);
            return `
                                        <div style="display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,0.02); padding: 5px 10px; border-radius: 8px;">
                                            <div style="flex: 1;">
                                                <input type="text" value="${r.participantName}" placeholder="Nombre" 
                                                    onchange="State.eventResults.find(it=>it===r).participantName=this.value; State.save();" 
                                                    style="background: transparent; border: none; font-size: 0.8rem; width: 100%; padding: 0;">
                                                <div style="font-size: 0.6rem; color: var(--text-muted);">${team?.name || '---'}</div>
                                            </div>
                                            <input type="text" value="${r.value}" placeholder="Valor" 
                                                onchange="window.saveEventValue('${c.id}', '${r.teamId}', '${r.participantName}', this.value)" 
                                                style="width: 80px; text-align: right; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 4px; padding: 4px;">
                                            <i class="fa-solid fa-circle-check ${r.advanced ? 'pulse' : ''}" 
                                                style="cursor: pointer; color: ${r.advanced ? 'var(--success)' : 'var(--text-muted)'}" 
                                                onclick="window.toggleQualifier('${c.id}', '${r.teamId}', '${r.participantName}')"></i>
                                            <i class="fa-solid fa-times" onclick="if(confirm('¿Borrar?')) {State.eventResults=State.eventResults.filter(it=>it!==r); State.calculatePoints(); State.save(); State.notify();}" style="cursor: pointer; color: #ff4b2b; font-size: 0.7rem;"></i>
                                        </div>
                                    `;
        }).join('') || '<p style="font-size: 0.7rem; color: var(--text-muted); text-align: center;">Pulsa + Añadir para empezar</p>'}
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
    if (p.value === '1234') { // Cambia esto si lo requieres
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
        State.save();
    }
};

window.finishMatch = (id) => {
    if (confirm("¿Finalizar encuentro? El ganador avanzará en las llaves automáticamente.")) {
        const m = State.matches.find(it => it.id === id);
        if (m) State.updateMatchResult(id, m.team1Score, m.team2Score, true);
    }
};

window.resetTournament = () => {
    if (confirm("¿ESTÁS SEGURO? Se borrará TODO permanentemente de la nube y local.")) {
        if (State.db) State.db.ref('tournament_v2').remove();
        localStorage.removeItem('estudiantes-games-v2');
        location.reload();
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
    State.submitEventResult(compId, teamId, pName, val);
};

window.toggleQualifier = (compId, teamId, pName) => {
    const res = State.eventResults.find(r => r.competitionId === compId && r.teamId === teamId && r.participantName === pName);
    if (res) {
        res.advanced = !res.advanced;
        State.save();
        State.notify();
    }
};
