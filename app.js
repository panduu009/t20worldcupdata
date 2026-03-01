// T20 World Cup Analytics Application Logic
import { db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

// Reactive state
let liveMatches = [];
let statistics = [];
let predictions = null;

// Initialize Firestore Listeners
const mainContent = document.getElementById('main-content');

// Matches Listener
onSnapshot(query(collection(db, 'matches')), (snapshot) => {
    liveMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    refreshCurrentView();
});

// Statistics Listener
onSnapshot(collection(db, 'statistics'), (snapshot) => {
    statistics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    refreshCurrentView();
});

// Predictions Listener
onSnapshot(collection(db, 'predictions'), (snapshot) => {
    if (!snapshot.empty) {
        predictions = snapshot.docs[0].data();
        refreshCurrentView();
    }
});

function refreshCurrentView() {
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab && mainContent) {
        const tab = activeTab.getAttribute('data-tab');
        renderView(tab, mainContent);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const mainContent = document.getElementById('main-content');

    // Navigation logic
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            e.target.classList.add('active');

            // Render view based on tab
            const tab = e.target.getAttribute('data-tab');
            renderView(tab, mainContent);
        });
    });

    // Initial render
    renderView('live', mainContent);

    // Initial DB (Temporary)
    const initBtn = document.getElementById('init-db-btn');
    if (initBtn) {
        initBtn.addEventListener('click', () => {
            import('./populate-firestore.js').then(m => m.populateFirestore());
        });
    }
});

// View Routing
function renderView(view, container) {
    container.innerHTML = ''; // Clear current content

    switch (view) {
        case 'live':
            renderLiveDashboard(container);
            break;
        case 'scoreboards':
            renderScoreboards(container);
            break;
        case 'ball-by-ball':
            renderBallByBall(container);
            break;
        case 'live-stats':
            renderLiveStatistics(container);
            break;
        case 'analytics':
            renderMatchAnalytics(container);
            break;
        case 'tournament-analytics':
            renderTournamentAnalytics(container);
            break;
        case 'points-table':
            renderPointsTable(container);
            break;
        default:
            renderLiveDashboard(container);
    }

    // Re-initialize icons for new content
    lucide.createIcons();
}

// Components
function renderLiveDashboard(container) {
    const title = document.createElement('h2');
    title.className = 'mb-4';
    title.style.fontSize = '2rem';
    title.innerText = 'Live Matches';

    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';

    liveMatches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'card';

        const isLive = match.status === 'live';
        const badgeHtml = isLive
            ? `<div class="badge live">Live</div>`
            : `<div class="badge" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">${match.status}</div>`;

        // Card Header
        let html = `
            <div class="flex-between mb-4">
                <span class="text-muted text-sm" style="font-size: 0.875rem;">${match.matchType}</span>
                ${badgeHtml}
            </div>
        `;

        // Teams Layout
        html += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                <!-- Team 1 -->
                <div class="flex-between">
                    <div class="team-name">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-secondary); border: var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">${match.team1.name}</div>
                        ${match.team1.name}
                    </div>
                    <div style="text-align: right;">
                        <div class="score-highlight">${match.team1.score}</div>
                        <div class="text-muted text-sm">(${match.team1.overs} ov)</div>
                    </div>
                </div>
                
                <!-- Team 2 -->
                <div class="flex-between">
                    <div class="team-name">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-secondary); border: var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">${match.team2.name}</div>
                        ${match.team2.name}
                    </div>
                    <div style="text-align: right;">
                        <div class="score-highlight" style="opacity: ${isLive && match.team2.overs === "0.0" ? '0.5' : '1'}">${match.team2.score}</div>
                        <div class="text-muted text-sm">(${match.team2.overs} ov)</div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Analytics Summary -->
            <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 0.75rem; margin-bottom: 1.5rem; border: var(--glass-border);">
                <div class="flex-between mb-2" style="font-size: 0.875rem;">
                    <div><span class="text-muted">RR:</span> <span style="font-family: var(--font-mono); font-weight: 600;">${match.analytics.rr}</span></div>
                    <div><span class="text-muted">RRR:</span> <span style="font-family: var(--font-mono); font-weight: 600;">${match.analytics.rrr}</span></div>
                </div>
                ${isLive ? `
                    <div>
                        <div class="flex-between mb-1" style="font-size: 0.75rem; text-transform: uppercase;">
                            <span>Win Probability</span>
                            <span style="color: var(--accent-primary); font-weight: 700;">${match.team1.name} ${match.analytics.winProb.team1}%</span>
                        </div>
                        <div class="progress-bar-bg" style="height: 6px;">
                            <div class="progress-bar-fill" style="width: ${match.analytics.winProb.team1}%;"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Match context (toss/result/current batters)
        html += `<div style="padding-top: 1rem; border-top: var(--glass-border);">`;

        if (isLive) {
            html += `<p class="text-accent-primary" style="color: var(--accent-primary); font-size: 0.875rem; margin-bottom: 0.5rem;"><i data-lucide="info" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i> ${match.toss}</p>`;

            // Render recent balls string
            const ballsHtml = match.recentBalls.map(b => {
                let colorClass = 'text-muted';
                if (b === 'W') colorClass = 'text-danger';
                if (b === '4' || b === '6') colorClass = 'text-success';
                return `<span class="${colorClass}" style="width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-secondary); border-radius: 50%; margin-right: 4px; font-size: 0.75rem; font-family: var(--font-mono); border: var(--glass-border);">${b}</span>`;
            }).join('');

            html += `
                <div style="margin-top: 1rem;">
                    <div class="text-sm text-muted mb-1" style="font-size: 0.75rem; text-transform: uppercase;">Recent Balls</div>
                    <div>${ballsHtml}</div>
                </div>
            `;
        } else {
            html += `<p style="color: var(--text-primary); font-weight: 500; font-size: 0.875rem;"><i data-lucide="award" style="width: 16px; height: 16px; display: inline; vertical-align: middle; color: var(--accent-warning);"></i> ${match.result}</p>`;
        }

        html += `</div>`;
        card.innerHTML = html;
        grid.appendChild(card);
    });

    container.appendChild(title);
    container.appendChild(grid);
}

function renderScoreboards(container) {
    const title = document.createElement('h2');
    title.className = 'mb-4';
    title.style.fontSize = '2rem';
    title.innerText = 'Tournament Scoreboards';
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(600px, 1fr))';
    container.appendChild(grid);

    liveMatches.forEach(m => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '0';
        card.style.overflow = 'hidden';
        card.style.marginBottom = '2rem';

        const headerColor = m.status === 'live' ? 'var(--accent-primary)' : 'var(--text-muted)';

        card.innerHTML = `
            <div style="padding: 1.5rem; border-bottom: var(--glass-border); background: rgba(255,255,255,0.02);">
                <div class="flex-between mb-2">
                    <span class="badge" style="background: ${m.status === 'live' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)'}; color: ${headerColor};">
                        ${m.matchType} - ${m.status.toUpperCase()}
                    </span>
                    <span class="text-muted text-sm">${m.toss}</span>
                </div>
                <h3 style="font-size: 1.5rem; margin: 0.5rem 0;">${m.team1.name} vs ${m.team2.name}</h3>
                ${m.result ? `<div style="color: var(--accent-success); font-weight: 600; margin-top: 0.5rem;">${m.result}</div>` : ''}
            </div>
            
            <div class="table-responsive" style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
                            <th style="padding: 1rem 1.5rem; text-align: left; color: var(--text-muted); font-weight: 500;">Batter</th>
                            <th style="padding: 1rem 1.5rem; text-align: left; color: var(--text-muted); font-weight: 500;">Status</th>
                            <th style="padding: 1rem; text-align: right; color: var(--text-muted); font-weight: 500;">R</th>
                            <th style="padding: 1rem; text-align: right; color: var(--text-muted); font-weight: 500;">B</th>
                            <th style="padding: 1rem; text-align: right; color: var(--text-muted); font-weight: 500;">4s</th>
                            <th style="padding: 1rem; text-align: right; color: var(--text-muted); font-weight: 500;">6s</th>
                            <th style="padding: 1rem; text-align: right; color: var(--text-muted); font-weight: 500;">SR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${m.currentBatsmen ? m.currentBatsmen.map(b => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: ${m.status === 'live' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'};">
                                <td style="padding: 1rem 1.5rem; font-family: var(--font-sans); color: ${m.status === 'live' ? 'var(--accent-primary)' : 'var(--text-primary)'}; font-weight: 600;">
                                    ${b.name} <span style="font-size: 0.75rem; color: var(--accent-warning);">*</span><br>
                                    <span style="font-size: 0.75rem; color: var(--accent-success);">Impact: ${b.impact}</span>
                                </td>
                                <td style="padding: 1rem 1.5rem; font-family: var(--font-sans); color: var(--text-muted); font-size: 0.875rem;">batting</td>
                                <td style="padding: 1rem; text-align: right; font-weight: 700; color: var(--text-primary);">${b.runs}</td>
                                <td style="padding: 1rem; text-align: right; color: var(--text-primary);">${b.balls}</td>
                                <td style="padding: 1rem; text-align: right; color: var(--text-primary);">${b.fours}</td>
                                <td style="padding: 1rem; text-align: right; color: var(--text-primary);">${b.sixes}</td>
                                <td style="padding: 1rem; text-align: right; color: var(--text-primary);">${b.strikeRate.toFixed(2)}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="7" style="padding: 2rem; text-align: center; color: var(--text-muted);">Detailed historical scoreboard data compressed for summary view.</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
            
            <div style="padding: 1rem 1.5rem; background: var(--bg-secondary); border-top: var(--glass-border);">
                <div class="flex-between">
                    <span style="font-weight: 600;">Team Score</span>
                    <span style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700;">
                        ${m.team1.score} <span class="text-muted" style="font-size: 1rem; font-weight: 400;">(${m.team1.overs} ov)</span>
                    </span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderBallByBall(container) {
    const title = document.createElement('h2');
    title.className = 'mb-4';
    title.style.fontSize = '2rem';
    title.innerText = 'Ball-by-Ball Commentary';
    container.appendChild(title);

    // Mock Ball-by-ball Data
    const oversData = [
        {
            overScore: "18",
            runs: "12",
            bowler: "Pat Cummins",
            balls: [
                { ball: "18.2", run: "1", type: "run", desc: "Cummins to Pandya, 1 run. Slower ball, flicked towards deep square leg." },
                { ball: "18.1", run: "6", type: "six", desc: "Cummins to Suryakumar, SIX. What a shot! Picked up the slower bouncer and dispatched it over deep backward square leg." },
                { ball: "18.0", run: "W", type: "wicket", desc: "Cummins to Pant, OUT! Run out (Maxwell). Pant tapped it to point and took off, but Maxwell was quick to the ball and achieved a direct hit." }
            ]
        },
        {
            overScore: "17",
            runs: "8",
            bowler: "Josh Hazlewood",
            balls: [
                { ball: "17.6", run: "1", type: "run", desc: "Hazlewood to Pant, 1 run. Cut away nicely to deep point." },
                { ball: "17.5", run: "4", type: "four", desc: "Hazlewood to Pant, FOUR. Brilliant timing, straight past the bowler." },
                { ball: "17.4", run: "1", type: "run", desc: "Hazlewood to Suryakumar, 1 run. Played down to long-on." },
                { ball: "17.3", run: "1", type: "run", desc: "Hazlewood to Pant, 1 run. Slower ball, nudged." },
                { ball: "17.2", run: "0", type: "dot", desc: "Hazlewood to Pant, no run. Swings and misses." },
                { ball: "17.1", run: "1", type: "run", desc: "Hazlewood to Suryakumar, 1 run. Driven to cover." }
            ]
        }
    ];

    const timelineContainer = document.createElement('div');
    timelineContainer.style.display = 'flex';
    timelineContainer.style.flexDirection = 'column';
    timelineContainer.style.gap = '1.5rem';
    timelineContainer.style.position = 'relative';

    // Timeline line
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.left = '48px';
    line.style.top = '0';
    line.style.bottom = '0';
    line.style.width = '2px';
    line.style.background = 'var(--glass-border)';
    line.style.zIndex = '0';
    timelineContainer.appendChild(line);

    oversData.forEach(over => {
        // Over Header
        const overHeader = document.createElement('div');
        overHeader.style.display = 'flex';
        overHeader.style.alignItems = 'center';
        overHeader.style.gap = '1rem';
        overHeader.style.position = 'relative';
        overHeader.style.zIndex = '1';
        overHeader.style.padding = '0.5rem 1rem';
        overHeader.style.background = 'var(--bg-card)';
        overHeader.style.borderRadius = '8px';
        overHeader.style.border = 'var(--glass-border)';
        overHeader.style.boxShadow = 'var(--shadow-sm)';

        overHeader.innerHTML = `
            <div style="font-weight: 700; color: var(--text-primary);">END OF OVER ${over.overScore}</div>
            <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
            <div style="font-family: var(--font-sans); font-size: 0.875rem;">
                <span style="color: var(--text-muted);">Runs:</span> <span style="font-weight: 700; font-family: var(--font-mono);">${over.runs}</span> 
                <span style="color: var(--text-muted); margin-left: 0.5rem;">Bowler:</span> <span style="font-weight: 500;">${over.bowler}</span>
            </div>
        `;
        timelineContainer.appendChild(overHeader);

        // Balls
        over.balls.forEach(ball => {
            const ballItem = document.createElement('div');
            ballItem.style.display = 'flex';
            ballItem.style.gap = '1.5rem';
            ballItem.style.position = 'relative';
            ballItem.style.zIndex = '1';
            ballItem.style.paddingLeft = '0.5rem';

            let bgColor = 'var(--bg-secondary)';
            let textColor = 'var(--text-primary)';
            let borderColor = 'var(--glass-border)';

            if (ball.type === 'wicket') {
                bgColor = 'rgba(239, 68, 68, 0.1)';
                textColor = 'var(--accent-danger)';
                borderColor = 'rgba(239, 68, 68, 0.3)';
            } else if (ball.type === 'four' || ball.type === 'six') {
                bgColor = 'rgba(16, 185, 129, 0.1)';
                textColor = 'var(--accent-success)';
                borderColor = 'rgba(16, 185, 129, 0.3)';
            }

            ballItem.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; width: 64px; flex-shrink: 0;">
                    <div style="font-family: var(--font-mono); font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">${ball.ball}</div>
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${bgColor}; border: 1px solid ${borderColor}; color: ${textColor}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-mono); box-shadow: var(--shadow-sm);">${ball.run}</div>
                </div>
                <div class="card" style="flex: 1; padding: 1rem; border-left: 2px solid ${borderColor}; margin-top: 0.5rem;">
                    <p style="margin: 0; font-size: 0.95rem; color: var(--text-primary); line-height: 1.6;">${ball.desc}</p>
                </div>
            `;
            timelineContainer.appendChild(ballItem);
        });
    });

    container.appendChild(timelineContainer);
}

function renderLiveStatistics(container) {
    const title = document.createElement('h2');
    title.className = 'mb-4';
    title.style.fontSize = '2rem';
    title.innerText = 'Live 2026 Statistics';
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';

    if (statistics.length === 0) {
        grid.innerHTML = '<div class="card"><p class="text-muted">Loading statistics...</p></div>';
    } else {
        statistics.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'card';

            let icon = 'bar-chart-2';
            let color = 'var(--accent-primary)';
            if (stat.type === 'bowling') { icon = 'target'; color = 'var(--accent-danger)'; }
            if (stat.type === 'sixes') { icon = 'zap'; color = 'var(--accent-warning)'; }
            if (stat.type === 'totals') { icon = 'trending-up'; color = 'var(--accent-success)'; }

            let listHtml = stat.players.map((p, i) => `
                <li style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: ${i < stat.players.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">
                    <span>${i + 1}. ${p.name} ${p.team ? `(${p.team})` : (p.vs ? `(vs ${p.vs})` : '')}</span>
                    <span style="font-weight: 700;">${p.value}</span>
                </li>
            `).join('');

            card.innerHTML = `
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <i data-lucide="${icon}" style="color: ${color};"></i> ${stat.title}
                </h3>
                <ul style="list-style: none; padding: 0;">${listHtml}</ul>
            `;
            grid.appendChild(card);
        });
    }

    container.appendChild(grid);
}

function renderMatchAnalytics(container) {
    const title = document.createElement('h2');
    title.className = 'mb-4';
    title.style.fontSize = '2rem';
    title.innerHTML = 'Advanced Match Analytics <span class="text-muted" style="font-size: 1rem; font-weight: 400;">(IND vs AUS - Live)</span>';
    container.appendChild(title);

    const m = liveMatches[0]; // Using the IND vs AUS match data (index 0)

    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';

    // 1. Win Predictor Chart
    const winPredictorCard = document.createElement('div');
    winPredictorCard.className = 'card';
    winPredictorCard.innerHTML = `
        <h3 class="mb-4 flex-between"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="pie-chart" class="text-accent-primary"></i> AI Win Prediction</span></h3>
        <div class="chart-container small">
            <canvas id="winChart"></canvas>
        </div>
        <div class="flex-between mt-4" style="margin-top: 1rem;">
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-primary); font-family: var(--font-mono);">${m.analytics.winProb.team1}%</div>
                <div class="text-muted text-sm">${m.team1.name}</div>
            </div>
            <div style="text-align: center;">
                 <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-warning); font-family: var(--font-mono);">${m.analytics.winProb.team2}%</div>
                 <div class="text-muted text-sm">${m.team2.name}</div>
            </div>
        </div>
    `;
    grid.appendChild(winPredictorCard);

    // 2. Phase-wise Analysis
    const phaseCard = document.createElement('div');
    phaseCard.className = 'card';
    phaseCard.innerHTML = `
        <h3 class="mb-4 flex-between"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="bar-chart" class="text-accent-success"></i> Phase-wise Analysis</span></h3>
        <div class="chart-container small">
            <canvas id="phaseChart"></canvas>
        </div>
    `;
    grid.appendChild(phaseCard);

    // 3. Current Partnership
    const partnershipCard = document.createElement('div');
    partnershipCard.className = 'card';
    partnershipCard.innerHTML = `
        <h3 class="mb-4 flex-between"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="users" class="text-accent-warning"></i> Current Partnership</span></h3>
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="font-family: var(--font-mono); font-size: 2.5rem; font-weight: 700;">${m.analytics.partnership.runs} <span class="text-muted" style="font-size: 1rem; font-weight: 400;">runs</span></div>
            <div class="text-muted">${m.analytics.partnership.balls} balls (RR: ${(m.analytics.partnership.runs / (m.analytics.partnership.balls / 6)).toFixed(2)})</div>
        </div>
        <div class="flex-between mb-2">
            <span style="font-weight: 600;">Babar Azam</span>
            <span style="font-weight: 600;">M. Rizwan</span>
        </div>
        <div style="display: flex; height: 12px; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,0.1);">
            <div style="width: ${(58 / 82) * 100}%; background: var(--accent-primary);"></div>
            <div style="width: ${(24 / 82) * 100}%; background: var(--accent-secondary);"></div>
        </div>
        <div class="flex-between mt-2 text-muted text-sm" style="margin-top: 0.5rem; font-size: 0.875rem;">
            <span>58 (42)</span>
            <span>24 (18)</span>
        </div>
    `;
    grid.appendChild(partnershipCard);

    // 4. Head-to-Head & Wagon Wheel (Mock)
    const extraCard = document.createElement('div');
    extraCard.className = 'card';
    extraCard.innerHTML = `
        <h3 class="mb-4 flex-between"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="history" class="text-accent-danger"></i> Head-to-Head (T20I)</span></h3>
        
        <div class="flex-between mb-2">
            <div class="team-name">${m.team1.name}</div>
            <div class="team-name">${m.team2.name}</div>
        </div>
        <div style="display: flex; height: 16px; border-radius: 4px; overflow: hidden; background: rgba(255,255,255,0.1); margin-bottom: 2rem;">
            <div style="width: ${(m.analytics.headToHead.ind / (m.analytics.headToHead.ind + m.analytics.headToHead.aus)) * 100}%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">${m.analytics.headToHead.ind}</div>
            <div style="width: ${(m.analytics.headToHead.aus / (m.analytics.headToHead.ind + m.analytics.headToHead.aus)) * 100}%; background: var(--accent-warning); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: #000;">${m.analytics.headToHead.aus}</div>
        </div>

        <h3 class="mb-4 flex-between" style="font-size: 1rem;"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="crosshair" style="width: 16px; height: 16px;"></i> Wagon Wheel (Rohit Sharma)</span></h3>
        <div class="wagon-wheel-container">
            <!-- Mock wagon wheel lines representing runs scored -->
            <div class="wagon-line" style="height: 80px; transform: translateX(-50%) rotate(30deg);"></div>
            <div class="wagon-line" style="height: 60px; transform: translateX(-50%) rotate(90deg); background: var(--accent-primary);"></div>
            <div class="wagon-line" style="height: 90px; transform: translateX(-50%) rotate(-45deg); background: var(--accent-primary);"></div>
            <div class="wagon-line" style="height: 40px; transform: translateX(-50%) rotate(-120deg);"></div>
            <div class="wagon-line" style="height: 75px; transform: translateX(-50%) rotate(160deg); background: var(--accent-success);"></div>
            
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        </div>
    `;
    grid.appendChild(extraCard);

    container.appendChild(grid);

    // Initialize Charts after DOM injection
    requestAnimationFrame(() => {
        // Win predictor chart
        const ctxWin = document.getElementById('winChart').getContext('2d');
        new Chart(ctxWin, {
            type: 'doughnut',
            data: {
                labels: [m.team1.name, m.team2.name],
                datasets: [{
                    data: [m.analytics.winProb.team1, m.analytics.winProb.team2],
                    backgroundColor: ['#3b82f6', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Phase chart
        const ctxPhase = document.getElementById('phaseChart').getContext('2d');
        new Chart(ctxPhase, {
            type: 'bar',
            data: {
                labels: ['Powerplay', 'Middle', 'Death'],
                datasets: [{
                    label: 'Runs Scored',
                    data: [
                        parseInt(m.analytics.phases.powerplay.split('/')[0]),
                        parseInt(m.analytics.phases.middle.split('/')[0]),
                        parseInt(m.analytics.phases.death.split('/')[0])
                    ],
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    });
}

function renderTournamentAnalytics(container) {
    const title = document.createElement('h2');
    title.className = 'mb-4';
    title.style.fontSize = '2rem';
    title.innerHTML = '2026 Tournament Analytics <span class="text-muted" style="font-size: 1rem; font-weight: 400;">(Overall Predictions)</span>';
    container.appendChild(title);

    if (!predictions) {
        container.innerHTML += '<div class="card"><p class="text-muted">Loading predictions...</p></div>';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';

    // 1. Tournament Win Probability
    const winPredictorCard = document.createElement('div');
    winPredictorCard.className = 'card';
    winPredictorCard.innerHTML = `
        <h3 class="mb-4 flex-between"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="trophy" class="text-accent-warning"></i> Title Contenders</span></h3>
        <div class="chart-container small">
            <canvas id="tournamentWinChart"></canvas>
        </div>
    `;
    grid.appendChild(winPredictorCard);

    // 2. Group Stage Qualification
    const groupStageCard = document.createElement('div');
    groupStageCard.className = 'card';
    let qualHtml = predictions.qualifications.map(group => `
        <div class="mb-2 text-sm text-muted">${group.group}</div>
        ${group.teams.map(t => `
            <div class="flex-between mb-2">
                <span>${t.name}</span>
                <span style="font-weight: 600; color: var(--accent-${t.status});">${t.prob}</span>
            </div>
        `).join('')}
    `).join('<div style="margin-bottom: 1rem;"></div>');

    groupStageCard.innerHTML = `
        <h3 class="mb-4 flex-between"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="list" class="text-accent-primary"></i> Super 8 Qualification %</span></h3>
        ${qualHtml}
    `;
    grid.appendChild(groupStageCard);

    // 3. Top Run Scorer Predictor
    const runScorerCard = document.createElement('div');
    runScorerCard.className = 'card';
    let runHtml = predictions.goldenBat.map((p, i) => `
        <li class="flex-between" style="padding: 0.75rem 0; border-bottom: ${i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">
            <span>${i + 1}. ${p.name} (${p.team})</span>
            <span class="badge" style="background: rgba(139, 92, 246, 0.2); color: var(--accent-secondary);">${p.prob}</span>
        </li>
    `).join('');
    runScorerCard.innerHTML = `
        <h3 class="mb-4 flex-between"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="trending-up" class="text-accent-secondary"></i> Golden Bat Prediction</span></h3>
        <ul style="list-style: none; padding: 0;">${runHtml}</ul>
    `;
    grid.appendChild(runScorerCard);

    // 4. Top Wicket Taker Predictor
    const wicketTakerCard = document.createElement('div');
    wicketTakerCard.className = 'card';
    let wicketHtml = predictions.goldenBall.map((p, i) => `
        <li class="flex-between" style="padding: 0.75rem 0; border-bottom: ${i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">
            <span>${i + 1}. ${p.name} (${p.team})</span>
            <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: var(--accent-danger);">${p.prob}</span>
        </li>
    `).join('');
    wicketTakerCard.innerHTML = `
        <h3 class="mb-4 flex-between"><span style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="crosshair" class="text-accent-danger"></i> Golden Ball Prediction</span></h3>
        <ul style="list-style: none; padding: 0;">${wicketHtml}</ul>
    `;
    grid.appendChild(wicketTakerCard);

    container.appendChild(grid);

    // Initialize Chart
    requestAnimationFrame(() => {
        const ctxWin = document.getElementById('tournamentWinChart').getContext('2d');
        new Chart(ctxWin, {
            type: 'bar',
            data: {
                labels: predictions.contenders.map(c => c.name),
                datasets: [{
                    label: 'Win Probability (%)',
                    data: predictions.contenders.map(c => c.value),
                    backgroundColor: predictions.contenders.map(c => c.color),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 40,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    });
}

function renderPointsTable(container) {
    const title = document.createElement('h2');
    title.className = 'mb-4';
    title.style.fontSize = '2rem';
    title.innerText = 'Tournament Points Table';
    container.appendChild(title);

    const groups = [
        {
            name: "Group A",
            teams: [
                { pos: 1, name: "IND", p: 4, w: 4, l: 0, nr: 0, nrr: "+2.450", pts: 8, form: ["W", "W", "W", "W"] },
                { pos: 2, name: "AUS", p: 4, w: 3, l: 1, nr: 0, nrr: "+1.820", pts: 6, form: ["W", "W", "L", "W"] },
                { pos: 3, name: "USA", p: 4, w: 2, l: 2, nr: 0, nrr: "-0.210", pts: 4, form: ["W", "L", "W", "L"] },
                { pos: 4, name: "CAN", p: 4, w: 1, l: 3, nr: 0, nrr: "-1.100", pts: 2, form: ["L", "L", "W", "L"] },
                { pos: 5, name: "PAK", p: 4, w: 0, l: 4, nr: 0, nrr: "-2.550", pts: 0, form: ["L", "L", "L", "L"] }
            ]
        },
        {
            name: "Group B",
            teams: [
                { pos: 1, name: "RSA", p: 4, w: 4, l: 0, nr: 0, nrr: "+2.100", pts: 8, form: ["W", "W", "W", "W"] },
                { pos: 2, name: "ENG", p: 4, w: 2, l: 1, nr: 1, nrr: "+1.250", pts: 5, form: ["W", "L", "NR", "W"] },
                { pos: 3, name: "SCO", p: 4, w: 2, l: 2, nr: 0, nrr: "+0.120", pts: 4, form: ["L", "W", "W", "L"] },
                { pos: 4, name: "NAM", p: 4, w: 1, l: 3, nr: 0, nrr: "-1.850", pts: 2, form: ["L", "W", "L", "L"] },
                { pos: 5, name: "OMA", p: 4, w: 0, l: 3, nr: 1, nrr: "-2.300", pts: 1, form: ["L", "L", "NR", "L"] }
            ]
        }
    ];

    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(600px, 1fr))';
    container.appendChild(grid);

    groups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '0';
        card.style.overflow = 'hidden';

        let html = `
            <div style="padding: 1.5rem; background: rgba(255,255,255,0.02); border-bottom: var(--glass-border);">
                <h3 style="margin: 0; font-size: 1.5rem; color: var(--accent-primary);">${group.name}</h3>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">
                            <th style="padding: 1rem 1.5rem;">Pos</th>
                            <th style="padding: 1rem 1.5rem;">Team</th>
                            <th style="padding: 1rem; text-align: center;">P</th>
                            <th style="padding: 1rem; text-align: center;">W</th>
                            <th style="padding: 1rem; text-align: center;">L</th>
                            <th style="padding: 1rem; text-align: center;">NR</th>
                            <th style="padding: 1rem; text-align: center;">NRR</th>
                            <th style="padding: 1rem; text-align: center;">Pts</th>
                            <th style="padding: 1rem 1.5rem;">Form</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        group.teams.forEach(team => {
            const isQualified = team.pos <= 2;
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 1rem 1.5rem; font-weight: 700; color: ${isQualified ? 'var(--accent-success)' : 'var(--text-muted)'};">${team.pos}</td>
                    <td style="padding: 1rem 1.5rem; font-weight: 600; color: var(--text-primary);">${team.name}</td>
                    <td style="padding: 1rem; text-align: center;">${team.p}</td>
                    <td style="padding: 1rem; text-align: center;">${team.w}</td>
                    <td style="padding: 1rem; text-align: center;">${team.l}</td>
                    <td style="padding: 1rem; text-align: center;">${team.nr}</td>
                    <td style="padding: 1rem; text-align: center; font-family: var(--font-mono); color: ${parseFloat(team.nrr) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'}">${team.nrr}</td>
                    <td style="padding: 1rem; text-align: center; font-weight: 800; color: var(--accent-primary);">${team.pts}</td>
                    <td style="padding: 1rem 1.5rem;">
                        <div style="display: flex; gap: 4px;">
                            ${team.form.map(f => `
                                <span style="width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; background: ${f === 'W' ? 'rgba(34, 197, 94, 0.2)' : f === 'L' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(156, 163, 175, 0.2)'}; color: ${f === 'W' ? 'var(--accent-success)' : f === 'L' ? 'var(--accent-danger)' : 'var(--text-muted)'}; border: 1px solid ${f === 'W' ? 'rgba(34, 197, 94, 0.3)' : f === 'L' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(156, 163, 175, 0.3)'};">
                                    ${f}
                                </span>
                            `).join('')}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div style="padding: 1rem 1.5rem; background: rgba(255,255,255,0.01); border-top: var(--glass-border); font-size: 0.75rem; color: var(--text-muted);">
                <span style="color: var(--accent-success); font-weight: 600;">●</span> Top 2 teams qualify for Super 8s
            </div>
        `;

        card.innerHTML = html;
        grid.appendChild(card);
    });
}
