// CONFIGURACIÓN DE FIREBASE
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
    eventResults: [],
    currentView: 'dashboard',
    isAdmin: false,
    db: null,
    isCloudEnabled: false,
    pointTable: [55, 47, 42, 38, 35, 32, 30, 28, 26, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],

    init() {
        if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('REEMPLAZAR')) {
            try {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.isCloudEnabled = true;
                this.db.ref('festival_2026').on('value', (snapshot) => {
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
                this.loadLocal();
            }
        } else {
            this.loadLocal();
        }
    },

    save() {
        try {
            const dataToSave = {
                teams: this.teams,
                competitions: this.competitions,
                matches: this.matches,
                eventResults: this.eventResults
            };
            localStorage.setItem('festival-vida-muerte-2026', JSON.stringify(dataToSave));
            if (this.isCloudEnabled && this.db) {
                this.db.ref('festival_2026').set(dataToSave);
            }
        } catch (e) {}
    },

    update() {
        this.calculatePoints();
        this.save();
        this.notify();
    },

    loadLocal() {
        try {
            const saved = localStorage.getItem('festival-vida-muerte-2026');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.teams = parsed.teams || [];
                this.competitions = parsed.competitions || [];
                this.matches = parsed.matches || [];
                this.eventResults = parsed.eventResults || [];
            }
        } catch (e) {}
    },

    addTeam(name, color) {
        this.teams.push({ id: 'team-' + Date.now(), name, color, calaveritaPoints: 0, cuentosPoints: 0, catrinesPoints: 0, altaresPoints: 0, lapidaPoints: 0, amonestaciones: 0 });
        this.update();
    },

    updateTeam(id, name, color) {
        const team = this.teams.find(t => t.id === id);
        if (team) {
            team.name = name;
            team.color = color;
            this.update();
        }
    },

    updateAmonestaciones(id, change) {
        const team = this.teams.find(t => t.id === id);
        if (team) {
            team.amonestaciones = Math.max(0, (team.amonestaciones || 0) + change);
            this.update();
        }
    },

    addCompetition(name, type, format = 'bracket', category = 'Mixto') {
        this.competitions.push({ id: 'comp-' + Date.now(), name, type, format, category });
        this.update();
    },

    finishCompetition(compId) {
        const comp = this.competitions.find(c => c.id === compId);
        if (comp) {
            comp.status = 'finished';
            // También finalizamos los eventos programados de esta disciplina
            this.matches.forEach(m => { if (m.competitionId === compId) m.status = 'finished'; });
            this.update();
        }
    },

    reopenCompetition(compId) {
        const comp = this.competitions.find(c => c.id === compId);
        if (comp) {
            comp.status = 'upcoming';
            this.matches.forEach(m => { if (m.competitionId === compId) m.status = 'upcoming'; });
            this.update();
        }
    },

    addMatch(matchData) {
        this.matches.push({ id: 'match-' + Date.now(), ...matchData, status: 'upcoming' });
        this.update();
    },

    updateMatch(matchId, matchData) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            Object.assign(match, matchData);
            this.update();
        }
    },

    setAdmin(val) {
        this.isAdmin = val;
        this.notify();
    },

    submitEventResult(compId, teamId, participantName, value, dq = false) {
        const existing = this.eventResults.find(r => r.competitionId === compId && r.teamId === teamId && r.participantName === participantName);
        if (existing) { existing.value = value; existing.dq = dq; }
        else { this.eventResults.push({ competitionId: compId, teamId, participantName: participantName || '', value, dq }); }
        this.update();
    },

    removeEventResult(compId, teamId, participantName) {
        this.eventResults = this.eventResults.filter(r => !(r.competitionId === compId && r.teamId === teamId && r.participantName === participantName));
        this.update();
    },

    calculatePoints() {
        this.teams.forEach(t => { t.calaveritaPoints = 0; t.cuentosPoints = 0; t.catrinesPoints = 0; t.altaresPoints = 0; t.lapidaPoints = 0; });
        const getField = (type) => type + 'Points';
        const parseVal = (val) => {
            if (!val || val === '0' || val === 'DQ') return 0;
            if (typeof val === 'number') return val;
            const sVal = String(val).trim();
            if (sVal.includes(':')) {
                const parts = sVal.split(':');
                return (parseInt(parts[0]) * 60) + (parseFloat(parts[1] || 0));
            }
            return parseFloat(sVal) || 0;
        };

        this.competitions.forEach(comp => {
            const field = getField(comp.type);
            const processed = new Set(); 
            let lastValue = null;
            let pointsToGive = 0;

            const results = this.eventResults
                .filter(r => r.competitionId === comp.id && !r.dq && r.value && parseVal(r.value) > 0)
                .sort((a, b) => {
                    const vA = parseVal(a.value); const vB = parseVal(b.value);
                    return vB - vA; // Puntos decrecientes (Formato Ranking)
                });

            let densePos = 0;
            results.forEach((res) => {
                const currentVal = parseVal(res.value);
                
                if (currentVal !== lastValue) {
                    densePos++;
                }
                pointsToGive = this.pointTable[densePos - 1] || 0;

                const team = this.teams.find(t => t.id === res.teamId);
                if (team && !processed.has(res.teamId + res.participantName)) {
                    team[field] += pointsToGive;
                    processed.add(res.teamId + res.participantName);
                }
                lastValue = currentVal;
            });
        });

        this.teams.forEach(t => {
            const penalties = Math.floor((t.amonestaciones || 0) / 3) * 5;
            t.totalPoints = t.calaveritaPoints + t.cuentosPoints + t.catrinesPoints + t.altaresPoints + t.lapidaPoints - penalties;
        });
    },

    notify() { window.dispatchEvent(new CustomEvent('stateChanged')); }
};

State.init();
