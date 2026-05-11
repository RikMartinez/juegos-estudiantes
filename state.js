// CONFIGURACIÓN DE FIREBASE (Debes reemplazar esto con tus datos)
const firebaseConfig = {
    apiKey: "AIzaSyCooXgBIZ9CAGi8mdT05q_KyZAFJVbM30E",
    authDomain: "juegos-estudiantes.firebaseapp.com",
    databaseURL: "https://juegos-estudiantes-default-rtdb.firebaseio.com",
    projectId: "juegos-estudiantes",
    storageBucket: "juegos-estudiantes.firebasestorage.app",
    messagingSenderId: "654844813197",
    appId: "1:654844813197:web:39753de949e7f96409e7c4"
};

const State = {
    teams: [],
    competitions: [],
    matches: [],
    eventResults: [], // Para competencias de ranking o carrera
    currentView: 'dashboard',
    isAdmin: false,
    db: null,
    isCloudEnabled: false,
    // Tabla de puntos por posición (puedes ajustarla luego)
    // Tabla de puntos por posición: 1°: 25, 2°: 21, 3°: 18, 4°: 15, 5°: 13, 6°: 11, 7°: 10, 8°: 9, 9°: 8, 10°: 7, 11°: 6, 12°: 5, 13°: 4, 14°: 3, 15°: 2, 16°: 1
    pointTable: [25, 21, 18, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],

    init() {
        // 1. Intentar configurar Firebase
        if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('REEMPLAZAR')) {
            try {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.isCloudEnabled = true;

                // Escuchar cambios en tiempo real desde la nube
                this.db.ref('tournament_v2').on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        this.teams = data.teams || [];
                        this.competitions = data.competitions || [];
                        this.matches = data.matches || [];
                        this.eventResults = data.eventResults || [];
                        this.calculatePoints();
                        this.notify();
                    }
                });
                console.log("☁️ Sincronización en la nube activa");
            } catch (e) {
                console.error("Firebase Init Error:", e);
                this.loadLocal();
            }
        } else {
            console.log("🏠 Usando almacenamiento local (Firebase no configurado)");
            this.loadLocal();
        }

        // 2. Ya NO inicializamos automáticamente con datos por defecto.
        // Si la App está vacía, el usuario deberá pulsar "Reiniciar" manualmente si desea los equipos base.
    },

    clearAll() {
        // 1. Limpiar localStorage
        localStorage.removeItem('estudiantes-games-v2');
        
        // 2. Limpiar Nube
        if (this.isCloudEnabled && this.db) {
            this.db.ref('tournament_v2').remove();
        }

        // 3. Forzar reinicio limpio
        location.reload();
    },

    setDefaults() {
        this.teams = [
            { id: 't1', name: 'Equipo Alpha', color: 'Azul', deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0, totalPoints: 0 },
            { id: 't2', name: 'Equipo Beta', color: 'Rojo', deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0, totalPoints: 0 },
            { id: 't3', name: 'Equipo Gamma', color: 'Verde', deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0, totalPoints: 0 },
            { id: 't4', name: 'Equipo Delta', color: 'Amarillo', deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0, totalPoints: 0 }
        ];
        this.competitions = [
            { id: 'c1', name: 'Ajedrez', type: 'mental', format: 'bracket', category: 'Mixto' },
            { id: 'c2', name: 'Rally', type: 'deportiva', format: 'ranking', category: 'Mixto' }
        ];
        this.matches = [];
        this.eventResults = [];
        this.calculatePoints();
        this.save();
    },

    save() {
        try {
            const dataToSave = {
                teams: this.teams,
                competitions: this.competitions,
                matches: this.matches,
                eventResults: this.eventResults
            };
            localStorage.setItem('estudiantes-games-v2', JSON.stringify(dataToSave));
            if (this.isCloudEnabled && this.db) {
                this.db.ref('tournament_v2').set(dataToSave);
            }
        } catch (e) {
            console.error("Save Error:", e);
        }
    },

    update() {
        this.calculatePoints();
        this.save();
        this.notify();
    },

    loadLocal() {
        try {
            const saved = localStorage.getItem('estudiantes-games-v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.teams = parsed.teams || [];
                this.competitions = parsed.competitions || [];
                this.matches = parsed.matches || [];
                this.eventResults = parsed.eventResults || [];
            }
        } catch (e) {
            console.error("Load Error:", e);
        }
    },

    tryRecovery() {
        // Buscar en nombres de claves antiguos
        const keys = ['estudiantes-games-state', 'estudiantes-games-v1', 'estudiantes-games-backup'];
        for (const key of keys) {
            const old = localStorage.getItem(key);
            if (old) {
                try {
                    const data = JSON.parse(old);
                    if (data.teams && data.teams.length > 4) {
                        this.teams = data.teams;
                        this.competitions = data.competitions || [];
                        this.matches = data.matches || [];
                        this.eventResults = data.eventResults || [];
                        this.update();
                        return true;
                    }
                } catch (e) {}
            }
        }
        return false;
    },

    addTeam(name, color) {
        this.teams.push({ id: 'team-' + Date.now(), name, color, deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0, amonestaciones: 0 });
        this.update();
    },

    updateAmonestaciones(teamId, delta) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.amonestaciones = Math.max(0, (team.amonestaciones || 0) + delta);
            this.update();
        }
    },

    updateTeam(id, name, color) {
        const team = this.teams.find(t => t.id === id);
        if (team) {
            team.name = name;
            team.color = color;
            this.update();
        }
    },

    addCompetition(name, type, format = 'bracket', category = 'Mixto') {
        this.competitions.push({ id: 'comp-' + Date.now(), name, type, format, category });
        this.update();
    },

    submitEventResult(compId, teamId, participantName, value, dq = false) {
        const existing = this.eventResults.find(r =>
            r.competitionId === compId && r.teamId === teamId && r.participantName === participantName
        );
        if (existing) {
            existing.value = value;
            existing.dq = dq;
        } else {
            this.eventResults.push({ competitionId: compId, teamId, participantName: participantName || '', value, dq });
        }
        this.update();
    },

    removeEventResult(compId, teamId, participantName) {
        this.eventResults = this.eventResults.filter(r =>
            !(r.competitionId === compId && r.teamId === teamId && r.participantName === participantName)
        );
        this.update();
    },

    toggleEventAdvance(compId, teamId) {
        let res = this.eventResults.find(r => r.competitionId === compId && r.teamId === teamId);
        if (res) {
            res.advanced = !res.advanced;
        } else {
            this.eventResults.push({ competitionId: compId, teamId: teamId, value: '', advanced: true });
        }
        this.update();
    },

    deleteEventResult(compId, teamId) {
        this.eventResults = this.eventResults.filter(r => !(r.competitionId === compId && r.teamId === teamId));
        this.update();
    },

    addMatch(matchData) {
        this.matches.push({ id: 'match-' + Date.now(), ...matchData, status: 'upcoming', team1Score: 0, team2Score: 0 });
        this.update();
    },

    updateMatch(matchId, matchData) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            Object.assign(match, matchData);
            // Si el partido está finalizado, re-calcular el avance a la siguiente ronda
            if (match.status === 'finished' && match.format === 'bracket') {
                this.advanceWinner(match);
            }
            this.update();
        }
    },

    setAdmin(val) {
        this.isAdmin = val;
        this.notify();
    },

    updateMatchResult(matchId, s1, s2, isFinished, dq1 = false, dq2 = false) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            match.team1Score = parseInt(s1) || 0;
            match.team2Score = parseInt(s2) || 0;
            match.team1DQ = dq1;
            match.team2DQ = dq2;
            if (isFinished) {
                match.status = 'finished';
                this.advanceWinner(match);
            } else {
                match.status = 'in-progress';
            }
            this.update();
        }
    },

    advanceWinner(match) {
        if (match.status !== 'finished' || match.round === 'final') return;

        let winnerId = null;
        if (match.team1DQ && match.team2DQ) {
            winnerId = '?';
            console.log("Doble DQ detectado - Limpiando siguiente ronda");
        } else if (match.team1Score > match.team2Score) {
            winnerId = match.team1Id;
        } else if (match.team2Score > match.team1Score) {
            winnerId = match.team2Id;
        } else if (match.team1DQ) {
            winnerId = match.team2Id;
        } else if (match.team2DQ) {
            winnerId = match.team1Id;
        }

        if (!winnerId) {
            console.log("No se pudo determinar ganador para el avance");
            return;
        }

        const nextRoundMap = {
            'dieciseisavos': 'octavos',
            'octavos': 'cuartos',
            'cuartos': 'semifinal',
            'semifinal': 'final'
        };

        const nextRound = nextRoundMap[match.round];
        if (!nextRound) return;

        const nextMatchNum = Math.ceil(parseInt(match.matchNum) / 2);
        const nextMatch = this.matches.find(m => 
            m.competitionId === match.competitionId && 
            m.round === nextRound && 
            parseInt(m.matchNum) === nextMatchNum
        );

        if (nextMatch) {
            console.log(`Actualizando siguiente ronda (${nextRound}, partido ${nextMatchNum}) con winner: ${winnerId}`);
            if (parseInt(match.matchNum) % 2 !== 0) {
                nextMatch.team1Id = winnerId;
            } else {
                nextMatch.team2Id = winnerId;
            }
        } else {
            this.matches.push({
                id: 'match-' + Date.now() + Math.random(),
                competitionId: match.competitionId,
                round: nextRound,
                matchNum: nextMatchNum,
                team1Id: parseInt(match.matchNum) % 2 !== 0 ? winnerId : '?',
                team2Id: parseInt(match.matchNum) % 2 === 0 ? winnerId : '?',
                time: '--:--',
                location: 'TBD',
                status: 'upcoming',
                team1Score: 0,
                team2Score: 0
            });
        }
    },

    calculatePoints() {
        // Reset points
        this.teams.forEach(t => {
            t.deportivaPoints = 0;
            t.mentalPoints = 0;
            t.atletismoPoints = 0;
        });

        const getField = (type) => {
            if (type === 'deportiva') return 'deportivaPoints';
            if (type === 'mental') return 'mentalPoints';
            if (type === 'atletismo') return 'atletismoPoints';
            return 'deportivaPoints';
        };

        const parseVal = (val) => {
            if (val === undefined || val === null || val === '' || val === '0') return 0;
            if (typeof val === 'number') return val;
            const sVal = String(val).trim();
            if (sVal.includes(':')) {
                const parts = sVal.split(':');
                return (parseInt(parts[0]) * 60) + (parseFloat(parts[1] || 0));
            }
            return parseFloat(sVal) || 0;
        };

        // 1. PUNTOS POR COMPETENCIA (Bracket, Ranking o Carrera)
        this.competitions.forEach(comp => {
            let rankedTeams = []; 

            if (comp.format === 'bracket') {
                const roundWeight = { 'final': 5, 'semifinal': 4, 'cuartos': 3, 'octavos': 2, 'dieciseisavos': 1 };
                const teamStats = {};
                this.teams.forEach(t => teamStats[t.id] = { maxRound: -1, pf: 0, pa: 0, diff: 0, id: t.id });

                this.matches.filter(m => m.competitionId === comp.id && m.status === 'finished').forEach(m => {
                    const s1 = parseInt(m.team1Score) || 0;
                    const s2 = parseInt(m.team2Score) || 0;
                    const rW = roundWeight[m.round] || 0;
                    
                    const t1 = teamStats[m.team1Id];
                    const t2 = teamStats[m.team2Id];

                    if (t1) {
                        t1.pf += s1;
                        t1.pa += s2;
                        t1.diff = t1.pf - t1.pa;
                        // El ganador de la final llega al peso 6 (Campeón)
                        if (m.round === 'final' && s1 > s2) t1.maxRound = 6;
                        else t1.maxRound = Math.max(t1.maxRound, rW);
                    }
                    if (t2) {
                        t2.pf += s2;
                        t2.pa += s1;
                        t2.diff = t2.pf - t2.pa;
                        if (m.round === 'final' && s2 > s1) t2.maxRound = 6;
                        else t2.maxRound = Math.max(t2.maxRound, rW);
                    }
                });

                rankedTeams = Object.values(teamStats)
                    .filter(s => s.maxRound >= 0)
                    .sort((a, b) => {
                        if (b.maxRound !== a.maxRound) return b.maxRound - a.maxRound;
                        // Solo aplicar desempate por puntos en disciplinas DEPORTIVAS
                        if (comp.type === 'deportiva') {
                            if (b.diff !== a.diff) return b.diff - a.diff;
                            return b.pf - a.pf;
                        }
                        return 0; // Sin desempate para otros tipos
                    })
                    .map(s => s.id);
            } else {
                // Ranking o Carrera: Excluimos DQ y vacíos
                const rawResults = this.eventResults.filter(r => 
                    r.competitionId === comp.id && 
                    !r.dq &&
                    r.value !== '' && 
                    r.value !== '0' &&
                    String(r.value).toUpperCase() !== 'DQ'
                );
                
                rankedTeams = rawResults
                    .sort((a, b) => {
                        const vA = parseVal(a.value);
                        const vB = parseVal(b.value);
                        return comp.format === 'ranking' ? vB - vA : vA - vB;
                    })
                    .map(r => r.teamId);
            }

            const field = getField(comp.type);
            const processedTeamsForThisComp = new Set();
            let tableIndex = 0;

            rankedTeams.forEach(tId => {
                if (!processedTeamsForThisComp.has(tId) && tableIndex < this.pointTable.length) {
                    const team = this.teams.find(t => t.id === tId);
                    if (team) {
                        team[field] = (team[field] || 0) + this.pointTable[tableIndex];
                        tableIndex++;
                        processedTeamsForThisComp.add(tId);
                    }
                }
            });
        });

        // 2. ACTUALIZAR TOTALES GLOBALES (Y PENALIZACIONES)
        this.teams.forEach(t => {
            const penalties = Math.floor((t.amonestaciones || 0) / 3) * 5;
            t.totalPoints = (t.deportivaPoints || 0) + (t.mentalPoints || 0) + (t.atletismoPoints || 0) - penalties;
        });
    },

    notify() {
        window.dispatchEvent(new CustomEvent('stateChanged'));
    }
};

State.init();
