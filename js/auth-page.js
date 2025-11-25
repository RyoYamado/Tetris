// Authentication page logic
import { 
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    db,
    doc,
    setDoc
} from './firebase.js';

// DOM elements
const DOM = {
    loginTab: document.getElementById('loginTab'),
    registerTab: document.getElementById('registerTab'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginButton: document.getElementById('loginButton'),
    registerButton: document.getElementById('registerButton'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError')
};

// Firebase error messages
function getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Этот email уже используется',
        'auth/invalid-email': 'Неверный формат email',
        'auth/weak-password': 'Пароль должен содержать минимум 6 символов',
        'auth/user-not-found': 'Пользователь с таким email не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже'
    };
    
    return errorMessages[errorCode] || 'Произошла ошибка. Попробуйте еще раз';
}

// Register user
async function registerUser(email, password, username) {
    try {
        DOM.registerButton.disabled = true;
        DOM.registerButton.textContent = "Регистрация...";
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, {
            displayName: username
        });
        
        const userData = {
            username: username,
            bestScore: 0,
            gamesPlayed: 0,
            createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, "users", user.uid), userData);
        
        DOM.registerForm.reset();
        DOM.registerError.textContent = "";
        
        // Redirect to game page
        window.location.href = 'game.html';
        
    } catch (error) {
        console.error("Registration error:", error);
        DOM.registerError.textContent = getFirebaseErrorMessage(error.code);
    } finally {
        DOM.registerButton.disabled = false;
        DOM.registerButton.textContent = "Зарегистрироваться";
    }
}

// Login user
async function loginUser(email, password) {
    try {
        DOM.loginButton.disabled = true;
        DOM.loginButton.textContent = "Вход...";
        
        await signInWithEmailAndPassword(auth, email, password);
        
        DOM.loginForm.reset();
        DOM.loginError.textContent = "";
        
        // Redirect to game page
        window.location.href = 'game.html';
        
    } catch (error) {
        console.error("Login error:", error);
        DOM.loginError.textContent = getFirebaseErrorMessage(error.code);
    } finally {
        DOM.loginButton.disabled = false;
        DOM.loginButton.textContent = "Войти";
    }
}

// Setup event listeners
function setupEventListeners() {
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
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        loginUser(email, password);
    });
    
    // Register form
    DOM.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
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
        
        registerUser(email, password, username);
    });
}

// Check if user is already logged in
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is already logged in, redirect to game page
            window.location.href = 'game.html';
        }
    });
}

// Initialize auth page
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuthState();
    console.log('Auth page initialized');
});