// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDhrc0GSqUS-GVXP7QLtdNyzMo1TNgUJ0Y",
    authDomain: "billbuddy-cf1ce.firebaseapp.com",
    projectId: "billbuddy-cf1ce",
    storageBucket: "billbuddy-cf1ce.firebasestorage.app",
    messagingSenderId: "50373998195",
    appId: "1:50373998195:web:cd2f20046a9a6e15241c06",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export const storage = getStorage(app);

export const functions = getFunctions(app);

export default app;