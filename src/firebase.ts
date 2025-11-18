import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";  


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApls5yuC3woKaDO08hWxMV3B3DA1FjN9o",
  authDomain: "techtide-corporate-llp.firebaseapp.com",
  projectId: "techtide-corporate-llp",
  storageBucket: "techtide-corporate-llp.firebasestorage.app",
  messagingSenderId: "713979694364",
  appId: "1:713979694364:web:879013dbb90d13cbea7ed9",
  measurementId: "G-THVYJW4K8S"
};

// Initialize Firebase


const app = initializeApp(firebaseConfig);

// Auth aur Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Realtime Database
export const db = getDatabase(app);