import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBExHvhO8JMWMvlzysrivGgMZkkQfWf1PA",
  authDomain: "expense-tracker-9b999.firebaseapp.com",
  projectId: "expense-tracker-9b999",
  storageBucket: "expense-tracker-9b999.firebasestorage.app",
  messagingSenderId: "722275222806",
  appId: "1:722275222806:web:e48a109a338fb18afafc37",
  measurementId: "G-X2T1YLSGBN",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const provider =
  new GoogleAuthProvider();

export default app;