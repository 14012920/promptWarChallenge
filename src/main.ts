import './style.css';
import { Game } from './engine/Game';
import { GoogleService } from './services/GoogleService';
import { initializeFirebase, GameAnalytics } from './services/FirebaseService';

import { RacingGame } from './racing/RacingGame';

// Initialize Firebase on app load
initializeFirebase();

// Elements
const launcher = document.getElementById('launcher');
const bomberContainer = document.getElementById('bomber-legend-container');
const racingContainer = document.getElementById('racing-game-container');
const btnBackMenu = document.getElementById('btn-back-menu');

let activeGame: Game | null = null;
let activeRacingGame: RacingGame | null = null;

// Game Selection
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game');
        if (gameId === 'bomber') {
            startGame('bomber');
        } else if (gameId === 'racing') {
            startGame('racing');
        }
    });
});

function startGame(gameId: string) {
    if (launcher) launcher.classList.add('hidden');

    if (gameId === 'bomber') {
        if (bomberContainer) bomberContainer.classList.remove('hidden');
        // Track game start
        GameAnalytics.logGameStart('bomber_legend');

        // Start Game
        if (!activeGame) {
            activeGame = new Game('gameCanvas');
            activeGame.start();
        } else {
            // If already exists, maybe restart or just resume? 
            // For now, let's just resume/ensure loop. 
            // Ideally we re-instantiate for a fresh game or have a reset method.
            // activeGame.reset(); // If implemented
            activeGame.start(); // Resume/Start
        }
    } else if (gameId === 'racing') {
        if (racingContainer) racingContainer.classList.remove('hidden');
        // Track game start
        GameAnalytics.logGameStart('retro_racing');

        if (!activeRacingGame) {
            activeRacingGame = new RacingGame('racingCanvas', showLauncher);
            activeRacingGame.start();
        } else {
            activeRacingGame.start();
        }
    }
}

function showLauncher() {
    // Stop Bomber
    if (activeGame) {
        activeGame.stop();
        // activeGame = null; // Keep instance or destroy? Let's keep for resume if we wanted.
    }
    if (bomberContainer) bomberContainer.classList.add('hidden');

    // Stop Racing
    if (activeRacingGame) {
        activeRacingGame.stop();
    }
    if (racingContainer) racingContainer.classList.add('hidden');

    if (launcher) launcher.classList.remove('hidden');
}

if (btnBackMenu) {
    btnBackMenu.addEventListener('click', showLauncher);
}

// Google Service Integration (Preserved)
const googleService = GoogleService.getInstance();
const btnLogin = document.getElementById('btn-login');
const userProfile = document.getElementById('user-profile');
const userName = document.getElementById('user-name');
const btnLeaderboard = document.getElementById('btn-leaderboard');
const modal = document.getElementById('leaderboard-modal');
const closeModal = document.querySelector('.close-modal');
const leaderboardList = document.getElementById('leaderboard-list');

if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        try {
            const user = await googleService.login();
            btnLogin.classList.add('hidden');
            if (userProfile && userName) {
                userProfile.classList.remove('hidden');
                userName.textContent = user.name;
            }
        } catch (e) {
            console.error("Login failed", e);
        }
    });
}

if (btnLeaderboard && modal && leaderboardList) {
    btnLeaderboard.addEventListener('click', async () => {
        modal.classList.remove('hidden');
        const entries = await googleService.getLeaderboard();
        const html = entries.map(e => {
            return '<li><span>#' + e.rank + ' ' + e.name + '</span><span>' + e.score + '</span></li>';
        }).join('');
        leaderboardList.innerHTML = html;
    });
}

if (closeModal && modal) {
    closeModal.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
}
