// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAT62uTTqiKuQvWYYU7jlc_Gae2LakQeE",
  authDomain: "markai-3f9fe.firebaseapp.com",
  projectId: "markai-3f9fe",
  storageBucket: "markai-3f9fe.firebasestorage.app",
  messagingSenderId: "87639503721",
  appId: "1:87639503721:web:d7f545937d42436e63c3f8",
  measurementId: "G-5KCBPB7QR1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);