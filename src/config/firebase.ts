import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCgGw7P6mKAZsMaD23MqLlFhtBTig4qpIw",
  authDomain: "sebi77-cd706.firebaseapp.com",
  projectId: "sebi77-cd706",
  storageBucket: "sebi77-cd706.firebasestorage.app",
  messagingSenderId: "437221641298",
  appId: "1:437221641298:web:bce64284d54d3bfd4a638b",
  measurementId: "G-3G7MR5KX9P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
