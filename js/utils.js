// Utility functions

// Game constants
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const EMPTY_CELL = 'empty';

// Colors for tetrominoes
export const COLORS = [
    '#5d80b6', // синий - I
    '#acbdd3', // светлый синий - O
    '#7a9fd4', // голубой - T
    '#4a68a0', // темный синий - S
    '#6b8fc8', // средний синий - Z
    '#5d80b6', // синий - J
    '#8aabdd'  // голубой - L
];

// Tetromino shapes
export const TETROMINOES = [
    { 
        shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], 
        color: 0,
        name: 'I'
    }, 
    { 
        shape: [[1,1], [1,1]], 
        color: 1,
        name: 'O'
    }, 
    { 
        shape: [[0,1,0], [1,1,1], [0,0,0]], 
        color: 2,
        name: 'T'
    }, 
    { 
        shape: [[0,1,1], [1,1,0], [0,0,0]], 
        color: 3,
        name: 'S'
    }, 
    { 
        shape: [[1,1,0], [0,1,1], [0,0,0]], 
        color: 4,
        name: 'Z'
    }, 
    { 
        shape: [[1,0,0], [1,1,1], [0,0,0]], 
        color: 5,
        name: 'J'
    }, 
    { 
        shape: [[0,0,1], [1,1,1], [0,0,0]], 
        color: 6,
        name: 'L'
    }
];

// DOM elements
export const DOM = {
    // Auth elements
    authContainer: document.getElementById('authContainer'),
    loginTab: document.getElementById('loginTab'),
    registerTab: document.getElementById('registerTab'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginButton: document.getElementById('loginButton'),
    registerButton: document.getElementById('registerButton'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    
    // User info elements
    userInfo: document.getElementById('userInfo'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    userBestScore: document.getElementById('userBestScore'),
    logoutButton: document.getElementById('logoutButton'),
    
    // Game elements
    gameBoard: document.getElementById('gameBoard'),
    nextPieceBoard: document.getElementById('nextPieceBoard'),
    scoreElement: document.getElementById('score'),
    levelElement: document.getElementById('level'),
    linesElement: document.getElementById('lines'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    pauseButton: document.getElementById('pauseButton'),
    gameOverElement: document.getElementById('gameOver'),
    finalScoreElement: document.getElementById('finalScore'),
    playAgainButton: document.getElementById('playAgainButton'),
    leaderboardList: document.getElementById('leaderboardList')
};

// Get Firebase error message
export function getFirebaseErrorMessage(errorCode) {
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

// Generate random piece
export function getRandomPiece() {
    const pieceIndex = Math.floor(Math.random() * TETROMINOES.length);
    return JSON.parse(JSON.stringify(TETROMINOES[pieceIndex]));
}