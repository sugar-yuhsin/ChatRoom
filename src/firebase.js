// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_8ktgQMRJqgSgy6w_exrDTX3Be5Y72aE",
  authDomain: "chatroom-2898b.firebaseapp.com",
  databaseURL: "https://chatroom-2898b-default-rtdb.firebaseio.com",
  projectId: "chatroom-2898b",
  storageBucket: "chatroom-2898b.firebasestorage.app",
  messagingSenderId: "783179952020",
  appId: "1:783179952020:web:6358cec263d4c7d4c26981",
  measurementId: "G-06BE2X8QNN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
//const analytics = getAnalytics(app);