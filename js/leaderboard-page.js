// Leaderboard page controller
import { LeaderboardManager } from './leaderboard.js';
import { AuthManager } from './auth.js';
import { auth, onAuthStateChanged } from './firebase.js';
import { DOM } from './utils.js';

class LeaderboardPage {
    constructor() {
        this.authManager = null;
        this.leaderboardManager = null;
        this.currentFilter = 'top';
        this.currentSearchResults = null;
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
            
            // Initialize managers
            this.authManager = new AuthManager(null);
            this.leaderboardManager = new LeaderboardManager(this.authManager);
            
            // Setup UI
            this.setupEventListeners();
            this.loadInitialData();
            
            console.log('Leaderboard page initialized');
        });
    }
    
    setupEventListeners() {
        // Home button
        const homeButton = document.getElementById('homeButton');
        if (homeButton) {
            homeButton.addEventListener('click', () => {
                window.location.href = 'game.html';
            });
        }
        
        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                this.authManager.logoutUser();
            });
        }
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.loadLeaderboardData();
            });
        });
        
        // Search
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.performSearch();
            });
        }
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        
        // Refresh button
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.leaderboardManager.clearCache();
                this.loadLeaderboardData();
            });
        }
    }
    
    async loadInitialData() {
        try {
            // Load user stats
            if (this.authManager.currentUser) {
                const userStats = await this.leaderboardManager.getUserStats(this.authManager.currentUser.uid);
                this.updateUserStatsUI(userStats);
            }
            
            // Load leaderboard stats
            const stats = await this.leaderboardManager.getLeaderboardStats();
            this.updateLeaderboardStats(stats);
            
            // Load initial leaderboard
            await this.loadLeaderboardData();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }
    
    async loadLeaderboardData() {
        try {
            const body = document.getElementById('leaderboardBody');
            const tableTitle = document.getElementById('tableTitle');
            
            if (!body) return;
            
            body.innerHTML = '<div class="loading">Загрузка...</div>';
            
            let players = [];
            let title = '';
            
            switch (this.currentFilter) {
                case 'top':
                    players = await this.leaderboardManager.getTopPlayers(10);
                    title = 'Топ 10 игроков';
                    break;
                case 'nearby':
                    if (this.authManager.currentUser) {
                        players = await this.leaderboardManager.getNearbyPlayers(this.authManager.currentUser.uid);
                        title = 'Игроки около меня';
                    }
                    break;
                case 'all':
                    const allPlayers = await this.leaderboardManager.getTopPlayers(1000);
                    players = allPlayers;
                    title = `Все игроки (${allPlayers.length})`;
                    break;
            }
            
            if (tableTitle) {
                tableTitle.textContent = title;
            }
            
            this.renderLeaderboardTable(players);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            const body = document.getElementById('leaderboardBody');
            if (body) {
                body.innerHTML = '<div class="error-message">Ошибка загрузки таблицы лидеров</div>';
            }
        }
    }
    
    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            return;
        }
        
        try {
            const body = document.getElementById('leaderboardBody');
            const tableTitle = document.getElementById('tableTitle');
            
            if (body) {
                body.innerHTML = '<div class="loading">Поиск...</div>';
            }
            
            const results = await this.leaderboardManager.searchPlayers(searchTerm, 20);
            
            if (tableTitle) {
                tableTitle.textContent = `Результаты поиска: "${searchTerm}" (${results.length})`;
            }
            
            this.renderLeaderboardTable(results);
        } catch (error) {
            console.error('Error performing search:', error);
            const body = document.getElementById('leaderboardBody');
            if (body) {
                body.innerHTML = '<div class="error-message">Ошибка при поиске</div>';
            }
        }
    }
    
    renderLeaderboardTable(players) {
        const body = document.getElementById('leaderboardBody');
        if (!body) return;
        
        if (players.length === 0) {
            body.innerHTML = '<div class="loading">Нет результатов</div>';
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        players.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = 'table-row';
            
            // Check if this is current user
            if (this.authManager.currentUser && player.id === this.authManager.currentUser.uid) {
                row.classList.add('current-user');
            }
            
            const rank = player.rank || (index + 1);
            const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
            const avgScore = player.gamesPlayed > 0 
                ? Math.round(player.bestScore / player.gamesPlayed * 100) / 100
                : 0;
            
            const userInitial = player.username ? player.username.charAt(0).toUpperCase() : 'U';
            
            row.innerHTML = `
                <div class="col-rank ${rankClass}">${rank}</div>
                <div class="col-player">
                    <div class="player-avatar">${this.leaderboardManager.escapeHtml(userInitial)}</div>
                    <div class="player-name">${this.leaderboardManager.escapeHtml(player.username || 'Аноним')}</div>
                </div>
                <div class="col-score">${player.bestScore || 0}</div>
                <div class="col-games">${player.gamesPlayed || 0}</div>
                <div class="col-avgScore">${avgScore}</div>
            `;
            
            fragment.appendChild(row);
        });
        
        body.innerHTML = '';
        body.appendChild(fragment);
    }
    
    updateUserStatsUI(userStats) {
        if (!userStats) return;
        
        const myRank = document.getElementById('myRank');
        const myScore = document.getElementById('myScore');
        const myPosition = document.getElementById('myPosition');
        
        if (myRank) {
            myRank.textContent = userStats.rank || '-';
        }
        
        if (myScore) {
            myScore.textContent = userStats.bestScore || 0;
        }
        
        if (myPosition) {
            const avgScore = userStats.gamesPlayed > 0 
                ? Math.round(userStats.bestScore / userStats.gamesPlayed * 100) / 100
                : 0;
            myPosition.textContent = avgScore;
        }
    }
    
    async updateLeaderboardStats(stats) {
        if (!stats) return;
        
        const totalPlayers = document.getElementById('totalPlayers');
        const statsTotal = document.getElementById('statsTotal');
        const statsGames = document.getElementById('statsGames');
        const statsMax = document.getElementById('statsMax');
        const statsAvg = document.getElementById('statsAvg');
        
        if (totalPlayers) {
            totalPlayers.textContent = stats.totalPlayers;
        }
        
        if (statsTotal) {
            statsTotal.textContent = stats.totalPlayers;
        }
        
        if (statsGames) {
            statsGames.textContent = stats.totalGames;
        }
        
        if (statsMax) {
            statsMax.textContent = stats.highestScore;
        }
        
        if (statsAvg) {
            const avgRounded = Math.round(stats.averageScore * 100) / 100;
            statsAvg.textContent = avgRounded;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LeaderboardPage();
});
