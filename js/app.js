// Main application file - ties everything together
import { TetrisGame } from './game.js';
import { AuthManager } from './auth.js';
import { GameManager } from './game-manager.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new TetrisGame();
    const gameManager = new GameManager(game);
    const authManager = new AuthManager(gameManager);
    
    // Make managers globally available for debugging
    window.game = game;
    window.authManager = authManager;
    window.gameManager = gameManager;
    
    console.log('Тетрис приложение инициализировано!');
});