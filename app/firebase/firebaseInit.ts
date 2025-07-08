// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtSo5r63o8j6YLwV6Bn3fywaBiHLxn7g8",
  authDomain: "docket-app-a9fa8.firebaseapp.com",
  projectId: "docket-app-a9fa8",
  storageBucket: "docket-app-a9fa8.firebasestorage.app",
  messagingSenderId: "520950845946",
  appId: "1:520950845946:web:aef352f9aa50dd54a45443",
  measurementId: "G-CTT6E5Z0BE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);