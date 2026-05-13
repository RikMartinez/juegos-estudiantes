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
    pointTable: [25, 21, 18, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],

    init() {
        if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('REEMPLAZAR')) {
            try {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.isCloudEnabled = true;
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
            localStorage.setItem('estudiantes-games-v2', JSON.stringify(dataToSave));
            if (this.isCloudEnabled && this.db) {
                this.db.ref('tournament_v2').set(dataToSave);
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
            const saved = localStorage.getItem('estudiantes-games-v2');
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
        this.teams.push({ id: 'team-' + Date.now(), name, color, deportivaPoints: 0, mentalPoints: 0, atletismoPoints: 0, amonestaciones: 0 });
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

    addCompetition(name, type, format = 'bracket', category = 'Mixto') {
        this.competitions.push({ id: 'comp-' + Date.now(), name, type, format, category });
        this.update();
    },

    finishCompetition(compId) {
        const comp = this.competitions.find(c => c.id === compId);
        if (comp) {
            comp.status = 'finished';
            this.matches.forEach(m => { if (m.competitionId === compId) m.status = 'finished'; });
            this.update();
        }
    },

    reopenCompetition(compId) {
        const comp = this.competitions.find(c => c.id === compId);
        if (comp) {
            delete comp.status;
            this.matches.forEach(m => { if (m.competitionId === compId) m.status = 'upcoming'; });
            this.update();
        }
    },

    reopenMatch(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            match.status = 'upcoming';
            this.advanceWinner(match);
            this.update();
        }
    },

    advanceWinner(match) {
        const comp = this.competitions.find(c => c.id === match.competitionId);
        if (!comp || comp.format !== 'bracket' || match.round === 'final') return;

        const nextRoundMap = { 'dieciseisavos': 'octavos', 'octavos': 'cuartos', 'cuartos': 'semifinal', 'semifinal': 'final' };
        const nextRound = nextRoundMap[match.round];
        if (!nextRound) return;

        const nextMatchNum = Math.ceil(parseInt(match.matchNum) / 2);
        const nextMatch = this.matches.find(m => m.competitionId === match.competitionId && m.round === nextRound && parseInt(m.matchNum) === nextMatchNum);

        let winnerId = null;
        if (match.status === 'finished') {
            if (match.team1DQ && match.team2DQ) {
                winnerId = 'DESIERTO';
            } else if (match.team1DQ) {
                winnerId = match.team2Id;
            } else if (match.team2DQ) {
                winnerId = match.team1Id;
            } else if (match.team2Id === 'DESIERTO') {
                winnerId = match.team1Id; // Avanza el equipo real aunque sea 0-0
            } else if (match.team1Id === 'DESIERTO') {
                winnerId = match.team2Id; // Avanza el equipo real aunque sea 0-0
            } else if (match.team1Score > match.team2Score) {
                winnerId = match.team1Id;
            } else if (match.team2Score > match.team1Score) {
                winnerId = match.team2Id;
            }
        }

        if (nextMatch) {
            if (parseInt(match.matchNum) % 2 !== 0) nextMatch.team1Id = winnerId;
            else nextMatch.team2Id = winnerId;
            
            // Si el siguiente estaba finalizado, limpiar en cascada
            if (nextMatch.status === 'finished') this.advanceWinner(nextMatch);
        } else if (winnerId) {
            this.matches.push({
                id: 'match-' + Date.now() + Math.random(),
                competitionId: match.competitionId,
                round: nextRound,
                matchNum: nextMatchNum,
                team1Id: parseInt(match.matchNum) % 2 !== 0 ? winnerId : '?',
                team2Id: parseInt(match.matchNum) % 2 === 0 ? winnerId : '?',
                status: 'upcoming', team1Score: 0, team2Score: 0
            });
        }
    },

    addMatch(matchData) {
        this.matches.push({ id: 'match-' + Date.now(), ...matchData, status: 'upcoming', team1Score: 0, team2Score: 0 });
        this.update();
    },

    updateMatch(matchId, matchData) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            Object.assign(match, matchData);
            this.advanceWinner(match);
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
            match.status = isFinished ? 'finished' : 'in-progress';
            this.advanceWinner(match);
            this.update();
        }
    },

    submitEventResult(compId, teamId, participantName, value, dq = false) {
        const existing = this.eventResults.find(r => r.competitionId === compId && r.teamId === teamId && r.participantName === participantName);
        if (existing) { existing.value = value; existing.dq = dq; }
        else { this.eventResults.push({ competitionId: compId, teamId, participantName: participantName || '', value, dq }); }
        this.update();
    },

    calculatePoints() {
        this.teams.forEach(t => { t.deportivaPoints = 0; t.mentalPoints = 0; t.atletismoPoints = 0; });
        const getField = (type) => type === 'mental' ? 'mentalPoints' : (type === 'atletismo' ? 'atletismoPoints' : 'deportivaPoints');
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
            let rankedTeams = []; 
            if (comp.format === 'bracket') {
                const roundWeight = { 'final': 5, 'semifinal': 4, 'cuartos': 3, 'octavos': 2, 'dieciseisavos': 1 };
                const teamStats = {};
                this.teams.forEach(t => teamStats[t.id] = { maxRound: -1, pf: 0, pa: 0, diff: 0, id: t.id });
                this.matches.filter(m => m.competitionId === comp.id && m.status === 'finished').forEach(m => {
                    const s1 = parseInt(m.team1Score) || 0; const s2 = parseInt(m.team2Score) || 0;
                    const t1 = teamStats[m.team1Id]; const t2 = teamStats[m.team2Id];
                    if (t1) { t1.pf += s1; t1.pa += s2; t1.diff = t1.pf - t1.pa; t1.maxRound = Math.max(t1.maxRound, m.round === 'final' && s1 > s2 ? 6 : roundWeight[m.round]); }
                    if (t2) { t2.pf += s2; t2.pa += s1; t2.diff = t2.pf - t2.pa; t2.maxRound = Math.max(t2.maxRound, m.round === 'final' && s2 > s1 ? 6 : roundWeight[m.round]); }
                });
                rankedTeams = Object.values(teamStats).filter(s => s.maxRound >= 0).sort((a, b) => b.maxRound !== a.maxRound ? b.maxRound - a.maxRound : (comp.type === 'deportiva' ? (b.diff !== a.diff ? b.diff - a.diff : b.pf - a.pf) : 0)).map(s => s.id);
            } else {
                rankedTeams = this.eventResults.filter(r => r.competitionId === comp.id && !r.dq && r.value).sort((a, b) => {
                    const vA = parseVal(a.value); const vB = parseVal(b.value);
                    return comp.format === 'ranking' ? vB - vA : vA - vB;
                }).map(r => r.teamId);
            }
            const field = getField(comp.type);
            const processed = new Set(); let tableIndex = 0;
            rankedTeams.forEach(tId => {
                if (!processed.has(tId) && tableIndex < this.pointTable.length) {
                    const team = this.teams.find(t => t.id === tId);
                    if (team) { team[field] += this.pointTable[tableIndex]; tableIndex++; processed.add(tId); }
                }
            });
        });
        this.teams.forEach(t => {
            const penalties = Math.floor((t.amonestaciones || 0) / 3) * 5;
            t.totalPoints = t.deportivaPoints + t.mentalPoints + t.atletismoPoints - penalties;
        });
    },

    notify() { window.dispatchEvent(new CustomEvent('stateChanged')); }
};

State.init();
