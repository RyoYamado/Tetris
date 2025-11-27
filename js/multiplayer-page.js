// Multiplayer Page - Mode selection and room creation/joining
import { auth, onAuthStateChanged } from './firebase.js';
import { MultiplayerRoomManager } from './multiplayer-room.js';

class MultiplayerPage {
    constructor() {
        this.roomManager = new MultiplayerRoomManager();
        this.currentUser = null;
        this.currentMode = 'modes'; // modes or multiplayer
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            this.currentUser = user;
            this.setupEventListeners();
            this.updateUserInfo();
            console.log('Multiplayer page initialized for:', user.email);
        });
    }

    setupEventListeners() {
        // Navigation buttons
        const homeButton = document.getElementById('homeButton');
        if (homeButton) {
            homeButton.addEventListener('click', () => {
                window.location.href = 'game.html';
            });
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                try {
                    await auth.signOut();
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });
        }

        // Mode selection buttons
        const singlePlayerButton = document.getElementById('singlePlayerButton');
        if (singlePlayerButton) {
            singlePlayerButton.addEventListener('click', () => {
                window.location.href = 'game.html';
            });
        }

        const multiplayerButton = document.getElementById('multiplayerButton');
        if (multiplayerButton) {
            multiplayerButton.addEventListener('click', () => {
                this.switchToMultiplayerMenu();
            });
        }

        // Multiplayer menu buttons
        const createRoomButton = document.getElementById('createRoomButton');
        if (createRoomButton) {
            createRoomButton.addEventListener('click', () => {
                this.createRoom();
            });
        }

        const joinRoomButton = document.getElementById('joinRoomButton');
        if (joinRoomButton) {
            joinRoomButton.addEventListener('click', () => {
                this.joinRoom();
            });
        }

        const backButton = document.getElementById('backButton');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.switchToModes();
            });
        }

        // Enter key for room code input
        const roomCodeInput = document.getElementById('roomCodeInput');
        if (roomCodeInput) {
            roomCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.joinRoom();
                }
            });
            // Auto-uppercase the input
            roomCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    }

    switchToMultiplayerMenu() {
        const modesContainer = document.querySelector('.modes-container');
        const multiplayerMenu = document.getElementById('multiplayerMenu');

        if (modesContainer) {
            modesContainer.style.display = 'none';
        }
        if (multiplayerMenu) {
            multiplayerMenu.classList.remove('hidden');
        }

        this.currentMode = 'multiplayer';
        document.getElementById('roomCodeInput').value = '';
        this.clearError('joinError');
    }

    switchToModes() {
        const modesContainer = document.querySelector('.modes-container');
        const multiplayerMenu = document.getElementById('multiplayerMenu');

        if (modesContainer) {
            modesContainer.style.display = '';
        }
        if (multiplayerMenu) {
            multiplayerMenu.classList.add('hidden');
        }

        this.currentMode = 'modes';
        this.clearError('joinError');
    }

    async createRoom() {
        try {
            this.showLoading(true, 'Создание комнаты...');

            const userName = this.currentUser.displayName || 'Игрок';
            const roomCode = await this.roomManager.createRoom(this.currentUser.uid, userName);

            this.showLoading(false);

            // Redirect to multiplayer game with room code
            window.location.href = `multiplayer-game.html?room=${roomCode}&isHost=true`;
        } catch (error) {
            this.showLoading(false);
            this.showError('joinError', error.message);
            console.error('Create room error:', error);
        }
    }

    async joinRoom() {
        try {
            const roomCodeInput = document.getElementById('roomCodeInput');
            const roomCode = roomCodeInput.value.trim().toUpperCase();

            if (!roomCode) {
                this.showError('joinError', 'Пожалуйста, введите код комнаты');
                return;
            }

            if (roomCode.length !== 8) {
                this.showError('joinError', 'Код комнаты должен быть из 8 символов');
                return;
            }

            this.showLoading(true, 'Присоединение к комнате...');

            const userName = this.currentUser.displayName || 'Игрок';
            await this.roomManager.joinRoom(roomCode, this.currentUser.uid, userName);

            this.showLoading(false);

            // Redirect to multiplayer game with room code
            window.location.href = `multiplayer-game.html?room=${roomCode}&isHost=false`;
        } catch (error) {
            this.showLoading(false);
            this.showError('joinError', error.message);
            console.error('Join room error:', error);
        }
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        const userAvatarElement = document.getElementById('userAvatar');

        if (userNameElement) {
            userNameElement.textContent = this.currentUser.displayName || 'Гость';
        }

        if (userAvatarElement) {
            const initial = (this.currentUser.displayName || 'U')[0].toUpperCase();
            userAvatarElement.textContent = initial;
        }
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

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MultiplayerPage();
});
