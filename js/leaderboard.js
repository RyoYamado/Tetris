// Leaderboard management system
import { 
    db,
    getDocs,
    query,
    collection,
    orderBy,
    limit,
    where
} from './firebase.js';

export class LeaderboardManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.leaderboardCache = null;
        this.userStatsCache = null;
        this.lastLeaderboardUpdate = 0;
        this.lastUserStatsUpdate = 0;
        this.leaderboardUpdateInterval = 30000; // 30 seconds
        this.userStatsUpdateInterval = 10000; // 10 seconds
        this.topPlayersCount = 10;
    }
    
    // Get top players from Firebase
    async getTopPlayers(limit_count = this.topPlayersCount) {
        const now = Date.now();
        
        // Check cache
        if (this.leaderboardCache && now - this.lastLeaderboardUpdate < this.leaderboardUpdateInterval && 
            this.leaderboardCache.length >= limit_count) {
            return this.leaderboardCache.slice(0, limit_count);
        }
        
        try {
            const q = query(
                collection(db, "users"),
                orderBy("bestScore", "desc"),
                limit(limit_count)
            );
            
            const querySnapshot = await getDocs(q);
            const leaders = [];
            
            querySnapshot.forEach((doc) => {
                leaders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.leaderboardCache = leaders;
            this.lastLeaderboardUpdate = now;
            
            return leaders;
        } catch (error) {
            console.error("Error loading top players:", error);
            return [];
        }
    }
    
    // Get user's rank and stats
    async getUserStats(userId) {
        const now = Date.now();
        
        // Check cache
        if (this.userStatsCache && this.userStatsCache.userId === userId && 
            now - this.lastUserStatsUpdate < this.userStatsUpdateInterval) {
            return this.userStatsCache;
        }
        
        try {
            // Get all users sorted by score
            const q = query(
                collection(db, "users"),
                orderBy("bestScore", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            let userRank = 0;
            let userStats = null;
            let position = 1;
            
            querySnapshot.forEach((doc) => {
                if (doc.id === userId) {
                    userRank = position;
                    userStats = {
                        id: doc.id,
                        rank: position,
                        ...doc.data()
                    };
                }
                position++;
            });
            
            if (userStats) {
                this.userStatsCache = userStats;
                this.lastUserStatsUpdate = now;
                return userStats;
            }
            
            return null;
        } catch (error) {
            console.error("Error loading user stats:", error);
            return null;
        }
    }
    
    // Get nearby players (player's rank +/- 5)
    async getNearbyPlayers(userId) {
        try {
            const userStats = await this.getUserStats(userId);
            if (!userStats) return [];
            
            const startRank = Math.max(1, userStats.rank - 5);
            const endRank = userStats.rank + 5;
            
            const q = query(
                collection(db, "users"),
                orderBy("bestScore", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const players = [];
            let position = 1;
            
            querySnapshot.forEach((doc) => {
                if (position >= startRank && position <= endRank) {
                    players.push({
                        id: doc.id,
                        rank: position,
                        ...doc.data()
                    });
                }
                position++;
            });
            
            return players;
        } catch (error) {
            console.error("Error loading nearby players:", error);
            return [];
        }
    }
    
    // Search for players by username
    async searchPlayers(searchTerm, maxResults = 10) {
        if (!searchTerm || searchTerm.length < 2) return [];
        
        try {
            const q = query(
                collection(db, "users"),
                orderBy("bestScore", "desc"),
                limit(maxResults * 3) // Get more to filter
            );
            
            const querySnapshot = await getDocs(q);
            const searchLower = searchTerm.toLowerCase();
            const results = [];
            let position = 1;
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.username && data.username.toLowerCase().includes(searchLower) && results.length < maxResults) {
                    results.push({
                        id: doc.id,
                        rank: position,
                        ...data
                    });
                }
                position++;
            });
            
            return results;
        } catch (error) {
            console.error("Error searching players:", error);
            return [];
        }
    }
    
    // Get player's personal best and stats
    async getPlayerProfile(userId) {
        try {
            const userStats = await this.getUserStats(userId);
            return userStats;
        } catch (error) {
            console.error("Error loading player profile:", error);
            return null;
        }
    }
    
    // Get statistics for the entire leaderboard
    async getLeaderboardStats() {
        try {
            const q = query(collection(db, "users"));
            const querySnapshot = await getDocs(q);
            
            let totalPlayers = 0;
            let totalGames = 0;
            let totalScore = 0;
            let highestScore = 0;
            let averageScore = 0;
            
            const users = [];
            
            querySnapshot.forEach((doc) => {
                totalPlayers++;
                const data = doc.data();
                users.push(data);
                totalGames += data.gamesPlayed || 0;
                totalScore += data.bestScore || 0;
                highestScore = Math.max(highestScore, data.bestScore || 0);
            });
            
            averageScore = totalPlayers > 0 ? totalScore / totalPlayers : 0;
            
            return {
                totalPlayers,
                totalGames,
                totalScore,
                highestScore,
                averageScore,
                averageGamesPerPlayer: totalPlayers > 0 ? totalGames / totalPlayers : 0
            };
        } catch (error) {
            console.error("Error loading leaderboard stats:", error);
            return null;
        }
    }
    
    // Clear cache
    clearCache() {
        this.leaderboardCache = null;
        this.userStatsCache = null;
        this.lastLeaderboardUpdate = 0;
        this.lastUserStatsUpdate = 0;
    }
    
    // Force update cache
    async forceUpdate() {
        this.clearCache();
        return await this.getTopPlayers();
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
