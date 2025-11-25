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
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDcCsrrSKpv3wgaK1cMnfCmsCCmw-v_ErE",
    authDomain: "tetr-ce39f.firebaseapp.com",
    projectId: "tetr-ce39f",
    storageBucket: "tetr-ce39f.firebasestorage.app",
    messagingSenderId: "325362402192",
    appId: "1:325362402192:web:cecbecb2017085a4716915"
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
    limit
};