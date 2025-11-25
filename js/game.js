// Game logic and mechanics
import { 
    BOARD_WIDTH, 
    BOARD_HEIGHT, 
    EMPTY_CELL, 
    COLORS, 
    TETROMINOES, 
    DOM,
    getRandomPiece 
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
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.initNextPieceBoard();
        this.setupEventListeners();
    }
    
    // Initialize game board
    initBoard() {
        this.board = [];
        DOM.gameBoard.innerHTML = '';
        
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            this.board[y] = [];
            for (let x = 0; x < BOARD_WIDTH; x++) {
                this.board[y][x] = EMPTY_CELL;
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${x}-${y}`;
                DOM.gameBoard.appendChild(cell);
            }
        }
    }
    
    // Initialize next piece board
    initNextPieceBoard() {
        DOM.nextPieceBoard.innerHTML = '';
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement('div');
                cell.className = 'next-piece-cell';
                cell.id = `next-cell-${x}-${y}`;
                DOM.nextPieceBoard.appendChild(cell);
            }
        }
    }
    
    // Create new piece
    createNewPiece() {
        // Use next piece if available
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = getRandomPiece();
        }
        
        // Generate next piece
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
    
    // Draw game board
    drawBoard() {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = document.getElementById(`cell-${x}-${y}`);
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
                const cell = document.getElementById(`next-cell-${x}-${y}`);
                cell.className = 'next-piece-cell';
                cell.style.backgroundColor = '';
            }
        }
        
        // Draw next piece
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    const cell = document.getElementById(`next-cell-${x}-${y}`);
                    cell.className = 'next-piece-cell filled';
                    cell.style.backgroundColor = COLORS[this.nextPiece.color];
                }
            }
        }
    }
    
    // Draw current piece
    drawPiece() {
        if (!this.currentPiece) return;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPosition.x + x;
                    const boardY = this.currentPosition.y + y;
                    
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                        const cell = document.getElementById(`cell-${boardX}-${boardY}`);
                        cell.className = 'cell filled';
                        cell.style.backgroundColor = COLORS[this.currentPiece.color];
                    }
                }
            }
        }
    }
    
    // Check for collisions
    checkCollision(offsetX = 0, offsetY = 0) {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
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
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
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
            // Update score
            this.updateScore(linesCleared);
        }
    }
    
    // Update score
    updateScore(linesCleared) {
        // Points for lines
        const linePoints = [0, 40, 100, 300, 1200];
        this.score += linePoints[linesCleared] * this.level;
        
        // Update lines and level
        this.lines += linesCleared;
        this.level = Math.floor(this.lines / 10) + 1;
        
        // Update drop interval based on level
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            const speed = Math.max(100, 1000 - (this.level - 1) * 80);
            this.gameInterval = setInterval(() => this.moveDown(), speed);
        }
        
        // Update interface
        DOM.scoreElement.textContent = this.score;
        DOM.levelElement.textContent = this.level;
        DOM.linesElement.textContent = this.lines;
    }
    
    // Move piece down
    moveDown() {
        if (!this.gameActive || this.gamePaused) return;
        
        if (!this.checkCollision(0, 1)) {
            this.currentPosition.y++;
            this.redraw();
        } else {
            // Lock piece and create new one
            this.lockPiece();
            this.redraw();
        }
    }
    
    // Move piece left
    moveLeft() {
        if (!this.gameActive || this.gamePaused) return;
        
        if (!this.checkCollision(-1, 0)) {
            this.currentPosition.x--;
            this.redraw();
        }
    }
    
    // Move piece right
    moveRight() {
        if (!this.gameActive || this.gamePaused) return;
        
        if (!this.checkCollision(1, 0)) {
            this.currentPosition.x++;
            this.redraw();
        }
    }
    
    // Rotate piece
    rotatePiece() {
        if (!this.gameActive || this.gamePaused) return;
        
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
        
        // Save original shape in case of collision
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
        if (!this.gameActive || this.gamePaused) return;
        
        let dropDistance = 0;
        while (!this.checkCollision(0, dropDistance + 1)) {
            dropDistance++;
        }
        
        this.currentPosition.y += dropDistance;
        this.lockPiece();
        this.redraw();
    }
    
    // Toggle pause
    togglePause() {
        if (!this.gameActive) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            clearInterval(this.gameInterval);
            DOM.pauseButton.textContent = "Продолжить";
        } else {
            const speed = Math.max(100, 1000 - (this.level - 1) * 80);
            this.gameInterval = setInterval(() => this.moveDown(), speed);
            DOM.pauseButton.textContent = "Пауза";
        }
    }
    
    // Redraw game board
    redraw() {
        // First draw static board with locked pieces
        this.drawBoard();
        // Then draw current falling piece on top
        this.drawPiece();
    }
    
    // Start game
    startGame() {
        if (!this.gameActive) {
            this.initBoard();
            this.initNextPieceBoard();
            this.score = 0;
            this.level = 1;
            this.lines = 0;
            DOM.scoreElement.textContent = this.score;
            DOM.levelElement.textContent = this.level;
            DOM.linesElement.textContent = this.lines;
            
            this.gameActive = true;
            this.gamePaused = false;
            DOM.gameOverElement.style.display = 'none';
            
            // Reset next piece
            this.nextPiece = null;
            this.createNewPiece();
            this.redraw();
            
            // Set drop interval
            const speed = Math.max(100, 1000 - (this.level - 1) * 80);
            this.gameInterval = setInterval(() => this.moveDown(), speed);
            
            DOM.startButton.disabled = true;
            DOM.pauseButton.textContent = "Пауза";
        }
    }
    
    // Game over
    gameOver() {
        this.gameActive = false;
        clearInterval(this.gameInterval);
        DOM.gameOverElement.style.display = 'block';
        DOM.finalScoreElement.textContent = this.score;
        DOM.startButton.disabled = false;
        
        // Return score for saving
        return this.score;
    }
    
    // Restart game
    restartGame() {
        if (this.gameActive) {
            clearInterval(this.gameInterval);
        }
        this.startGame();
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior only for game keys when game is active
            if (this.gameActive && ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'p', 'P', 'з', 'З'].includes(e.key)) {
                e.preventDefault();
            }
            
            if (!this.gameActive) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    this.moveDown();
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
        
        // Game control buttons
        DOM.startButton.addEventListener('click', () => this.startGame());
        DOM.restartButton.addEventListener('click', () => this.restartGame());
        DOM.pauseButton.addEventListener('click', () => this.togglePause());
        DOM.playAgainButton.addEventListener('click', () => this.restartGame());
    }
}