import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Config do Firebase (fornecido por você)
const firebaseConfig = {
  apiKey: "AIzaSyCIU7yiuI1uXfJWv6MoGYTv6ylqhzQhscA",
  authDomain: "insectcontrol-54785.firebaseapp.com",
  projectId: "insectcontrol-54785",
  storageBucket: "insectcontrol-54785.firebasestorage.app",
  messagingSenderId: "299720867487",
  appId: "1:299720867487:web:cdcff964efc45755496caa",
  measurementId: "G-DVQWP5TM9J",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
