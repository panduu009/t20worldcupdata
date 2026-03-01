// Utility to populate Firestore with current mock data
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";

const mockLiveMatches = [
    {
        id: "m6",
        matchType: "T20 World Cup 2026",
        status: "live",
        team1: { name: "IND", score: "210/3", overs: "19.1" },
        team2: { name: "AUS", score: "0/0", overs: "0.0" },
        toss: "Australia won the toss and elected to bowl",
        currentBatsmen: [
            { name: "Rohit Sharma", runs: 92, balls: 48, fours: 8, sixes: 6, strikeRate: 191.6, impact: "+4.5" },
            { name: "Virat Kohli", runs: 65, balls: 42, fours: 5, sixes: 2, strikeRate: 154.7, impact: "+2.8" }
        ],
        currentBowler: { name: "Mitchell Starc", overs: "3.1", runs: 42, wickets: 1, economy: 13.2, impact: "-1.5" },
        recentBalls: ["6", "4", "1", "6", "1", "W"],
        analytics: {
            rr: "10.97",
            rrr: "N/A",
            winProb: { team1: 82, team2: 18 },
            phases: { powerplay: "65/1", middle: "115/2", death: "30/0" },
            partnership: { runs: 120, balls: 72 },
            headToHead: { ind: 16, aus: 11 }
        }
    },
    {
        id: "m2",
        matchType: "T20 World Cup 2026",
        status: "completed",
        team1: { name: "ENG", score: "165/8", overs: "20.0" },
        team2: { name: "RSA", score: "168/5", overs: "19.2" },
        result: "South Africa won by 5 wickets",
        toss: "England won the toss and elected to bat",
        playerOfMatch: "Heinrich Klaasen",
        analytics: {
            rr: "8.75",
            rrr: "0.00",
            winProb: { team1: 0, team2: 100 },
            phases: { powerplay: "45/2", middle: "75/3", death: "48/0" },
            partnership: { runs: 55, balls: 32 },
            headToHead: { eng: 12, rsa: 14 }
        }
    },
    {
        id: "m3",
        matchType: "T20 World Cup 2026",
        status: "live",
        team1: { name: "SL", score: "145/6", overs: "16.4" },
        team2: { name: "NZ", score: "0/0", overs: "0.0" },
        toss: "Sri Lanka won the toss and elected to bat",
        currentBatsmen: [
            { name: "Kusal M.", runs: 42, balls: 28, fours: 4, sixes: 1, strikeRate: 150.0, impact: "+1.2" },
            { name: "Dasun S.", runs: 18, balls: 14, fours: 1, sixes: 1, strikeRate: 128.5, impact: "+0.5" }
        ],
        currentBowler: { name: "Trent Boult", overs: "3.4", runs: 28, wickets: 2, economy: 8.2, impact: "+1.5" },
        recentBalls: ["1", "4", "2", "W", "1", "0"],
        analytics: {
            rr: "8.70",
            rrr: "N/A",
            winProb: { team1: 60, team2: 40 },
            phases: { powerplay: "52/2", middle: "78/3", death: "15/1" },
            partnership: { runs: 25, balls: 18 },
            headToHead: { sl: 11, nz: 13 }
        }
    },
    {
        id: "m4",
        matchType: "T20 World Cup 2026 - Super 8",
        status: "live",
        team1: { name: "PAK", score: "142/3", overs: "15.4" },
        team2: { name: "SL", score: "0/0", overs: "0.0" },
        toss: "Pakistan won the toss and elected to bat",
        currentBatsmen: [
            { name: "Babar Azam", runs: 58, balls: 42, fours: 5, sixes: 1, strikeRate: 138.1, impact: "+1.8" },
            { name: "Mohammad Rizwan", runs: 45, balls: 35, fours: 3, sixes: 1, strikeRate: 128.5, impact: "+1.2" }
        ],
        currentBowler: { name: "Maheesh Theekshana", overs: "3.0", runs: 22, wickets: 1, economy: 7.3, impact: "+0.8" },
        recentBalls: ["1", "0", "1", "4", "2", "1"],
        analytics: {
            rr: "9.06",
            rrr: "N/A",
            winProb: { team1: 65, team2: 35 },
            phases: { powerplay: "48/1", middle: "78/2", death: "16/0" },
            partnership: { runs: 82, balls: 60 },
            headToHead: { pak: 14, sl: 9 }
        }
    }
];

const mockStatistics = [
    {
        type: 'batting', title: 'Top Run Scorers', players: [
            { name: 'Babar Azam', team: 'PAK', value: 345 },
            { name: 'Travis Head', team: 'AUS', value: 310 },
            { name: 'Jos Buttler', team: 'ENG', value: 280 }
        ]
    },
    {
        type: 'bowling', title: 'Top Wicket Takers', players: [
            { name: 'Wanindu Hasaranga', team: 'SL', value: 18 },
            { name: 'Rashid Khan', team: 'AFG', value: 16 },
            { name: 'Kagiso Rabada', team: 'RSA', value: 15 }
        ]
    },
    {
        type: 'sixes', title: 'Most Sixes', players: [
            { name: 'Nicholas Pooran', team: 'WI', value: 22 },
            { name: 'Heinrich Klaasen', team: 'RSA', value: 19 },
            { name: 'Glenn Maxwell', team: 'AUS', value: 18 }
        ]
    },
    {
        type: 'totals', title: 'Highest Team Totals', players: [
            { name: 'West Indies', vs: 'USA', value: '235/4' },
            { name: 'Australia', vs: 'ENG', value: '220/5' },
            { name: 'South Africa', vs: 'SL', value: '215/6' }
        ]
    }
];

const mockPredictions = {
    contenders: [
        { name: 'AUS', value: 28, color: '#f59e0b' },
        { name: 'ENG', value: 24, color: '#ef4444' },
        { name: 'WI', value: 18, color: '#8b5cf6' },
        { name: 'RSA', value: 15, color: '#10b981' },
        { name: 'PAK', value: 10, color: '#3b82f6' }
    ],
    qualifications: [
        {
            group: 'Group A', teams: [
                { name: 'South Africa', prob: '95%', status: 'success' },
                { name: 'Sri Lanka', prob: '70%', status: 'primary' }
            ]
        },
        {
            group: 'Group B', teams: [
                { name: 'Australia', prob: '92%', status: 'success' },
                { name: 'West Indies', prob: '65%', status: 'primary' }
            ]
        }
    ],
    goldenBat: [
        { name: 'Jos Buttler', team: 'ENG', prob: '18%' },
        { name: 'Travis Head', team: 'AUS', prob: '15%' },
        { name: 'Nicholas Pooran', team: 'WI', prob: '12%' }
    ],
    goldenBall: [
        { name: 'Wanindu Hasaranga', team: 'SL', prob: '22%' },
        { name: 'Jofra Archer', team: 'ENG', prob: '16%' },
        { name: 'Rashid Khan', team: 'AFG', prob: '14%' }
    ]
};

export async function populateFirestore() {
    console.log("Starting Firestore migration...");

    // 1. Clear and Populate Matches
    const matchesCol = collection(db, 'matches');
    const matchSnapshot = await getDocs(matchesCol);
    for (const doc of matchSnapshot.docs) await deleteDoc(doc.ref);
    for (const match of mockLiveMatches) await addDoc(matchesCol, match);

    // 2. Clear and Populate Statistics
    const statsCol = collection(db, 'statistics');
    const statsSnapshot = await getDocs(statsCol);
    for (const doc of statsSnapshot.docs) await deleteDoc(doc.ref);
    for (const stat of mockStatistics) await addDoc(statsCol, stat);

    // 3. Clear and Populate Predictions
    const predCol = collection(db, 'predictions');
    const predSnapshot = await getDocs(predCol);
    for (const doc of predSnapshot.docs) await deleteDoc(doc.ref);
    await addDoc(predCol, mockPredictions);

    console.log("Firestore migration complete!");
    alert("Firebase database populated with mock data!");
}

// Attach to window for easy console trigger if needed
window.populateFirestore = populateFirestore;
