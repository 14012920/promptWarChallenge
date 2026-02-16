// Firebase Configuration
// This file contains Firebase initialization and service setup

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics, logEvent } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Initialize Firebase services
 * @returns {boolean} True if initialization was successful
 */
export function initializeFirebase(): boolean {
    try {
        if (!app) {
            app = initializeApp(firebaseConfig);

            // Initialize Analytics (only in browser environment)
            if (typeof window !== 'undefined') {
                analytics = getAnalytics(app);
            }

            // Initialize Auth
            auth = getAuth(app);

            // Initialize Firestore
            db = getFirestore(app);

            console.log('Firebase initialized successfully');
            return true;
        }
        return true;
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        return false;
    }
}

/**
 * Get Firebase Analytics instance
 */
export function getFirebaseAnalytics(): Analytics | null {
    return analytics;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth | null {
    return auth;
}

/**
 * Get Firestore instance
 */
export function getFirebaseDb(): Firestore | null {
    return db;
}

/**
 * Log a custom analytics event
 * @param eventName - Name of the event
 * @param params - Event parameters
 */
export function logAnalyticsEvent(eventName: string, params?: Record<string, any>): void {
    if (analytics) {
        logEvent(analytics, eventName, params);
    }
}

/**
 * Log game-specific events
 */
export const GameAnalytics = {
    logGameStart: (gameName: string) => {
        logAnalyticsEvent('game_start', { game_name: gameName });
    },

    logGameEnd: (gameName: string, score: number, duration: number) => {
        logAnalyticsEvent('game_end', {
            game_name: gameName,
            score,
            duration_seconds: duration
        });
    },

    logLevelComplete: (gameName: string, level: number, score: number) => {
        logAnalyticsEvent('level_complete', {
            game_name: gameName,
            level,
            score
        });
    },

    logHighScore: (gameName: string, score: number) => {
        logAnalyticsEvent('high_score', {
            game_name: gameName,
            score
        });
    }
};
