// Game page logic - ties everything together
import { TetrisGame } from './game.js';
import { AuthManager } from './auth.js';
import { GameManager } from './game-manager.js';
import { auth, onAuthStateChanged } from './firebase.js';

class GamePage {
    constructor() {
        this.game = null;
        this.authManager = null;
        this.gameManager = null;
        this.gameState = 'idle'; // idle, playing, paused, gameover
        this.init();
    }
    
    init() {
        // Check authentication first
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                // Redirect to login if not authenticated
                window.location.href = 'index.html';
                return;
            }
            
            // Initialize game components
            this.game = new TetrisGame();
            this.gameManager = new GameManager(this.game);
            this.authManager = new AuthManager(this.gameManager);
            this.gameManager.setAuthManager(this.authManager);
            
            // Setup page event listeners
            this.setupPageEventListeners();
            this.setupGameEventListeners();
            
            console.log('Game page initialized');
        });
    }
    
    setupPageEventListeners() {
        // Navigation buttons
        const homeButton = document.getElementById('homeButton');
        if (homeButton) {
            homeButton.addEventListener('click', () => {
                if (this.game && this.game.gameActive) {
                    if (!confirm('Вы уверены? Текущая игра будет потеряна.')) {
                        return;
                    }
                    this.game.gameActive = false;
                    clearInterval(this.game.gameInterval);
                }
                window.location.href = 'index.html';
            });
        }
        
        const leaderboardButton = document.getElementById('leaderboardButton');
        if (leaderboardButton) {
            leaderboardButton.addEventListener('click', () => {
                window.location.href = 'leaderboard.html';
            });
        }

        const multiplayerButton = document.getElementById('multiplayerButton');
        if (multiplayerButton) {
            multiplayerButton.addEventListener('click', () => {
                window.location.href = 'multiplayer.html';
            });
        }
        
        // Game control buttons
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.addButtonFeedback(startButton);
                this.onGameStart();
            });
        }
        
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                this.addButtonFeedback(pauseButton);
                this.onPauseToggle();
            });
        }
        
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.addButtonFeedback(restartButton);
                this.onRestart();
            });
        }
        
        const menuButton = document.getElementById('menuButton');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                this.addButtonFeedback(menuButton);
                const gameOverElement = document.getElementById('gameOver');
                if (gameOverElement) {
                    gameOverElement.style.display = 'none';
                    this.updateGameStatus('idle', 'Готово к игре');
                }
            });
        }
        
        const playAgainButton = document.getElementById('playAgainButton');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.addButtonFeedback(playAgainButton);
                const gameOverElement = document.getElementById('gameOver');
                if (gameOverElement) gameOverElement.style.display = 'none';
                this.onGameStart();
            });
        }
        
        // Override game's gameOver method to use our handler and provide extended stats
        const originalGameOver = this.game.gameOver.bind(this.game);
        this.game.gameOver = () => {
            const score = originalGameOver();
            // Build detailed result object
            const result = {
                score: score,
                lines: this.game.lines || 0,
                level: this.game.level || 1,
                timestamp: new Date().toISOString()
            };

            this.gameManager.handleGameOver(result);
            this.resetButtons();
            this.updateGameStatus('gameover', 'Игра окончена');
            return score;
        };
    }
    
    setupGameEventListeners() {
        // Listen for game state changes
        window.addEventListener('gameStateChanged', (e) => {
            const { state, gameActive, gamePaused } = e.detail;
            
            if (state === 'playing') {
                this.gameState = 'playing';
                this.updateGameStatus('playing', 'Игра идёт');
            } else if (state === 'gameover') {
                this.gameState = 'gameover';
            }
        });
        
        // Listen for pause state changes
        window.addEventListener('gamePauseChanged', (e) => {
            const { isPaused } = e.detail;
            if (isPaused) {
                this.gameState = 'paused';
                this.updateGameStatus('paused', 'На паузе');
            } else {
                this.gameState = 'playing';
                this.updateGameStatus('playing', 'Игра идёт');
            }
        });
    }
    
    onGameStart() {
        this.game.startGame();
        this.showGameControls();
        this.updateGameStatus('playing', 'Игра идёт');
    }
    
    onPauseToggle() {
        this.game.togglePause();
        
        if (this.game.gamePaused) {
            const pauseButton = document.getElementById('pauseButton');
            if (pauseButton) pauseButton.textContent = 'Продолжить';
            this.updateGameStatus('paused', 'На паузе');
        } else {
            const pauseButton = document.getElementById('pauseButton');
            if (pauseButton) pauseButton.textContent = 'Пауза';
            this.updateGameStatus('playing', 'Игра идёт');
        }
    }
    
    onRestart() {
        if (confirm('Вы хотите перезапустить игру?')) {
            this.game.restartGame();
            this.showGameControls();
            this.updateGameStatus('playing', 'Игра идёт');
        }
    }
    
    showGameControls() {
        const startButton = document.getElementById('startButton');
        const pauseButton = document.getElementById('pauseButton');
        const restartButton = document.getElementById('restartButton');
        
        if (startButton) startButton.classList.add('hidden');
        if (pauseButton) {
            pauseButton.classList.remove('hidden');
            pauseButton.textContent = 'Пауза';
        }
        if (restartButton) restartButton.classList.remove('hidden');
    }
    
    resetButtons() {
        const startButton = document.getElementById('startButton');
        const pauseButton = document.getElementById('pauseButton');
        const restartButton = document.getElementById('restartButton');
        
        if (startButton) startButton.classList.remove('hidden');
        if (pauseButton) {
            pauseButton.classList.add('hidden');
            pauseButton.textContent = 'Пауза';
        }
        if (restartButton) restartButton.classList.add('hidden');
    }
    
    updateGameStatus(state, statusText) {
        // Status display removed from DOM. Keep internal state updated only.
        this.gameState = state;
        // Optional: log for debug if needed
        // console.debug('updateGameStatus:', state, statusText);
    }
    
    // Add visual feedback to button click
    addButtonFeedback(button) {
        // Add ripple effect
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.position = 'absolute';
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => ripple.remove(), 600);
        
        // Add temporary highlight
        button.style.opacity = '0.8';
        setTimeout(() => {
            button.style.opacity = '1';
        }, 100);
    }
}

// Initialize the game page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GamePage();
});