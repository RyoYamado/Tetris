// Authentication and user management
import { 
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    db,
    doc,
    setDoc,
    getDoc,
    updateDoc
} from './firebase.js';
import { DOM, getFirebaseErrorMessage } from './utils.js';

export class AuthManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentUser = null;
        this.userData = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initFirebaseAuth();
    }
    
    // Initialize Firebase authentication
    initFirebaseAuth() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await this.loadUserData(user);
                this.showUserInfo(user);
            } else {
                this.currentUser = null;
                this.userData = null;
                this.showAuthForm();
            }
        });
    }
    
    // Load user data from Firestore
    async loadUserData(user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                this.userData = userDoc.data();
            } else {
                this.userData = {
                    username: user.displayName || user.email.split('@')[0],
                    bestScore: 0,
                    gamesPlayed: 0,
                    createdAt: new Date().toISOString()
                };
                await setDoc(userDocRef, this.userData);
            }
            
            this.currentUser = user;
            this.updateUserInterface();
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }
    
    // Register user
    async registerUser(email, password, username) {
        try {
            if (DOM.registerButton) DOM.registerButton.disabled = true;
            if (DOM.registerButton) DOM.registerButton.textContent = "Регистрация...";
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await updateProfile(user, { displayName: username });
            
            const userData = {
                username: username,
                bestScore: 0,
                gamesPlayed: 0,
                createdAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, "users", user.uid), userData);
            
            if (DOM.registerForm) DOM.registerForm.reset();
            if (DOM.registerError) DOM.registerError.textContent = "";
            
        } catch (error) {
            console.error("Registration error:", error);
            if (DOM.registerError) DOM.registerError.textContent = getFirebaseErrorMessage(error.code);
        } finally {
            if (DOM.registerButton) DOM.registerButton.disabled = false;
            if (DOM.registerButton) DOM.registerButton.textContent = "Зарегистрироваться";
        }
    }
    
    // Login user
    async loginUser(email, password) {
        try {
            if (DOM.loginButton) DOM.loginButton.disabled = true;
            if (DOM.loginButton) DOM.loginButton.textContent = "Вход...";
            
            await signInWithEmailAndPassword(auth, email, password);
            
            if (DOM.loginForm) DOM.loginForm.reset();
            if (DOM.loginError) DOM.loginError.textContent = "";
            
        } catch (error) {
            console.error("Login error:", error);
            if (DOM.loginError) DOM.loginError.textContent = getFirebaseErrorMessage(error.code);
        } finally {
            if (DOM.loginButton) DOM.loginButton.disabled = false;
            if (DOM.loginButton) DOM.loginButton.textContent = "Войти";
        }
    }
    
    // Logout user
    async logoutUser() {
        try {
            await signOut(auth);
            // Clear local state
            this.currentUser = null;
            this.userData = null;

            // Ensure UI shows auth form or redirect to auth page
            const authContainer = document.getElementById('authContainer');
            if (authContainer) {
                this.showAuthForm();
            } else {
                // If auth container not present (we're on game page), redirect to index.html
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Logout error:", error);
        }
    }
    
    // Save score to Firebase
    // Accept either a numeric score or a detailed result object: { score, lines, level, timestamp }
    async saveScore(result) {
        if (!this.currentUser || !this.userData) return;

        try {
            // Normalize result
            const score = (typeof result === 'number') ? result : (result.score || 0);
            const lines = (result && result.lines) ? result.lines : 0;
            const level = (result && result.level) ? result.level : 1;
            const playedAt = (result && result.timestamp) ? result.timestamp : new Date().toISOString();

            // Ensure numeric defaults
            this.userData.bestScore = this.userData.bestScore || 0;
            this.userData.gamesPlayed = this.userData.gamesPlayed || 0;
            this.userData.totalLines = this.userData.totalLines || 0;
            this.userData.totalScore = this.userData.totalScore || 0;

            const newBestScore = Math.max(this.userData.bestScore, score);
            const gamesPlayed = this.userData.gamesPlayed + 1;
            const totalLines = (this.userData.totalLines || 0) + lines;
            const totalScore = (this.userData.totalScore || 0) + score;

            // Update user document with extended stats
            await updateDoc(doc(db, "users", this.currentUser.uid), {
                bestScore: newBestScore,
                gamesPlayed: gamesPlayed,
                lastPlayed: playedAt,
                lastScore: score,
                lastLines: lines,
                lastLevel: level,
                totalLines: totalLines,
                totalScore: totalScore
            });

            // Also write a leaderboard entry for this game (keeps history and enables leaderboard queries)
            try {
                const leaderboardId = `${this.currentUser.uid}_${Date.now()}`;
                await setDoc(doc(db, "leaderboard", leaderboardId), {
                    userId: this.currentUser.uid,
                    username: this.userData.username,
                    score: score,
                    lines: lines,
                    level: level,
                    timestamp: playedAt,
                    bestScore: newBestScore
                });
            } catch (lbError) {
                console.warn("Failed to write leaderboard entry:", lbError);
            }

            // Update local cache
            this.userData.bestScore = newBestScore;
            this.userData.gamesPlayed = gamesPlayed;
            this.userData.totalLines = totalLines;
            this.userData.totalScore = totalScore;
            this.userData.lastScore = score;
            this.userData.lastLines = lines;
            this.userData.lastLevel = level;
            this.userData.lastPlayed = playedAt;

            this.updateUserInterface();
        } catch (error) {
            console.error("Error saving score:", error);
        }
    }
    
    // Show auth form
    showAuthForm() {
        // Support both `id="authContainer"` and `.auth-container` markup
        let authContainer = document.getElementById('authContainer');
        if (!authContainer) authContainer = document.querySelector('.auth-container');
        if (authContainer) authContainer.classList.remove('hidden');
        if (DOM.userInfo) DOM.userInfo.classList.add('hidden');
        if (DOM.startButton) DOM.startButton.disabled = true;
    }
    
    // Show user info
    showUserInfo(user) {
        // Support both `id="authContainer"` and `.auth-container` markup
        let authContainer = document.getElementById('authContainer');
        if (!authContainer) authContainer = document.querySelector('.auth-container');
        if (authContainer) authContainer.classList.add('hidden');
        if (DOM.userInfo) DOM.userInfo.classList.remove('hidden');
        if (DOM.startButton) DOM.startButton.disabled = false;
    }
    
    // Update user interface
    updateUserInterface() {
        if (this.currentUser && this.userData) {
            if (DOM.userName) DOM.userName.textContent = this.userData.username;
            if (DOM.userEmail) DOM.userEmail.textContent = this.currentUser.email;
            if (DOM.userBestScore) DOM.userBestScore.textContent = this.userData.bestScore;
            if (DOM.userAvatar) DOM.userAvatar.textContent = this.userData.username.charAt(0).toUpperCase();
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Wait for DOM to be ready, then set up listeners
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachEventListeners());
        } else {
            this.attachEventListeners();
        }
    }
    
    attachEventListeners() {
        // Auth tabs
        if (document.getElementById('loginTab')) {
            document.getElementById('loginTab').addEventListener('click', () => {
                document.getElementById('loginTab').classList.add('active');
                document.getElementById('registerTab').classList.remove('active');
                document.getElementById('loginForm').classList.remove('hidden');
                document.getElementById('registerForm').classList.add('hidden');
                if (DOM.loginError) DOM.loginError.textContent = "";
                if (DOM.registerError) DOM.registerError.textContent = "";
            });
        }
        
        if (document.getElementById('registerTab')) {
            document.getElementById('registerTab').addEventListener('click', () => {
                document.getElementById('registerTab').classList.add('active');
                document.getElementById('loginTab').classList.remove('active');
                document.getElementById('registerForm').classList.remove('hidden');
                document.getElementById('loginForm').classList.add('hidden');
                if (DOM.loginError) DOM.loginError.textContent = "";
                if (DOM.registerError) DOM.registerError.textContent = "";
            });
        }
        
        // Login form
        if (DOM.loginForm) {
            DOM.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                this.loginUser(email, password);
            });
        }
        
        // Register form
        if (DOM.registerForm) {
            DOM.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('registerUsername').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (password !== confirmPassword) {
                    if (DOM.registerError) DOM.registerError.textContent = 'Пароли не совпадают!';
                    return;
                }
                
                if (username.length < 3) {
                    if (DOM.registerError) DOM.registerError.textContent = 'Имя пользователя должно содержать не менее 3 символов!';
                    return;
                }
                
                if (password.length < 6) {
                    if (DOM.registerError) DOM.registerError.textContent = 'Пароль должен содержать не менее 6 символов!';
                    return;
                }
                
                this.registerUser(email, password, username);
            });
        }
        
        // Logout button
        if (DOM.logoutButton) {
            DOM.logoutButton.addEventListener('click', () => this.logoutUser());
        }
    }
}