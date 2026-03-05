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
    // Tabla de puntos por posición: 1°: 15, 2°: 12, 3°: 10, 4°: 8, 5°: 7, 6°: 6, 7°: 5, 8°: 4, 9°: 3, 10°: 2
    pointTable: [15, 12, 10, 8, 7, 6, 5, 4, 3, 2],

    init() {
        // 1. Intentar configurar Firebase
        if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('REEMPLAZAR')) {
            try {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.isCloudEnabled = true;

                // Escuchar cambios en tiempo real desde la nube
                this.db.ref('tournament_data').on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        this.teams = data.teams || [];
                        this.competitions = data.competitions || [];
                        this.matches = data.matches || [];
                        this.eventResults = data.eventResults || [];
                        this.notify();
                    } else {
                        // Si la nube está vacía, subimos los datos locales iniciales
                        this.loadLocal();
                        if (this.teams.length > 0) this.save();
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

        // 2. Datos por defecto si no hay nada
        if ((!this.teams || this.teams.length === 0) && !this.isCloudEnabled) {
            this.setDefaults();
        }
    },

    setDefaults() {
        this.teams = [
            { id: 't1', name: 'Leones Rojos', color: '#ff4b2b', deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0 },
            { id: 't2', name: 'Águilas Azules', color: '#00d2ff', deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0 },
            { id: 't3', name: 'Delfines Verdes', color: '#00ff88', deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0 },
            { id: 't4', name: 'Tigres Reales', color: '#ffcc00', deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0 }
        ];
        this.competitions = [
            { id: 'c1', name: 'Fútbol', type: 'deportiva', format: 'bracket', category: 'Varonil' },
            { id: 'c2', name: 'Voleibol', type: 'deportiva', format: 'bracket', category: 'Femenil' },
            { id: 'c3', name: 'Ajedrez', type: 'mental', format: 'ranking', category: 'Mixto' }
        ];
        this.matches = [
            { id: 'm1', competitionId: 'c1', round: 'cuartos', matchNum: 1, team1Id: 't1', team2Id: 't2', time: '10:00', location: 'Cancha A', status: 'finished', team1Score: 2, team2Score: 1 },
            { id: 'm2', competitionId: 'c1', round: 'cuartos', matchNum: 2, team1Id: 't3', team2Id: 't4', time: '11:00', location: 'Cancha A', status: 'upcoming', team1Score: 0, team2Score: 0 }
        ];
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

            // Guardar local (caché)
            localStorage.setItem('estudiantes-games-state', JSON.stringify(dataToSave));

            // Guardar en la nube (si está configurada)
            if (this.isCloudEnabled && this.db) {
                this.db.ref('tournament_data').set(dataToSave);
            }
        } catch (e) {
            console.error("Save Error:", e);
        }
    },

    loadLocal() {
        try {
            const saved = localStorage.getItem('estudiantes-games-state');
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

    addTeam(name, color) {
        this.teams.push({ id: 'team-' + Date.now(), name, color, deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0 });
        this.save();
        this.notify();
    },

    updateTeam(id, name, color) {
        const team = this.teams.find(t => t.id === id);
        if (team) {
            team.name = name;
            team.color = color;
            this.save();
            this.notify();
        }
    },

    addCompetition(name, type, format = 'bracket', category = 'Mixto') {
        this.competitions.push({ id: 'comp-' + Date.now(), name, type, format, category });
        this.save();
        this.notify();
    },

    submitEventResult(compId, teamId, participantName, value, advanced = undefined) {
        // Buscamos si ya existe ese participante específico en esa competencia
        const existing = this.eventResults.find(r =>
            r.competitionId === compId &&
            r.teamId === teamId &&
            r.participantName === participantName
        );

        if (existing) {
            existing.value = value;
            if (advanced !== undefined) existing.advanced = advanced;
        } else {
            this.eventResults.push({
                competitionId: compId,
                teamId: teamId,
                participantName: participantName || '',
                value: value,
                advanced: advanced || false
            });
        }
        this.save();
        this.notify();
    },

    removeEventResult(compId, teamId, participantName) {
        this.eventResults = this.eventResults.filter(r =>
            !(r.competitionId === compId && r.teamId === teamId && r.participantName === participantName)
        );
        this.calculatePoints();
        this.save();
        this.notify();
    },

    toggleEventAdvance(compId, teamId) {
        let res = this.eventResults.find(r => r.competitionId === compId && r.teamId === teamId);
        if (res) {
            res.advanced = !res.advanced;
        } else {
            this.eventResults.push({ competitionId: compId, teamId: teamId, value: '', advanced: true });
        }
        this.save();
        this.notify();
    },

    deleteEventResult(compId, teamId) {
        this.eventResults = this.eventResults.filter(r => !(r.competitionId === compId && r.teamId === teamId));
        this.save();
        this.notify();
    },

    addMatch(matchData) {
        this.matches.push({ id: 'match-' + Date.now(), ...matchData, status: 'upcoming', team1Score: 0, team2Score: 0 });
        this.save();
        this.notify();
    },

    setAdmin(val) {
        this.isAdmin = val;
        this.notify();
    },

    updateMatchResult(matchId, s1, s2, isFinished) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            match.team1Score = parseInt(s1) || 0;
            match.team2Score = parseInt(s2) || 0;
            if (isFinished) {
                match.status = 'finished';
                this.calculatePoints();
                this.advanceWinner(match);
            } else {
                match.status = 'in-progress';
            }
            this.save();
            this.notify();
        }
    },

    advanceWinner(match) {
        if (match.status !== 'finished' || match.round === 'final') return;

        const winnerId = match.team1Score > match.team2Score ? match.team1Id : match.team2Id;
        if (!winnerId || winnerId === '?') return;

        const nextRoundMap = {
            'dieciseisavos': 'octavos',
            'octavos': 'cuartos',
            'cuartos': 'semifinal',
            'semifinal': 'final'
        };
        const nextRound = nextRoundMap[match.round];
        if (!nextRound) return;

        const currentMatchNum = parseInt(match.matchNum);
        const nextMatchNum = Math.ceil(currentMatchNum / 2);
        const teamPos = currentMatchNum % 2 === 1 ? 'team1Id' : 'team2Id';

        let nextMatch = this.matches.find(m =>
            m.competitionId === match.competitionId &&
            m.round === nextRound &&
            parseInt(m.matchNum) === nextMatchNum
        );

        if (nextMatch) {
            nextMatch[teamPos] = winnerId;
        } else {
            this.matches.push({
                id: 'match-' + Date.now() + Math.random(),
                competitionId: match.competitionId,
                round: nextRound,
                matchNum: nextMatchNum,
                team1Id: teamPos === 'team1Id' ? winnerId : '?',
                team2Id: teamPos === 'team2Id' ? winnerId : '?',
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

        // 1. Points from Matches (Brackets)
        this.matches.filter(m => m.status === 'finished').forEach(m => {
            const comp = this.competitions.find(c => c.id === m.competitionId);
            const team1 = this.teams.find(t => t.id === m.team1Id);
            const team2 = this.teams.find(t => t.id === m.team2Id);
            if (team1 && team2 && comp) {
                const field = getField(comp.type);
                if (m.team1Score > m.team2Score) team1[field] += 3;
                else if (m.team2Score > m.team1Score) team2[field] += 3;
                else { team1[field] += 1; team2[field] += 1; }
            }
        });

        // 2. Points from Rankings/Races (Positions)
        this.competitions.filter(c => c.format !== 'bracket').forEach(comp => {
            const results = this.eventResults
                .filter(r => r.competitionId === comp.id && r.value !== '' && r.value !== '0')
                .sort((a, b) => {
                    if (comp.format === 'ranking') return parseFloat(b.value) - parseFloat(a.value);
                    return a.value.localeCompare(b.value); // For races (times)
                });

            results.forEach((res, index) => {
                const team = this.teams.find(t => t.id === res.teamId);
                if (team && this.pointTable[index]) {
                    const field = getField(comp.type);
                    team[field] += this.pointTable[index];
                }
            });
        });
    },

    notify() {
        window.dispatchEvent(new CustomEvent('stateChanged'));
    }
};

State.init();
