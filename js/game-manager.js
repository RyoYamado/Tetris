// Game manager for coordinating between game and auth
export class GameManager {
    constructor(game) {
        this.game = game;
        this.authManager = null;
    }
    
    // Set auth manager (called from app.js)
    setAuthManager(authManager) {
        this.authManager = authManager;
    }
    
    // Handle game over
    // Accept either a numeric score or a detailed result object { score, lines, level, timestamp }
    handleGameOver(result) {
        if (!this.authManager) return;

        try {
            this.authManager.saveScore(result);
        } catch (err) {
            console.error('Error forwarding game result to AuthManager:', err);
        }
    }
}