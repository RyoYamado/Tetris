// Game logic and mechanics
import { 
    BOARD_WIDTH, 
    BOARD_HEIGHT, 
    EMPTY_CELL, 
    COLORS, 
    TETROMINOES, 
    DOM,
    getRandomPiece,
    getGameSpeed,
    BASE_SPEED,
    SPEED_INCREMENT,
    MIN_SPEED,
    LINES_PER_LEVEL,
    LINE_SCORES,
    CellCache
} from './utils.js';

// Game state
export class TetrisGame {
    constructor() {
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.currentPosition = { x: 0, y: 0 };
        this.gameInterval = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameActive = false;
        this.gamePaused = false;
        this.cellCache = new CellCache();
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.initNextPieceBoard();
        this.setupEventListeners();
    }
    
    // Initialize game board with cached cells
    initBoard() {
        this.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL));
        DOM.gameBoard.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${x}-${y}`;
                fragment.appendChild(cell);
            }
        }
        DOM.gameBoard.appendChild(fragment);
        this.cellCache.initMainBoard();
    }
    
    // Initialize next piece board with cached cells
    initNextPieceBoard() {
        DOM.nextPieceBoard.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement('div');
                cell.className = 'next-piece-cell';
                cell.id = `next-cell-${x}-${y}`;
                fragment.appendChild(cell);
            }
        }
        DOM.nextPieceBoard.appendChild(fragment);
        this.cellCache.initNextPiece();
    }
    
    // Create new piece
    createNewPiece() {
        this.currentPiece = this.nextPiece || getRandomPiece();
        this.nextPiece = getRandomPiece();
        this.drawNextPiece();
        
        this.currentPosition = {
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2),
            y: 0
        };
        
        // Check for collision at spawn (game over)
        if (this.checkCollision()) {
            this.gameOver();
            return false;
        }
        
        return true;
    }
    
    // Draw game board - only update changed cells
    drawBoard() {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = this.cellCache.getMainCell(x, y);
                if (this.board[y][x] !== EMPTY_CELL) {
                    cell.className = 'cell filled';
                    cell.style.backgroundColor = COLORS[this.board[y][x]];
                } else {
                    cell.className = 'cell';
                    cell.style.backgroundColor = '';
                }
            }
        }
    }
    
    // Draw next piece
    drawNextPiece() {
        if (!this.nextPiece) return;
        
        // Clear next piece board
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = this.cellCache.getNextCell(x, y);
                cell.className = 'next-piece-cell';
                cell.style.backgroundColor = '';
            }
        }
        
        // Draw next piece
        const shape = this.nextPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const cell = this.cellCache.getNextCell(x, y);
                    cell.className = 'next-piece-cell filled';
                    cell.style.backgroundColor = COLORS[this.nextPiece.color];
                }
            }
        }
    }
    
    // Draw current piece
    drawPiece() {
        if (!this.currentPiece) return;
        
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = this.currentPosition.x + x;
                    const boardY = this.currentPosition.y + y;
                    
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                        const cell = this.cellCache.getMainCell(boardX, boardY);
                        cell.className = 'cell filled';
                        cell.style.backgroundColor = COLORS[this.currentPiece.color];
                    }
                }
            }
        }
    }
    
    // Check for collisions
    checkCollision(offsetX = 0, offsetY = 0) {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.currentPosition.x + x + offsetX;
                    const newY = this.currentPosition.y + y + offsetY;
                    
                    if (
                        newX < 0 || 
                        newX >= BOARD_WIDTH || 
                        newY >= BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX] !== EMPTY_CELL)
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // Lock piece on board
    lockPiece() {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = this.currentPosition.x + x;
                    const boardY = this.currentPosition.y + y;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        this.checkLines();
        
        // Create new piece
        return this.createNewPiece();
    }
    
    // Check and clear completed lines
    checkLines() {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== EMPTY_CELL)) {
                // Remove line
                this.board.splice(y, 1);
                // Add new empty line at top
                this.board.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL));
                linesCleared++;
                y++; // Check same position again after shift
            }
        }
        
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
        }
    }
    
    // Update score
    updateScore(linesCleared) {
        this.score += LINE_SCORES[linesCleared] * this.level;
        this.lines += linesCleared;
        this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
        
        // Update drop interval based on level
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            const speed = getGameSpeed(this.level);
            this.gameInterval = setInterval(() => this.moveDown(), speed);
        }
        
        // Update interface
        if (DOM.scoreElement) DOM.scoreElement.textContent = this.score;
        if (DOM.levelElement) DOM.levelElement.textContent = this.level;
        if (DOM.linesElement) DOM.linesElement.textContent = this.lines;
    }
    
    // Move piece down; if userInitiated=true it was caused by player (soft drop)
    moveDown(userInitiated = false) {
        if (!this.isGamePlayable()) return;

        if (!this.checkCollision(0, 1)) {
            this.currentPosition.y++;

            // Soft drop scoring: +1 per cell moved by player
            if (userInitiated) {
                this.score += 1;
                if (DOM.scoreElement) DOM.scoreElement.textContent = this.score;
            }

            this.redraw();
        } else {
            this.lockPiece();
            this.redraw();
        }
    }
    
    // Move piece left
    moveLeft() {
        if (!this.isGamePlayable()) return;
        
        if (!this.checkCollision(-1, 0)) {
            this.currentPosition.x--;
            this.redraw();
        }
    }
    
    // Move piece right
    moveRight() {
        if (!this.isGamePlayable()) return;
        
        if (!this.checkCollision(1, 0)) {
            this.currentPosition.x++;
            this.redraw();
        }
    }
    
    // Rotate piece
    rotatePiece() {
        if (!this.isGamePlayable()) return;
        
        const originalShape = this.currentPiece.shape;
        const rows = originalShape.length;
        const cols = originalShape[0].length;
        
        // Create rotated matrix
        const rotated = [];
        for (let x = 0; x < cols; x++) {
            rotated[x] = [];
            for (let y = rows - 1; y >= 0; y--) {
                rotated[x][rows - 1 - y] = originalShape[y][x];
            }
        }
        
        this.currentPiece.shape = rotated;
        
        // If collision after rotation, revert to original shape
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        } else {
            this.redraw();
        }
    }
    
    // Hard drop
    hardDrop() {
        if (!this.isGamePlayable()) return;

        let dropDistance = 0;
        while (!this.checkCollision(0, dropDistance + 1)) {
            dropDistance++;
        }

        if (dropDistance > 0) {
            // Hard drop scoring: +2 points per cell dropped (standard Tetris behavior)
            this.score += dropDistance * 2;
        }

        this.currentPosition.y += dropDistance;
        this.lockPiece();
        this.redraw();

        // Update score UI after hard drop
        if (DOM.scoreElement) DOM.scoreElement.textContent = this.score;
    }
    
    // Check if game is playable (not paused or game over)
    isGamePlayable() {
        return this.gameActive && !this.gamePaused;
    }
    
    // Toggle pause
    togglePause() {
        if (!this.gameActive) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            clearInterval(this.gameInterval);
        } else {
            const speed = getGameSpeed(this.level);
            this.gameInterval = setInterval(() => this.moveDown(), speed);
        }
        
        // Emit pause state change event
        window.dispatchEvent(new CustomEvent('gamePauseChanged', { 
            detail: { isPaused: this.gamePaused } 
        }));
    }
    
    // Redraw game board
    redraw() {
        this.drawBoard();
        this.drawPiece();
    }
    
    // Start game
    startGame() {
        if (this.gameActive) return;
        
        this.initBoard();
        this.initNextPieceBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        
        if (DOM.scoreElement) DOM.scoreElement.textContent = this.score;
        if (DOM.levelElement) DOM.levelElement.textContent = this.level;
        if (DOM.linesElement) DOM.linesElement.textContent = this.lines;
        
        this.gameActive = true;
        this.gamePaused = false;
        if (DOM.gameOverElement) DOM.gameOverElement.style.display = 'none';
        
        this.nextPiece = null;
        this.createNewPiece();
        this.redraw();
        
        const speed = getGameSpeed(this.level);
        this.gameInterval = setInterval(() => this.moveDown(), speed);
        
        // Emit game state change event
        window.dispatchEvent(new CustomEvent('gameStateChanged', { 
            detail: { state: 'playing', gameActive: true, gamePaused: false } 
        }));
    }
    
    // Game over
    gameOver() {
        this.gameActive = false;
        clearInterval(this.gameInterval);
        if (DOM.gameOverElement) DOM.gameOverElement.style.display = 'block';
        if (DOM.finalScoreElement) DOM.finalScoreElement.textContent = this.score;
        
        // Emit game state change event
        window.dispatchEvent(new CustomEvent('gameStateChanged', { 
            detail: { state: 'gameover', gameActive: false, gamePaused: false } 
        }));
        
        return this.score;
    }
    
    // Restart game
    restartGame() {
        if (this.gameActive) {
            // Stop current interval and mark game inactive so startGame() can reinitialize
            clearInterval(this.gameInterval);
            this.gameActive = false;
            this.gamePaused = false;
        }

        // Start fresh
        this.startGame();
    }
    
    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            const key = e.key.toLowerCase();
            const isCyrillic = ['з', 'ш', 'щ', 'п'].includes(key);
            
            // Prevent default for game keys
            if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup', ' '].includes(key) || 
                key === 'p' || isCyrillic) {
                e.preventDefault();
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    this.moveDown(true);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
                case 'p':
                case 'P':
                case 'з':
                case 'З':
                    this.togglePause();
                    break;
            }
        });
        
        // Play again button
        if (DOM.playAgainButton) {
            DOM.playAgainButton.addEventListener('click', () => this.restartGame());
        }
    }
}