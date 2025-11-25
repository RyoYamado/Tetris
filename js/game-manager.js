// Game manager for coordinating between game and auth
import { 
    db,
    getDocs,
    query,
    collection,
    orderBy,
    limit
} from './firebase.js';
import { DOM } from './utils.js';

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
    handleGameOver(score) {
        if (this.authManager) {
            this.authManager.saveScore(score);
        }
    }
    
    // Update leaderboard
    async updateLeaderboard() {
        try {
            const q = query(
                collection(db, "users"),
                orderBy("bestScore", "desc"),
                limit(10)
            );
            
            const querySnapshot = await getDocs(q);
            const leaders = [];
            
            querySnapshot.forEach((doc) => {
                leaders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.displayLeaderboard(leaders);
        } catch (error) {
            console.error("Error loading leaderboard:", error);
            DOM.leaderboardList.innerHTML = '<div class="leaderboard-item">Ошибка загрузки</div>';
        }
    }
    
    // Display leaderboard
    displayLeaderboard(leaders) {
        DOM.leaderboardList.innerHTML = '';
        
        if (leaders.length === 0) {
            DOM.leaderboardList.innerHTML = '<div class="leaderboard-item">Нет результатов</div>';
            return;
        }
        
        leaders.forEach((user, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            item.innerHTML = `
                <div>
                    <span class="leaderboard-position">${index + 1}.</span>
                    <span class="leaderboard-name">${user.username}</span>
                </div>
                <div class="leaderboard-score">${user.bestScore}</div>
            `;
            
            // Highlight current user
            if (this.authManager && this.authManager.currentUser && user.id === this.authManager.currentUser.uid) {
                item.style.backgroundColor = '#e94560';
            }
            
            DOM.leaderboardList.appendChild(item);
        });
    }
}