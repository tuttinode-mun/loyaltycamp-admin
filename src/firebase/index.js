import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCIwYY2pIaRHATxxp0r0f5myFV23oxrQfE",
  authDomain: "loyalty-camp.firebaseapp.com",
  databaseURL: "https://loyalty-camp-default-rtdb.firebaseio.com",
  projectId: "loyalty-camp",
  storageBucket: "loyalty-camp.firebasestorage.app",
  messagingSenderId: "509358830444",
  appId: "1:509358830444:web:0420b7b6def8b5085a7949"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;