document.addEventListener('DOMContentLoaded', () => {
    try {
        initApp();
    } catch (e) {
        console.error("App Init Crash:", e);
    }
});

function initApp() {
    const navItems = document.querySelectorAll('.nav-links li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            // Protección de acceso
            if ((view === 'admin' || view === 'capturar') && !State.isAdmin) {
                window.loginAdmin();
                return;
            }
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');
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

    // We don't want to wipe the ticker if it's persistent, 
    // but in index.html it's now OUTSIDE viewport.
    viewport.innerHTML = '';

    const tickerEl = document.getElementById('live-ticker');

    // Actualizar visibilidad de pestañas según rol
    const navAdmin = document.querySelector('[data-view="admin"]');
    const navCaptura = document.querySelector('[data-view="capturar"]');
    const authBtn = document.getElementById('auth-btn');

    if (State.isAdmin) {
        if (navAdmin) navAdmin.classList.remove('hidden');
        if (navCaptura) navCaptura.classList.remove('hidden');
        if (authBtn) authBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Salir';
    } else {
        if (navAdmin) navAdmin.classList.add('hidden');
        if (navCaptura) navCaptura.classList.add('hidden');
        if (authBtn) authBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Acceso';
    }

    // Actualizar indicador de nube
    const syncDot = document.querySelector('.sync-dot');
    if (syncDot) {
        syncDot.style.background = State.isCloudEnabled ? '#00ff88' : '#ff4b2b';
        syncDot.style.boxShadow = State.isCloudEnabled ? '0 0 10px #00ff88' : 'none';
    }

    try {
        // Redirección si se intenta entrar sin permiso
        if (!State.isAdmin && (State.currentView === 'admin' || State.currentView === 'capturar')) {
            State.currentView = 'dashboard';
        }

        switch (State.currentView) {
            case 'dashboard':
                if (tickerEl) tickerEl.classList.remove('hidden');
                updateTicker();
                renderDashboard(viewport);
                break;
            case 'admin':
                if (tickerEl) tickerEl.classList.add('hidden');
                renderAdmin(viewport);
                break;
            case 'capturar':
                if (tickerEl) tickerEl.classList.add('hidden');
                renderCaptura(viewport);
                break;
            default:
                renderDashboard(viewport);
        }
    } catch (err) {
        console.error("Render Error:", err);
        viewport.innerHTML = `<div style="padding: 20px; color: red;">Error al cargar la vista: ${err.message}</div>`;
    }
}

function updateTicker() {
    const tickerContainer = document.querySelector('.ticker');
    if (!tickerContainer) return;

    const finishedMatches = State.matches ? State.matches.filter(m => m.status === 'finished') : [];

    if (finishedMatches.length > 0) {
        const items = finishedMatches.map(m => {
            const t1 = State.teams.find(t => t.id === m.team1Id);
            const t2 = State.teams.find(t => t.id === m.team2Id);
            const comp = State.competitions.find(c => c.id === m.competitionId);
            return `<div class="ticker__item">${comp?.name || 'Evento'}: ${t1?.name || '---'} ${m.team1Score} - ${m.team2Score} ${t2?.name || '---'}</div>`;
        }).join('');
        tickerContainer.innerHTML = items + `<div class="ticker__item">¡Sigue la emoción en vivo!</div>`;
    } else {
        tickerContainer.innerHTML = '<div class="ticker__item">¡Bienvenidos a Los Juegos de los Estudiantes! - Esperando resultados...</div>';
    }
}

// --- VIEW RENDERING ---

function renderDashboard(container) {
    const competitions = State.competitions || [];
    // Select first competition if none selected
    if (!State.selectedDashboardComp && competitions.length > 0) {
        State.selectedDashboardComp = competitions[0].id;
    }

    const selectedComp = competitions.find(c => c.id === State.selectedDashboardComp);

    container.innerHTML = `
        <div class="dashboard-public fade-in">
            <section class="bracket-container">
                <div class="bracket-header">
                    <div>
                        <h2 style="font-family: var(--font-heading);"><i class="fa-solid fa-sitemap" style="color: var(--accent-yellow)"></i> LLAVES DEL TORNEO</h2>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Visualiza el progreso por disciplina</p>
                    </div>
                    <div class="comp-selector">
                        <select id="dash-comp-select" onchange="State.selectedDashboardComp = this.value; render();" style="background: rgba(242, 223, 13, 0.1); border: 1px solid var(--accent-yellow); color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer;">
                            ${competitions.map(c => `<option value="${c.id}" ${c.id === State.selectedDashboardComp ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div style="text-align: center; margin-bottom: 20px; color: var(--accent-blue); font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                    ${selectedComp ? selectedComp.name : 'Selecciona una competencia'}
                </div>

                <div class="bracket-visual" style="padding-top: 20px;">
                    <!-- Columna Octavos -->
                    <div class="bracket-column" style="gap: 15px;">
                        ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => renderBracketMatch(`Octavos ${n}`, 'octavos', n)).join('')}
                    </div>
                    
                    <!-- Columna Cuartos -->
                    <div class="bracket-column" style="gap: 40px; justify-content: space-around;">
                        ${[1, 2, 3, 4].map(n => renderBracketMatch(`Cuartos ${n}`, 'cuartos', n)).join('')}
                    </div>
                    
                    <!-- Columna Semis -->
                    <div class="bracket-column" style="gap: 80px; justify-content: center;">
                        ${[1, 2].map(n => renderBracketMatch(`Semis ${n}`, 'semifinal', n)).join('')}
                    </div>
                    
                    <!-- Columna Final -->
                    <div class="bracket-column" style="justify-content: center;">
                        ${renderBracketMatch('Gran Final', 'final', 1)}
                    </div>
                </div>
                
                <div style="margin-top: auto; padding-top: 20px; text-align: center;">
                    <span style="font-size: 0.7rem; color: var(--text-muted); padding: 5px 15px; border: 1px dashed var(--border-glass); border-radius: 20px;">
                        <i class="fa-solid fa-info-circle"></i> Las llaves se actualizan automáticamente al cerrar encuentros de esta disciplina.
                    </span>
                </div>
            </section>

            <aside class="upcoming-sidebar">
                <div class="card" style="height: 100%">
                    <h3 style="margin-bottom: 20px;"><i class="fa-solid fa-calendar-alt"></i> Próximos</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${(State.matches || []).filter(m => m.status !== 'finished').map(m => {
        const t1 = State.teams.find(t => t.id === m.team1Id);
        const t2 = State.teams.find(t => t.id === m.team2Id);
        const comp = State.competitions.find(c => c.id === m.competitionId);
        return `
                                <div class="item-row" style="flex-direction: column; align-items: flex-start; gap: 5px;">
                                    <div style="font-size: 0.75rem; color: var(--accent-blue)">${comp?.name || 'Competencia'}</div>
                                    <div style="display: flex; justify-content: space-between; width: 100%;">
                                        <span>${t1?.name || 'TBD'} vs ${t2?.name || 'TBD'}</span>
                                        <span style="font-size: 0.7rem;">${m.time}</span>
                                    </div>
                                </div>
                            `;
    }).join('') || '<p>No hay encuentros próximos.</p>'}
                    </div>

                    <h3 style="margin-top: 30px;"><i class="fa-solid fa-star"></i> Puntuación</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${[...(State.teams || [])].sort((a, b) => (b.sportsPoints + b.culturalPoints) - (a.sportsPoints + a.culturalPoints))
            .slice(0, 5).map(t => `
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                <span>${t.name}</span>
                                <span>${t.sportsPoints + t.culturalPoints} pts</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </aside>
        </div>
    `;
}

function renderBracketMatch(label, round, num) {
    const match = State.matches.find(m =>
        m.competitionId === State.selectedDashboardComp &&
        m.round === round &&
        parseInt(m.matchNum) === num
    );

    let t1Name = 'TBD', t2Name = 'TBD', s1 = 0, s2 = 0, c1 = '#333', c2 = '#333';

    if (match) {
        const team1 = State.teams.find(t => t.id === match.team1Id);
        const team2 = State.teams.find(t => t.id === match.team2Id);
        t1Name = team1?.name || 'TBD';
        t2Name = team2?.name || 'TBD';
        c1 = window.translateColor(team1?.color || '#333');
        c2 = window.translateColor(team2?.color || '#333');
        s1 = match.team1Score;
        s2 = match.team2Score;
    }

    return `
        <div class="bracket-match" style="margin: 10px 0; border: 1px solid ${match && match.status === 'in-progress' ? 'var(--accent-blue)' : 'var(--border-glass)'};">
            <div style="font-size: 0.6rem; color: var(--text-muted); padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px; text-transform: uppercase;">${label}</div>
            <div class="team-row ${match && match.status === 'finished' && s2 > s1 ? 'winner' : ''}">
                <span style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span style="width: 3px; height: 12px; background: ${c1}; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.4);"></span>
                    ${t1Name}
                </span>
                <span class="score">${s1}</span>
            </div>
            <div class="team-row ${match && match.status === 'finished' && s2 > s1 ? 'winner' : ''}">
                <span style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span style="width: 3px; height: 12px; background: ${c2}; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.4);"></span>
                    ${t2Name}
                </span>
                <span class="score">${s2}</span>
            </div>
            ${match && match.status === 'in-progress' ? `
                <div style="position: absolute; top: -10px; right: -10px; background: var(--accent-blue); color: black; font-size: 0.5rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; box-shadow: 0 0 10px var(--accent-blue); animation: pulse 1s infinite;">
                    LIVE
                </div>
            ` : ''}
        </div>
    `;
}

function renderAdmin(container) {
    container.innerHTML = `
        <div class="admin-container fade-in">
            <h1 style="margin-bottom: 40px; font-family: var(--font-heading);">Gestión del Evento</h1>
            <div class="admin-grid">
                <!-- Sección Equipos -->
                <div class="card">
                    <div class="card-header" style="margin-bottom: 20px;">
                        <h3><i class="fa-solid fa-users" style="color: var(--accent-yellow)"></i> Equipos</h3>
                        <span class="count-badge">${State.teams.length}</span>
                    </div>
                    <form id="form-add-team">
                        <div class="form-group">
                            <label>Nombre del Equipo</label>
                            <input type="text" id="team-name" placeholder="Ej. Linces" required>
                        </div>
                        <div class="form-group">
                            <label>Color</label>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="text" id="team-color" placeholder="Ej. azul, rojo" required style="flex: 1; margin: 0;" oninput="document.getElementById('color-preview').style.background = window.translateColor(this.value);">
                                <div id="color-preview" style="width: 45px; height: 45px; border-radius: 8px; border: 1px solid var(--border-glass); background: #ffffff;"></div>
                            </div>
                        </div>
                        <button type="submit" class="btn" style="width: 100%"><i class="fa-solid fa-plus"></i> Añadir Equipo</button>
                    </form>
                    <div class="item-list" style="margin-top: 25px; border-top: 1px solid var(--border-glass); padding-top: 15px;">
                        ${State.teams.map(t => `
                            <div class="item-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03)">
                                <span style="display: flex; align-items: center; gap: 10px;">
                                    <span style="width: 14px; height: 14px; border-radius: 50%; background: ${window.translateColor(t.color)}; border: 1px solid rgba(255,255,255,0.5);"></span>
                                    ${t.name}
                                </span>
                                <i class="fa-solid fa-times" style="color: var(--text-muted); cursor: pointer;" onclick="State.teams = State.teams.filter(item => item.id !== '${t.id}'); State.save(); State.notify();"></i>
                            </div>
                        `).join('') || '<p style="color: var(--text-muted); font-size: 0.8rem;">No hay equipos registrados.</p>'}
                    </div>
                </div>

                <!-- Sección Competencias -->
                <div class="card">
                    <div class="card-header" style="margin-bottom: 20px;">
                        <h3><i class="fa-solid fa-medal" style="color: var(--accent-blue)"></i> Disciplinas</h3>
                        <span class="count-badge">${State.competitions.length}</span>
                    </div>
                    <form id="form-add-comp">
                        <div class="form-group">
                            <label>Nombre de la Disciplina</label>
                            <input type="text" id="comp-name" placeholder="Ej. Oratoria" required>
                        </div>
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="comp-type">
                                <option value="sport">Deportiva</option>
                                <option value="culture">Cultural</option>
                            </select>
                        </div>
                        <button type="submit" class="btn" style="width: 100%;"><i class="fa-solid fa-plus"></i> Añadir Disciplina</button>
                    </form>
                    <div class="item-list" style="margin-top: 25px; border-top: 1px solid var(--border-glass); padding-top: 15px;">
                        ${State.competitions.map(c => `
                            <div class="item-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03)">
                                <span style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fa-solid ${c.type === 'sport' ? 'fa-running' : 'fa-theater-masks'}" style="color: ${c.type === 'sport' ? 'var(--accent-orange)' : 'var(--accent-blue)'}"></i>
                                    ${c.name}
                                </span>
                                <i class="fa-solid fa-times" style="color: var(--text-muted); cursor: pointer;" onclick="State.competitions = State.competitions.filter(item => item.id !== '${c.id}'); State.save(); State.notify();"></i>
                            </div>
                        `).join('') || '<p style="color: var(--text-muted); font-size: 0.8rem;">No hay disciplinas registradas.</p>'}
                    </div>
                </div>
            </div>

            <!-- Programación de Encuentros -->
            <div class="card" style="margin-top: 40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3><i class="fa-solid fa-calendar-plus" style="color: var(--accent-orange)"></i> Alimentar Primera Ronda</h3>
                    <span style="font-size: 0.7rem; color: var(--accent-blue); background: rgba(0,242,255,0.1); padding: 4px 10px; border-radius: 4px;">
                        <i class="fa-solid fa-magic"></i> Avance automático activado
                    </span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 20px;">
                    Solo registra los partidos iniciales (Ej. los 4 partidos de Cuartos). 
                    Cuando un partido termine, la app creará la Semifinal y colocará al ganador automáticamente.
                </p>
                <form id="form-add-match" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                    <div class="form-group">
                        <label>Disciplina</label>
                        <select id="match-comp">
                            ${State.competitions.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>¿Qué ronda es?</label>
                        <select id="match-round">
                            <option value="octavos">Octavos de Final (16 equipos)</option>
                            <option value="cuartos">Cuartos de Final (8 equipos)</option>
                            <option value="semifinal">Semifinal (4 equipos)</option>
                            <option value="final">Final Directa (2 equipos)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label># de Partido</label>
                        <select id="match-num">
                            ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}">Partido ${n}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Equipo Local</label>
                        <select id="match-t1">
                            ${State.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Equipo Visitante</label>
                        <select id="match-t2">
                            ${State.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Hora</label>
                        <input type="time" id="match-time" value="09:00" required>
                    </div>
                    <div class="form-group">
                        <label>Ubicación</label>
                        <input type="text" id="match-loc" placeholder="Ej. Cancha Principal" required>
                    </div>
                    <div class="form-group" style="display: flex; align-items: flex-end;">
                        <button type="submit" class="btn" style="width: 100%">Agendar Inicio</button>
                    </div>
                </form>
            </div>

            <!-- Listado de Partidos Programados -->
            <div class="card" style="margin-top: 40px;">
                <div class="card-header">
                    <h3><i class="fa-solid fa-list-check" style="color: var(--accent-yellow)"></i> Juegos Programados</h3>
                    <span class="count-badge">${State.matches.length}</span>
                </div>
                <div class="item-list" style="margin-top: 15px;">
                    ${State.matches.map(m => {
        const t1 = State.teams.find(t => t.id === m.team1Id);
        const t2 = State.teams.find(t => t.id === m.team2Id);
        const comp = State.competitions.find(c => c.id === m.competitionId);
        return `
                            <div class="item-row" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding: 12px 0;">
                                <div style="flex: 1;">
                                    <div style="font-size: 0.75rem; color: var(--accent-blue); text-transform: uppercase;">${comp?.name || '---'} | ${m.round.toUpperCase()} #${m.matchNum}</div>
                                    <div style="font-weight: 600;">${t1?.name || 'TBD'} vs ${t2?.name || 'TBD'}</div>
                                    <div style="font-size: 0.7rem; color: var(--text-muted);">${m.time} | ${m.location}</div>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center;">
                                    <span class="tag" style="font-size: 0.65rem; border: 1px solid ${m.status === 'finished' ? 'var(--success)' : 'var(--accent-orange)'}; color: ${m.status === 'finished' ? 'var(--success)' : 'var(--accent-orange)'}; padding: 2px 8px; border-radius: 4px;">
                                        ${m.status.toUpperCase()}
                                    </span>
                                    <button onclick="window.deleteMatch('${m.id}')" style="background: transparent; border: none; color: #ff4b2b; cursor: pointer; padding: 5px;">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        `;
    }).join('') || '<p style="color: var(--text-muted); font-size: 0.8rem;">No hay partidos agendados.</p>'}
                </div>
            </div>

            <!-- Zona de Peligro -->
            <div style="margin-top: 80px; padding: 30px; border: 1px solid rgba(255, 75, 43, 0.2); border-radius: 20px; background: rgba(255, 75, 43, 0.02); text-align: center;">
                <h3 style="color: #ff4b2b; margin-bottom: 10px;"><i class="fa-solid fa-triangle-exclamation"></i> Zona de Peligro</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 20px;">Borrar todos los datos y reiniciar el torneo desde cero.</p>
                <button onclick="window.resetTournament()" class="btn" style="background: #ff4b2b; color: white;">REINICIAR TODO EL TORNEO</button>
            </div>
        </div>
    `;

    document.getElementById('form-add-team').onsubmit = (e) => {
        e.preventDefault();
        const rawColor = document.getElementById('team-color').value;
        State.addTeam(document.getElementById('team-name').value, window.translateColor(rawColor));
    };
    document.getElementById('form-add-comp').onsubmit = (e) => {
        e.preventDefault();
        State.addCompetition(document.getElementById('comp-name').value, document.getElementById('comp-type').value);
    };
    document.getElementById('form-add-match').onsubmit = (e) => {
        e.preventDefault();
        State.addMatch({
            competitionId: document.getElementById('match-comp').value,
            round: document.getElementById('match-round').value,
            matchNum: document.getElementById('match-num').value,
            team1Id: document.getElementById('match-t1').value,
            team2Id: document.getElementById('match-t2').value,
            time: document.getElementById('match-time').value,
            location: document.getElementById('match-loc').value
        });
    };
}

function renderCaptura(container) {
    const matches = State.matches.filter(m => m.status !== 'finished');
    container.innerHTML = `
        <div class="admin-container fade-in">
            <h1 style="margin-bottom: 30px;"><i class="fa-solid fa-edit" style="color: var(--accent-yellow)"></i> Captura de Resultados</h1>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 25px;">
                ${matches.map(m => {
        const t1 = State.teams.find(t => t.id === m.team1Id);
        const t2 = State.teams.find(t => t.id === m.team2Id);
        const comp = State.competitions.find(c => c.id === m.competitionId);
        return `
                        <div class="card" style="padding: 25px;">
                            <div style="font-size: 0.75rem; color: var(--accent-blue); text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; font-weight: bold;">
                                <i class="fa-solid fa-trophy"></i> ${comp?.name || 'Disciplina'} | ${m.round.toUpperCase()}
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                                <!-- Equipo 1 -->
                                <div style="flex: 1; text-align: center;">
                                    <div style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px; height: 40px; display: flex; align-items: center; justify-content: center; line-height: 1.2;">
                                        ${t1?.name || 'TBD'}
                                    </div>
                                    <input type="number" id="s1-${m.id}" value="${m.team1Score}" 
                                        oninput="window.syncScore('${m.id}', 1, this.value)"
                                        style="width: 80px; height: 80px; text-align: center; font-size: 2.2rem; font-weight: 900; background: rgba(255,255,255,0.05); border: 2px solid var(--border-glass); border-radius: 15px; color: var(--accent-yellow);">
                                </div>

                                <div style="padding: 0 15px; font-weight: 900; color: var(--text-muted); font-size: 1.2rem; margin-top: 40px;">VS</div>

                                <!-- Equipo 2 -->
                                <div style="flex: 1; text-align: center;">
                                    <div style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px; height: 40px; display: flex; align-items: center; justify-content: center; line-height: 1.2;">
                                        ${t2?.name || 'TBD'}
                                    </div>
                                    <input type="number" id="s2-${m.id}" value="${m.team2Score}" 
                                        oninput="window.syncScore('${m.id}', 2, this.value)"
                                        style="width: 80px; height: 80px; text-align: center; font-size: 2.2rem; font-weight: 900; background: rgba(255,255,255,0.05); border: 2px solid var(--border-glass); border-radius: 15px; color: var(--accent-yellow);">
                                </div>
                            </div>

                            <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-bottom: 20px;">
                                <i class="fa-solid fa-location-dot"></i> ${m.location} | <i class="fa-solid fa-clock"></i> ${m.time}
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <button onclick="window.savePartial('${m.id}')" class="btn" style="flex: 2; font-size: 0.85rem;">
                                    <i class="fa-solid fa-save"></i> ACTUALIZAR
                                </button>
                                <button onclick="window.finishMatch('${m.id}')" class="btn btn-secondary" style="flex: 1; font-size: 0.85rem; border-color: var(--success); color: var(--success);">
                                    <i class="fa-solid fa-check-circle"></i> CERRAR
                                </button>
                                <button onclick="window.deleteMatch('${m.id}')" class="btn" style="background: rgba(255, 75, 43, 0.1); color: #ff4b2b; border: 1px solid rgba(255, 75, 43, 0.3); flex: 0 0 50px; padding: 0;">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    `;
    }).join('') || `
                    <div style="grid-column: 1/-1; text-align: center; padding: 100px; color: var(--text-muted);">
                        <i class="fa-solid fa-calendar-day" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.2;"></i>
                        <p>No hay encuentros activos para capturar.</p>
                        <p style="font-size: 0.8rem; margin-top: 10px;">Comienza programando partidos en la pestaña de Configuración.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Helper functions for capture
window.translateColor = (colorStr) => {
    if (!colorStr) return '#ffffff';
    const cleanStr = colorStr.trim().toLowerCase();

    const colorMap = {
        'rojo': '#ff4b2b',
        'roja': '#ff4b2b',
        'azul': '#00d2ff',
        'verde': '#00ff88',
        'amarillo': '#f2df0d',
        'amarilla': '#f2df0d',
        'naranja': '#ff7e33',
        'blanco': '#ffffff',
        'blanca': '#ffffff',
        'negro': '#444444', // Gris muy oscuro para que se vea sobre el fondo negro
        'negra': '#444444',
        'morado': '#8e44ad',
        'morada': '#8e44ad',
        'rosa': '#ff007f',
        'gris': '#888888',
        'cian': '#00ffff',
        'cyan': '#00ffff',
        'marron': '#8b4513',
        'marrón': '#8b4513',
        'turquesa': '#40e0d0',
        'violeta': '#ee82ee',
        'dorado': '#ffd700',
        'oro': '#ffd700',
        'plateado': '#c0c0c0',
        'plata': '#c0c0c0',
        'beige': '#f5f5dc',
        'crema': '#f5f5dc',
        // Tonos Claros
        'azul claro': '#87ceeb',
        'verde claro': '#90ee90',
        'rojo claro': '#ff7f7f',
        'amarillo claro': '#fffacc',
        'gris claro': '#d3d3d3',
        'morado claro': '#d7bde2',
        // Tonos Oscuros
        'azul oscuro': '#00008b',
        'azul obscuro': '#00008b',
        'verde oscuro': '#006400',
        'verde obscuro': '#006400',
        'rojo oscuro': '#8b0000',
        'gris oscuro': '#a9a9a9',
        'morado oscuro': '#5b2c6f'
    };

    if (colorMap[cleanStr]) {
        return colorMap[cleanStr];
    }

    // Si no es un color mapeado, asume que es un valor CSS válido (ej. hex o nombre en inglés)
    return cleanStr;
};

window.syncScore = (id, teamNum, val) => {
    const match = State.matches.find(m => m.id === id);
    if (match) {
        if (teamNum === 1) match.team1Score = parseInt(val) || 0;
        else match.team2Score = parseInt(val) || 0;
        State.save();
    }
};

window.savePartial = (id) => {
    const s1 = document.getElementById(`s1-${id}`).value;
    const s2 = document.getElementById(`s2-${id}`).value;
    State.updateMatchResult(id, s1, s2, false);
    alert('Marcador actualizado correctamente.');
};

window.finishMatch = (id) => {
    if (confirm('¿Finalizar encuentro? Esto hará avanzar al ganador automáticamente.')) {
        const s1 = document.getElementById(`s1-${id}`).value;
        const s2 = document.getElementById(`s2-${id}`).value;
        State.updateMatchResult(id, s1, s2, true);
    }
};

window.deleteMatch = (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este partido? Esta acción no se puede deshacer.')) {
        State.matches = State.matches.filter(m => m.id !== id);
        State.save();
        State.notify();
    }
};

window.resetTournament = () => {
    if (confirm('¿ESTÁS TOTALMENTE SEGURO? Se borrarán todos los equipos, competencias y resultados en la NUBE y localmente. No se puede deshacer.')) {
        if (State.isCloudEnabled && State.db) {
            State.db.ref('tournament_data').remove();
        }
        localStorage.removeItem('estudiantes-games-state');
        location.reload();
    }
};

// --- AUTHENTICATION ---
window.loginAdmin = () => {
    const password = prompt("Ingresa la clave de administrador para acceder a Configuración y Captura:");
    // Clave predefinida: 1234 (puedes cambiarla aquí)
    if (password === '1234') {
        State.setAdmin(true);
        alert("Acceso concedido. Ahora puedes ver las opciones de Configuración y Captura.");
    } else if (password !== null) {
        alert("Clave incorrecta.");
    }
};

window.logoutAdmin = () => {
    State.setAdmin(false);
    State.currentView = 'dashboard';
    render();
};

window.toggleAuth = () => {
    if (State.isAdmin) {
        window.logoutAdmin();
    } else {
        window.loginAdmin();
    }
}
