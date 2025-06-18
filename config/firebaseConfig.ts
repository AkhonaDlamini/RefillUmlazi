import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyATvTgB5Z3Z_vIjH0nGoCy--PBjLbPJNwU",
  authDomain: "refillumlazi.firebaseapp.com",
  databaseURL: "https://refillumlazi-default-rtdb.firebaseio.com",
  projectId: "refillumlazi",
  storageBucket: "refillumlazi.firebasestorage.app",
  messagingSenderId: "87689899798",
  appId: "1:87689899798:web:5240c62cdb04d386d82a37"
};
  
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export {db, auth};