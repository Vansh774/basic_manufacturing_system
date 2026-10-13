// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBuy240WTlT-fr8pDl3AQXmggGZDbNJ8Mw",
  authDomain: "manufacturing-3cfa6.firebaseapp.com",
  projectId: "manufacturing-3cfa6",
  storageBucket: "manufacturing-3cfa6.firebasestorage.app",
  messagingSenderId: "591965932735",
  appId: "1:591965932735:web:6df6170c0a48dabda90a0a",
  measurementId: "G-J46M0W0GQP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { analytics };
export default app;
