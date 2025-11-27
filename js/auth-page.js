// Authentication page logic - simplified and merged with auth.js functionality
import { 
    auth,
    onAuthStateChanged
} from './firebase.js';
import { AuthManager } from './auth.js';

// Initialize auth manager when on auth page
class AuthPageController {
    constructor() {
        this.authManager = new AuthManager(null);
        this.init();
    }
    
    init() {
        // Check if user is already logged in
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is already logged in, redirect to game page
                window.location.href = 'game.html';
            }
        });
        
        console.log('Auth page initialized');
    }
}

// Initialize auth page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthPageController();
});