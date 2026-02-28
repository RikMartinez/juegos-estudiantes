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
    currentView: 'dashboard',
    isAdmin: false,
    db: null,
    isCloudEnabled: false,

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
            { id: 't1', name: 'Leones Rojos', color: '#ff4b2b', sportsPoints: 0, culturalPoints: 0 },
            { id: 't2', name: 'Águilas Azules', color: '#00d2ff', sportsPoints: 0, culturalPoints: 0 },
            { id: 't3', name: 'Delfines Verdes', color: '#00ff88', sportsPoints: 0, culturalPoints: 0 },
            { id: 't4', name: 'Tigres Reales', color: '#ffcc00', sportsPoints: 0, culturalPoints: 0 }
        ];
        this.competitions = [
            { id: 'c1', name: 'Fútbol Varonil', type: 'sport' },
            { id: 'c2', name: 'Voleibol Femenil', type: 'sport' }
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
                matches: this.matches
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
            }
        } catch (e) {
            console.error("Load Error:", e);
        }
    },

    addTeam(name, color) {
        this.teams.push({ id: 'team-' + Date.now(), name, color, sportsPoints: 0, culturalPoints: 0 });
        this.save();
        this.notify();
    },

    addCompetition(name, type) {
        this.competitions.push({ id: 'comp-' + Date.now(), name, type });
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

        const nextRoundMap = { 'octavos': 'cuartos', 'cuartos': 'semifinal', 'semifinal': 'final' };
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
        this.teams.forEach(t => { t.sportsPoints = 0; t.culturalPoints = 0; });
        this.matches.filter(m => m.status === 'finished').forEach(m => {
            const comp = this.competitions.find(c => c.id === m.competitionId);
            const team1 = this.teams.find(t => t.id === m.team1Id);
            const team2 = this.teams.find(t => t.id === m.team2Id);
            if (team1 && team2 && comp) {
                const field = comp.type === 'sport' ? 'sportsPoints' : 'culturalPoints';
                if (m.team1Score > m.team2Score) team1[field] += 3;
                else if (m.team2Score > m.team1Score) team2[field] += 3;
                else { team1[field] += 1; team2[field] += 1; }
            }
        });
    },

    notify() {
        window.dispatchEvent(new CustomEvent('stateChanged'));
    }
};

State.init();
