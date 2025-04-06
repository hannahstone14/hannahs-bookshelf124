import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyCDG1lRXmklOkyZ_JGqf-93G85P_0tiadI",
  authDomain: "books-f1fc2.firebaseapp.com",
  projectId: "books-f1fc2",
  storageBucket: "books-f1fc2.firebasestorage.app", // Corrected key name
  messagingSenderId: "742230748743",
  appId: "1:742230748743:web:333e28ffcec409fee54b62",
  measurementId: "G-9WLQJ0HLWQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app); 