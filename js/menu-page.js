// Menu Page - Game mode selection
import { auth, onAuthStateChanged } from './firebase.js';

class MenuPage {
    constructor() {
        this.currentUser = null;
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
            console.log('Menu page initialized for:', user.email);
        });
    }

    setupEventListeners() {
        // Single Player Button
        const singlePlayerBtn = document.getElementById('singlePlayerBtn');
        if (singlePlayerBtn) {
            singlePlayerBtn.addEventListener('click', () => {
                window.location.href = 'game.html';
            });
        }

        // Multiplayer Button
        const multiplayerBtn = document.getElementById('multiplayerBtn');
        if (multiplayerBtn) {
            multiplayerBtn.addEventListener('click', () => {
                window.location.href = 'multiplayer.html';
            });
        }

        // Leaderboard Button
        const leaderboardBtn = document.getElementById('leaderboardBtn');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                window.location.href = 'leaderboard.html';
            });
        }

        // Logout Button
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await auth.signOut();
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });
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
}

document.addEventListener('DOMContentLoaded', () => {
    new MenuPage();
});
