// Multiplayer Game Page - Main game loop and synchronization
import { auth, onAuthStateChanged } from './firebase.js';
import { MultiplayerRoomManager } from './multiplayer-room.js';
import { MultiplayerGameManager } from './multiplayer-game-manager.js';
import { TetrisGame } from './game.js';

class MultiplayerGamePage {
    constructor() {
        this.currentUser = null;
        this.roomManager = new MultiplayerRoomManager();
        this.gameManager = null;
        this.localGame = null;
        this.roomCode = null;
        this.isHost = false;
        this.playerId = null;
        this.opponentId = null;
        this.roomListener = null;
        this.init();
    }

    init() {
        // Get room code and host flag from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.roomCode = urlParams.get('room');
        this.isHost = urlParams.get('isHost') === 'true';

        if (!this.roomCode) {
            window.location.href = 'multiplayer.html';
            return;
        }

        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            this.currentUser = user;
            this.playerId = user.uid;
            this.loadGame();
            console.log('Multiplayer game page initialized for:', user.email);
        });
    }

    async loadGame() {
        try {
            this.showLoading(true, 'Загрузка игры...');

            // Validate room exists and get room data
            const roomData = await this.roomManager.getRoomData(this.roomCode);

            if (!roomData) {
                throw new Error('Комната не найдена');
            }

            // Display room code
            const roomCodeElement = document.getElementById('roomCode');
            if (roomCodeElement) {
                roomCodeElement.textContent = this.roomCode;
            }

            // Initialize local game
            this.localGame = new TetrisGame();
            this.localGame.playerId = this.playerId;

            // Setup event listeners
            this.setupPageEventListeners();
            this.setupGameEventListeners(roomData);

            // Listen for room changes
            this.setupRoomListener();

            // Update UI with player names
            this.updatePlayerNames(roomData);

            // Check if both players are in the room
            if (roomData.player2 && roomData.player1) {
                this.onBothPlayersReady();
            }

            this.showLoading(false);
        } catch (error) {
            console.error('Error loading game:', error);
            this.showError('Ошибка загрузки: ' + error.message);
            this.showLoading(false);
        }
    }

    setupRoomListener() {
        this.roomListener = this.roomManager.onRoomChange(this.roomCode, (error, roomData) => {
            if (error) {
                console.error('Room listener error:', error);
                this.showConnectionLost();
                return;
            }

            if (roomData) {
                this.handleRoomUpdate(roomData);
            }
        });
    }

    handleRoomUpdate(roomData) {
        // Update opponent status
        const opponent = this.isHost ? roomData.player2 : roomData.player1;
        if (opponent) {
            this.gameManager.updateOpponentDisplay(opponent);

            // Check if opponent is still alive
            if (!opponent.alive) {
                this.onOpponentDead(roomData);
            }
        }

        // Check if game status changed
        if (roomData.status === 'finished' && this.localGame.gameActive) {
            this.endGame(roomData);
        }
    }

    setupPageEventListeners() {
        // Leave game button
        const leaveButton = document.getElementById('leaveButton');
        if (leaveButton) {
            leaveButton.addEventListener('click', () => {
                if (confirm('Вы уверены? Вы выбудете из игры.')) {
                    this.leaveGame();
                }
            });
        }

        // Game over buttons
        const playAgainButton = document.getElementById('playAgainButton');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.playAgain();
            });
        }

        const menuButton = document.getElementById('menuButton');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                window.location.href = 'multiplayer.html';
            });
        }

        const backToMenuButton = document.getElementById('backToMenuButton');
        if (backToMenuButton) {
            backToMenuButton.addEventListener('click', () => {
                window.location.href = 'multiplayer.html';
            });
        }
    }

    setupGameEventListeners(roomData) {
        this.gameManager = new MultiplayerGameManager(
            this.roomCode,
            this.playerId,
            this.localGame
        );

        // Override game over method
        const originalGameOver = this.localGame.gameOver.bind(this.localGame);
        this.localGame.gameOver = async () => {
            const score = originalGameOver();

            // Mark player as dead and update in Firebase
            const isPlayer1 = this.isHost;
            const playerKey = isPlayer1 ? 'player1' : 'player2';

            await this.roomManager.updatePlayerStatus(this.roomCode, this.playerId, {
                alive: false,
                finalScore: score
            });

            // Check if opponent is already dead
            const roomData = await this.roomManager.getRoomData(this.roomCode);
            const opponent = isPlayer1 ? roomData.player2 : roomData.player1;

            if (!opponent || !opponent.alive) {
                // Both players are dead, show game over
                this.endGame(roomData);
            } else {
                // Opponent is still alive, wait for them
                this.updatePlayerStatus('✗ Выбыл', 'dead');
            }

            return score;
        };

        // Start sync
        this.gameManager.startSync();
    }

    async onBothPlayersReady() {
        // Show both player status as ready
        const player1Status = document.getElementById('player1Status');
        const player2Status = document.getElementById('player2Status');

        if (player1Status) {
            player1Status.textContent = '✓ Готов';
            player1Status.className = 'player-status ready';
        }

        if (player2Status) {
            player2Status.textContent = '✓ Готов';
            player2Status.className = 'player-status ready';
        }

        // Show controls
        this.showGameControls();
    }

    showGameControls() {
        // Add start game button if not already present
        const gameControlsDiv = document.querySelector('.game-controls');
        if (!gameControlsDiv) {
            const infoColumnDiv = document.querySelector('.info-column');
            if (infoColumnDiv) {
                const controlsHTML = `
                    <div class="game-controls">
                        <button id="startGameButton" class="control-btn primary">Начать игру</button>
                    </div>
                `;
                infoColumnDiv.insertAdjacentHTML('beforeend', controlsHTML);

                const startGameButton = document.getElementById('startGameButton');
                if (startGameButton) {
                    startGameButton.addEventListener('click', () => {
                        this.startGame();
                    });
                }
            }
        }
    }

    async startGame() {
        try {
            // Start game for local player
            this.localGame.startGame();

            // Update room status to playing
            await this.roomManager.updateGameState(this.roomCode, {
                status: 'playing',
                startedAt: new Date().toISOString()
            });

            // Update UI
            const player1Status = document.getElementById('player1Status');
            const player2Status = document.getElementById('player2Status');

            if (player1Status) {
                player1Status.textContent = '🎮 Играет';
            }
            if (player2Status) {
                player2Status.textContent = '🎮 Играет';
            }

            console.log('Game started in room:', this.roomCode);
        } catch (error) {
            console.error('Error starting game:', error);
            this.showError('Ошибка при запуске игры');
        }
    }

    async endGame(roomData) {
        try {
            // Stop syncing
            this.gameManager.stopSync();
            this.localGame.gameActive = false;

            const isPlayer1 = this.isHost;
            const player1 = roomData.player1;
            const player2 = roomData.player2;

            // Determine winner
            let winner = 'draw';
            let resultText = '';

            const player1Score = player1.score || 0;
            const player2Score = player2.score || 0;

            if (player1Score > player2Score) {
                winner = 'player1';
                resultText = isPlayer1 ? '🏆 Вы победили!' : '😔 Вы проиграли';
            } else if (player2Score > player1Score) {
                winner = 'player2';
                resultText = isPlayer1 ? '😔 Вы проиграли' : '🏆 Вы победили!';
            } else {
                resultText = '🤝 Ничья!';
            }

            // Show game over modal
            const gameOverModal = document.getElementById('gameOverModal');
            const yourFinalScore = document.getElementById('yourFinalScore');
            const opponentFinalScore = document.getElementById('opponentFinalScore');
            const resultTextElement = document.getElementById('resultText');

            if (gameOverModal) {
                if (yourFinalScore) yourFinalScore.textContent = isPlayer1 ? player1Score : player2Score;
                if (opponentFinalScore) opponentFinalScore.textContent = isPlayer1 ? player2Score : player1Score;
                if (resultTextElement) {
                    resultTextElement.textContent = resultText;
                    resultTextElement.className = 'result-text ' + 
                        (winner === (isPlayer1 ? 'player1' : 'player2') ? 'victory' : 
                         winner === 'draw' ? 'draw' : 'defeat');
                }

                gameOverModal.classList.add('show');
            }

            // Update room status
            await this.roomManager.updateGameState(this.roomCode, {
                status: 'finished',
                winner: winner,
                endedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error ending game:', error);
        }
    }

    async playAgain() {
        try {
            // Reset local game
            this.localGame = new TetrisGame();
            this.localGame.playerId = this.playerId;

            // Hide game over modal
            const gameOverModal = document.getElementById('gameOverModal');
            if (gameOverModal) {
                gameOverModal.classList.remove('show');
            }

            // Reload page to reset room
            window.location.reload();
        } catch (error) {
            console.error('Error playing again:', error);
        }
    }

    async leaveGame() {
        try {
            this.gameManager.cleanup();
            await this.roomManager.leaveRoom(this.roomCode);
            window.location.href = 'multiplayer.html';
        } catch (error) {
            console.error('Error leaving game:', error);
            window.location.href = 'multiplayer.html';
        }
    }

    onOpponentDead(roomData) {
        const opponent = this.isHost ? roomData.player2 : roomData.player1;
        const player2Status = document.getElementById('player2Status');

        if (player2Status) {
            player2Status.textContent = '✗ Выбыл';
            player2Status.className = 'player-status dead';
        }
    }

    updatePlayerNames(roomData) {
        const player1NameElement = document.getElementById('player1Name');
        const player2NameElement = document.getElementById('player2Name');

        if (player1NameElement && roomData.player1) {
            player1NameElement.textContent = roomData.player1.name || 'Игрок 1';
        }

        if (player2NameElement && roomData.player2) {
            player2NameElement.textContent = roomData.player2.name || 'Игрок 2';
        } else if (player2NameElement) {
            player2NameElement.textContent = 'Ожидание...';
        }
    }

    updatePlayerStatus(status, statusClass = '') {
        const player1Status = document.getElementById('player1Status');
        if (player1Status) {
            player1Status.textContent = status;
            if (statusClass) player1Status.className = `player-status ${statusClass}`;
        }
    }

    showConnectionLost() {
        const connectionModal = document.getElementById('connectionModal');
        if (connectionModal) {
            connectionModal.classList.add('show');
        }

        this.gameManager.cleanup();
    }

    showLoading(show, text = 'Загрузка...') {
        const loadingModal = document.getElementById('loadingModal');
        const loadingText = document.getElementById('loadingText');

        if (loadingModal) {
            if (show) {
                loadingModal.classList.add('show');
                if (loadingText) loadingText.textContent = text;
            } else {
                loadingModal.classList.remove('show');
            }
        }
    }

    showError(message) {
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MultiplayerGamePage();
});
