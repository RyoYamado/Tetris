// Multiplayer Game Manager - synchronizes game state between two players
import { db } from './firebase.js';
import { ref, update, set } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

export class MultiplayerGameManager {
    constructor(roomCode, playerId, game1, game2 = null) {
        this.roomCode = roomCode;
        this.playerId = playerId;
        this.game1 = game1; // Local player's game
        this.game2 = game2; // Remote player's game (if needed)
        this.syncInterval = null;
        this.lastSyncTime = 0;
        this.syncDelay = 100; // Sync every 100ms
    }

    /**
     * Start synchronizing game state
     */
    startSync() {
        // Initial sync every 100ms
        this.syncInterval = setInterval(() => {
            this.syncGameState();
        }, this.syncDelay);

        console.log('Game sync started');
    }

    /**
     * Stop synchronizing game state
     */
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('Game sync stopped');
    }

    /**
     * Sync current player's game state to Firebase
     */
    async syncGameState() {
        try {
            const now = Date.now();
            if (now - this.lastSyncTime < this.syncDelay) {
                return;
            }

            this.lastSyncTime = now;

            if (!this.game1 || !this.game1.gameActive) {
                return;
            }

            // Determine if this player is player1 or player2
            const isPlayer1 = this.playerId === this.game1.playerId;
            const playerKey = isPlayer1 ? 'player1' : 'player2';

            // Get current game state
            const gameState = {
                [`${playerKey}/score`]: this.game1.score,
                [`${playerKey}/level`]: this.game1.level,
                [`${playerKey}/lines`]: this.game1.lines,
                [`${playerKey}/alive`]: !this.game1.gameOver,
                [`${playerKey}/lastUpdate`]: new Date().toISOString()
            };

            // Update in Firebase
            const roomRef = ref(db, `multiplayer_rooms/${this.roomCode}`);
            await update(roomRef, gameState);

        } catch (error) {
            console.error('Error syncing game state:', error);
        }
    }

    /**
     * Update opponent's game display with their state
     */
    updateOpponentDisplay(opponentData) {
        // This will be called when receiving updates from Firebase
        if (!this.game2) return;

        // Update opponent's displayed stats
        const scoreElement = document.getElementById('score2');
        const levelElement = document.getElementById('level2');
        const linesElement = document.getElementById('lines2');
        const statusElement = document.getElementById('player2Status');

        if (scoreElement) scoreElement.textContent = opponentData.score || 0;
        if (levelElement) levelElement.textContent = opponentData.level || 1;
        if (linesElement) linesElement.textContent = opponentData.lines || 0;

        // Update status
        if (statusElement) {
            if (opponentData.alive) {
                statusElement.textContent = '✓ Играет';
                statusElement.className = 'player-status ready';
            } else {
                statusElement.textContent = '✗ Выбыл';
                statusElement.className = 'player-status dead';
            }
        }
    }

    /**
     * Get the winner based on scores
     */
    getWinner(player1Data, player2Data) {
        if (player1Data.score > player2Data.score) {
            return 'player1';
        } else if (player2Data.score > player1Data.score) {
            return 'player2';
        } else {
            return 'draw';
        }
    }

    /**
     * Format result message
     */
    formatResultMessage(result, player1Name, player2Name) {
        if (result === 'draw') {
            return `🤝 Ничья! ${player1Name} и ${player2Name} показали одинаковый результат`;
        } else {
            const winner = result === 'player1' ? player1Name : player2Name;
            return `🏆 Победил ${winner}!`;
        }
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.stopSync();
    }
}

export default MultiplayerGameManager;
