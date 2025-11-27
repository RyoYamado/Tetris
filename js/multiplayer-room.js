// Multiplayer Room Manager - handles game room creation and joining
import { db } from './firebase.js';
import { ref, set, get, update, remove, onValue, off } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

export class MultiplayerRoomManager {
    constructor() {
        this.currentRoomId = null;
        this.currentPlayerId = null;
        this.roomListeners = {};
    }

    /**
     * Generate a unique room code (8 characters)
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Create a new multiplayer room
     */
    async createRoom(userId, userName) {
        try {
            const roomCode = this.generateRoomCode();
            const roomRef = ref(db, `multiplayer_rooms/${roomCode}`);

            const roomData = {
                code: roomCode,
                createdBy: userId,
                player1: {
                    id: userId,
                    name: userName,
                    joined: true,
                    ready: false,
                    score: 0,
                    level: 1,
                    lines: 0,
                    alive: true
                },
                player2: null,
                status: 'waiting', // waiting, playing, finished
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
            };

            await set(roomRef, roomData);
            this.currentRoomId = roomCode;
            this.currentPlayerId = userId;

            console.log(`Room created: ${roomCode}`);
            return roomCode;
        } catch (error) {
            console.error('Error creating room:', error);
            throw new Error('Не удалось создать комнату. Попробуйте позже.');
        }
    }

    /**
     * Join an existing room
     */
    async joinRoom(roomCode, userId, userName) {
        try {
            const roomRef = ref(db, `multiplayer_rooms/${roomCode}`);
            const roomSnapshot = await get(roomRef);

            if (!roomSnapshot.exists()) {
                throw new Error('Комната не найдена');
            }

            const roomData = roomSnapshot.val();

            // Check if room is still waiting for players
            if (roomData.status !== 'waiting') {
                throw new Error('Игра в этой комнате уже началась');
            }

            // Check if player2 is already filled
            if (roomData.player2) {
                throw new Error('В комнате уже 2 игрока');
            }

            // Check if it's not the same player trying to join their own room
            if (roomData.player1.id === userId) {
                throw new Error('Вы уже в этой комнате');
            }

            // Add player 2
            const updateData = {
                'player2': {
                    id: userId,
                    name: userName,
                    joined: true,
                    ready: false,
                    score: 0,
                    level: 1,
                    lines: 0,
                    alive: true
                }
            };

            await update(roomRef, updateData);
            this.currentRoomId = roomCode;
            this.currentPlayerId = userId;

            console.log(`Joined room: ${roomCode}`);
            return roomData;
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    }

    /**
     * Listen for room changes in real-time
     */
    onRoomChange(roomCode, callback) {
        const roomRef = ref(db, `multiplayer_rooms/${roomCode}`);

        const listener = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(null, snapshot.val());
            } else {
                callback(new Error('Комната больше не существует'));
            }
        }, (error) => {
            callback(error);
        });

        // Store listener for cleanup
        if (!this.roomListeners[roomCode]) {
            this.roomListeners[roomCode] = [];
        }
        this.roomListeners[roomCode].push(listener);

        return listener;
    }

    /**
     * Update player status (ready, score, etc.)
     */
    async updatePlayerStatus(roomCode, playerId, status) {
        try {
            const isPlayer1 = await this.isPlayer1(roomCode, playerId);
            const playerKey = isPlayer1 ? 'player1' : 'player2';
            
            const roomRef = ref(db, `multiplayer_rooms/${roomCode}/${playerKey}`);
            await update(roomRef, status);

            console.log(`Updated player ${playerKey} status:`, status);
        } catch (error) {
            console.error('Error updating player status:', error);
            throw error;
        }
    }

    /**
     * Update game state
     */
    async updateGameState(roomCode, gameState) {
        try {
            const roomRef = ref(db, `multiplayer_rooms/${roomCode}`);
            await update(roomRef, gameState);

            console.log('Updated game state:', gameState);
        } catch (error) {
            console.error('Error updating game state:', error);
            throw error;
        }
    }

    /**
     * Check if player is player1
     */
    async isPlayer1(roomCode, playerId) {
        const roomRef = ref(db, `multiplayer_rooms/${roomCode}`);
        const roomSnapshot = await get(roomRef);

        if (!roomSnapshot.exists()) {
            throw new Error('Комната не найдена');
        }

        return roomSnapshot.val().player1.id === playerId;
    }

    /**
     * Leave room and cleanup
     */
    async leaveRoom(roomCode) {
        try {
            // Stop listening to changes
            if (this.roomListeners[roomCode]) {
                this.roomListeners[roomCode].forEach(listener => off(listener));
                delete this.roomListeners[roomCode];
            }

            const roomRef = ref(db, `multiplayer_rooms/${roomCode}`);
            await remove(roomRef);

            console.log(`Left room: ${roomCode}`);
            this.currentRoomId = null;
            this.currentPlayerId = null;
        } catch (error) {
            console.error('Error leaving room:', error);
            throw error;
        }
    }

    /**
     * Get room data
     */
    async getRoomData(roomCode) {
        try {
            const roomRef = ref(db, `multiplayer_rooms/${roomCode}`);
            const roomSnapshot = await get(roomRef);

            if (!roomSnapshot.exists()) {
                throw new Error('Комната не найдена');
            }

            return roomSnapshot.val();
        } catch (error) {
            console.error('Error getting room data:', error);
            throw error;
        }
    }

    /**
     * Check if both players are ready
     */
    async areBothPlayersReady(roomCode) {
        try {
            const roomData = await this.getRoomData(roomCode);
            return roomData.player1.ready && roomData.player2 && roomData.player2.ready;
        } catch (error) {
            console.error('Error checking player status:', error);
            return false;
        }
    }

    /**
     * Start the game
     */
    async startGame(roomCode) {
        try {
            await this.updateGameState(roomCode, {
                status: 'playing',
                startedAt: new Date().toISOString()
            });
            console.log(`Game started in room: ${roomCode}`);
        } catch (error) {
            console.error('Error starting game:', error);
            throw error;
        }
    }

    /**
     * End the game
     */
    async endGame(roomCode, winner) {
        try {
            await this.updateGameState(roomCode, {
                status: 'finished',
                winner: winner,
                endedAt: new Date().toISOString()
            });
            console.log(`Game ended in room: ${roomCode}. Winner: ${winner}`);
        } catch (error) {
            console.error('Error ending game:', error);
            throw error;
        }
    }
}

export default MultiplayerRoomManager;
