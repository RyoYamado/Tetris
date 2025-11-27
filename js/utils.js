// Utility functions

// Game constants
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const EMPTY_CELL = 'empty';

// Game mechanics constants
export const BASE_SPEED = 1000;
export const SPEED_INCREMENT = 80;
export const MIN_SPEED = 100;
export const LINES_PER_LEVEL = 10;

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

// Line scoring system
export const LINE_SCORES = [0, 40, 100, 300, 1200];

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

// DOM elements cache
export const DOM = {
    // Game elements
    get gameBoard() { return document.getElementById('gameBoard'); },
    get nextPieceBoard() { return document.getElementById('nextPieceBoard'); },
    get scoreElement() { return document.getElementById('score'); },
    get levelElement() { return document.getElementById('level'); },
    get linesElement() { return document.getElementById('lines'); },
    get startButton() { return document.getElementById('startButton'); },
    get restartButton() { return document.getElementById('restartButton'); },
    get pauseButton() { return document.getElementById('pauseButton'); },
    get gameOverElement() { return document.getElementById('gameOver'); },
    get finalScoreElement() { return document.getElementById('finalScore'); },
    get playAgainButton() { return document.getElementById('playAgainButton'); },

    // Auth page elements (if available)
    get loginForm() { return document.getElementById('loginForm'); },
    get registerForm() { return document.getElementById('registerForm'); },
    get loginButton() { return document.getElementById('loginButton'); },
    get registerButton() { return document.getElementById('registerButton'); },
    get loginError() { return document.getElementById('loginError'); },
    get registerError() { return document.getElementById('registerError'); },

    // User/Auth elements (if available)
    get userInfo() { return document.getElementById('userInfo'); },
    get userAvatar() { return document.getElementById('userAvatar'); },
    get userName() { return document.getElementById('userName'); },
    get userEmail() { return document.getElementById('userEmail'); },
    get userBestScore() { return document.getElementById('userBestScore'); },
    get logoutButton() { return document.getElementById('logoutButton'); }
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

// Calculate game speed based on level
export function getGameSpeed(level) {
    return Math.max(MIN_SPEED, BASE_SPEED - (level - 1) * SPEED_INCREMENT);
}

// Cache for DOM cells to avoid repeated queries
export class CellCache {
    constructor() {
        this.mainBoardCells = new Map();
        this.nextPieceCells = new Map();
    }
    
    initMainBoard() {
        this.mainBoardCells.clear();
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const id = `cell-${x}-${y}`;
                this.mainBoardCells.set(id, document.getElementById(id));
            }
        }
    }
    
    initNextPiece() {
        this.nextPieceCells.clear();
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const id = `next-cell-${x}-${y}`;
                this.nextPieceCells.set(id, document.getElementById(id));
            }
        }
    }
    
    getMainCell(x, y) {
        return this.mainBoardCells.get(`cell-${x}-${y}`);
    }
    
    getNextCell(x, y) {
        return this.nextPieceCells.get(`next-cell-${x}-${y}`);
    }
}