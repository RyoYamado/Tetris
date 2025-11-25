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
    updateDoc,
    getDocs,
    query,
    collection,
    orderBy,
    limit
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
        // Auth state change listener
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User signed in
                await this.loadUserData(user);
                this.showUserInfo(user);
            } else {
                // User signed out
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
                // Create new user record
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
            this.gameManager.updateLeaderboard();
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }
    
    // Register user
    async registerUser(email, password, username) {
        try {
            DOM.registerButton.disabled = true;
            DOM.registerButton.textContent = "Регистрация...";
            
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update profile with username
            await updateProfile(user, {
                displayName: username
            });
            
            // Create user record in Firestore
            const userData = {
                username: username,
                bestScore: 0,
                gamesPlayed: 0,
                createdAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, "users", user.uid), userData);
            
            DOM.registerForm.reset();
            DOM.registerError.textContent = "";
            
        } catch (error) {
            console.error("Registration error:", error);
            DOM.registerError.textContent = getFirebaseErrorMessage(error.code);
        } finally {
            DOM.registerButton.disabled = false;
            DOM.registerButton.textContent = "Зарегистрироваться";
        }
    }
    
    // Login user
    async loginUser(email, password) {
        try {
            DOM.loginButton.disabled = true;
            DOM.loginButton.textContent = "Вход...";
            
            await signInWithEmailAndPassword(auth, email, password);
            
            DOM.loginForm.reset();
            DOM.loginError.textContent = "";
            
        } catch (error) {
            console.error("Login error:", error);
            DOM.loginError.textContent = getFirebaseErrorMessage(error.code);
        } finally {
            DOM.loginButton.disabled = false;
            DOM.loginButton.textContent = "Войти";
        }
    }
    
    // Logout user
    async logoutUser() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
        }
    }
    
    // Save score to Firebase
    async saveScore(score) {
        if (!this.currentUser || !this.userData) return;
        
        try {
            // Update best score if current score is higher
            const newBestScore = Math.max(this.userData.bestScore, score);
            const gamesPlayed = this.userData.gamesPlayed + 1;
            
            await updateDoc(doc(db, "users", this.currentUser.uid), {
                bestScore: newBestScore,
                gamesPlayed: gamesPlayed,
                lastPlayed: new Date().toISOString()
            });
            
            // Update local data
            this.userData.bestScore = newBestScore;
            this.userData.gamesPlayed = gamesPlayed;
            
            this.updateUserInterface();
            this.gameManager.updateLeaderboard();
            
        } catch (error) {
            console.error("Error saving score:", error);
        }
    }
    
    // Show auth form
    showAuthForm() {
        DOM.authContainer.classList.remove('hidden');
        DOM.userInfo.classList.add('hidden');
        DOM.startButton.disabled = true;
    }
    
    // Show user info
    showUserInfo(user) {
        DOM.authContainer.classList.add('hidden');
        DOM.userInfo.classList.remove('hidden');
        DOM.startButton.disabled = false;
    }
    
    // Update user interface
    updateUserInterface() {
        if (this.currentUser && this.userData) {
            DOM.userName.textContent = this.userData.username;
            DOM.userEmail.textContent = this.currentUser.email;
            DOM.userBestScore.textContent = this.userData.bestScore;
            DOM.userAvatar.textContent = this.userData.username.charAt(0).toUpperCase();
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Auth tabs
        DOM.loginTab.addEventListener('click', () => {
            DOM.loginTab.classList.add('active');
            DOM.registerTab.classList.remove('active');
            DOM.loginForm.classList.remove('hidden');
            DOM.registerForm.classList.add('hidden');
            DOM.loginError.textContent = "";
            DOM.registerError.textContent = "";
        });
        
        DOM.registerTab.addEventListener('click', () => {
            DOM.registerTab.classList.add('active');
            DOM.loginTab.classList.remove('active');
            DOM.registerForm.classList.remove('hidden');
            DOM.loginForm.classList.add('hidden');
            DOM.loginError.textContent = "";
            DOM.registerError.textContent = "";
        });
        
        // Login form
        DOM.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = DOM.loginEmail.value;
            const password = DOM.loginPassword.value;
            this.loginUser(email, password);
        });
        
        // Register form
        DOM.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = DOM.registerUsername.value;
            const email = DOM.registerEmail.value;
            const password = DOM.registerPassword.value;
            const confirmPassword = DOM.confirmPassword.value;
            
            if (password !== confirmPassword) {
                DOM.registerError.textContent = 'Пароли не совпадают!';
                return;
            }
            
            if (username.length < 3) {
                DOM.registerError.textContent = 'Имя пользователя должно содержать не менее 3 символов!';
                return;
            }
            
            if (password.length < 6) {
                DOM.registerError.textContent = 'Пароль должен содержать не менее 6 символов!';
                return;
            }
            
            this.registerUser(email, password, username);
        });
        
        // Logout button
        DOM.logoutButton.addEventListener('click', () => this.logoutUser());
    }
}