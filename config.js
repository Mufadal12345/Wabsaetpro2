// config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8JN73w75NQB7MifQMdOl1VcwifklyVZU",
  authDomain: "newpro-d5360.firebaseapp.com",
  databaseURL: "https://newpro-d5360-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "newpro-d5360",
  storageBucket: "newpro-d5360.firebasestorage.app",
  messagingSenderId: "732050035324",
  appId: "1:732050035324:web:5a38e03134de3b287b2ff9",
  measurementId: "G-9TYX1QYJQG"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
