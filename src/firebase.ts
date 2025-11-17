import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";  

const firebaseConfig = {
  apiKey: "AIzaSyDVqmKhJ6k6klHbAqx9kbMfY_o8Kmwv5zg",
  authDomain: "textile-16ce0.firebaseapp.com",
  projectId: "textile-16ce0",
  storageBucket: "textile-16ce0.appspot.com",
  messagingSenderId: "180590909752",
  appId: "1:180590909752:web:270bb9a688e423a94109cd",
  measurementId: "G-CKXV2M4T8H"
};

const app = initializeApp(firebaseConfig);

// Auth aur Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Realtime Database
export const db = getDatabase(app);

