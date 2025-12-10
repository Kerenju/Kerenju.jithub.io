// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCvkoXxxH86ay_x06vPFvzx6he42yfg8mY",
    authDomain: "sistema-de-inventario-4691f.firebaseapp.com",
    projectId: "sistema-de-inventario-4691f",
    storageBucket: "sistema-de-inventario-4691f.firebasestorage.app",
    messagingSenderId: "39669404686",
    appId: "1:39669404686:web:36358ff76c27151bbb985f",
    measurementId: "G-QDVCEYJHE5"
  };

  // Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
