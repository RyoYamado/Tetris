// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    getDocs,
    query,
    orderBy,
    limit,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAYhISDr9MJcpPE_ekpSC87Lc9yBX4HcA4",
    authDomain: "tetr-c0146.firebaseapp.com",
    projectId: "tetr-c0146",
    storageBucket: "tetr-c0146.firebasestorage.app",
    messagingSenderId: "444666701222",
    appId: "1:444666701222:web:07d02d988a0e048c065b67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase services
export { 
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    db,
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    getDocs,
    query,
    orderBy,
    limit,
    where
};

// Debug logs to help local dev: confirm initialization and auth state changes
console.info('Firebase initialized', { authInitialized: !!auth, dbInitialized: !!db });
onAuthStateChanged(auth, (user) => {
    console.info('Firebase auth state changed:', user ? { uid: user.uid, email: user.email } : null);
});