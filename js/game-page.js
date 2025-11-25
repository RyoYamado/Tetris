// Game page logic - ties everything together
import { TetrisGame } from './game.js';
import { AuthManager } from './auth.js';
import { GameManager } from './game-manager.js';

class GamePage {
    constructor() {
        this.game = null;
        this.authManager = null;
        this.gameManager = null;
        
        this.init();
    }
    
    init() {
        // Initialize game
        this.game = new TetrisGame();
        
        // Initialize game manager
        this.gameManager = new GameManager(this.game);
        
        // Initialize auth manager
        this.authManager = new AuthManager(this.gameManager);
        
        // Setup page event listeners
        this.setupPageEventListeners();
        
        // Check authentication
        this.checkAuthentication();
        
        console.log('Game page initialized');
    }
    
    setupPageEventListeners() {
        // Navigation buttons
        document.getElementById('homeButton').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        document.getElementById('leaderboardButton').addEventListener('click', () => {
            this.gameManager.updateLeaderboard();
        });
        
        document.getElementById('menuButton').addEventListener('click', () => {
            document.getElementById('gameOver').style.display = 'none';
        });
        
        // Override game's gameOver method to use our handler
        const originalGameOver = this.game.gameOver.bind(this.game);
        this.game.gameOver = () => {
            const score = originalGameOver();
            this.gameManager.handleGameOver(score);
            return score;
        };
    }
    
    checkAuthentication() {
        // AuthManager will handle redirect if not authenticated
        // This is handled in the AuthManager class
    }
}

// Initialize the game page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GamePage();
});