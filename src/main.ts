import './style.css'
import { Game } from './engine/Game';

console.log("The BomberLegend: Evolved - Initializing...");

// Initialize Game
const game = new Game('gameCanvas');

// Systems are now registered inside Game class constructor

// Start Loop
game.start();
