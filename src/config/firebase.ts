import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBWtXkaUyRjyrgkDA9N0ETGbPG_SmpFaTI",
  authDomain: "stgtv-app.firebaseapp.com",
  projectId: "stgtv-app",
  storageBucket: "stgtv-app.firebasestorage.app",
  messagingSenderId: "790104416351",
  appId: "1:790104416351:web:180f20a4e8507f97023bea"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);