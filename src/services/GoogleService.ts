// Enhanced Google Services Integration
import {
    getFirebaseAuth,
    getFirebaseDb,
    logAnalyticsEvent
} from './FirebaseService';
import {
    signInAnonymously,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp
} from 'firebase/firestore';

export interface UserProfile {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface LeaderboardEntry {
    rank: number;
    name: string;
    score: number;
}

/**
 * Enhanced Google Service integration with Firebase
 * Provides authentication, leaderboard, and analytics
 */
export class GoogleService {
    private static instance: GoogleService;
    private currentUser: User | null = null;
    private userProfile: UserProfile | null = null;
    private leaderboardCache: LeaderboardEntry[] = [
        { rank: 1, name: "BomberPro", score: 5000 },
        { rank: 2, name: "BlastMaster", score: 4200 },
        { rank: 3, name: "ExplosionKing", score: 3800 },
        { rank: 4, name: "TNT_Lover", score: 3100 },
        { rank: 5, name: "FuseRunner", score: 2500 }
    ];

    private constructor() {
        this.initAuth();
    }

    public static getInstance(): GoogleService {
        if (!GoogleService.instance) {
            GoogleService.instance = new GoogleService();
        }
        return GoogleService.instance;
    }

    /**
     * Initialize Firebase Authentication
     */
    private initAuth(): void {
        const auth = getFirebaseAuth();
        if (!auth) return;

        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            if (user) {
                console.log('User authenticated:', user.uid);
                logAnalyticsEvent('user_authenticated', {
                    user_id: user.uid
                });
            }
        });
    }

    /**
     * Sign in user (compatible with old login method)
     */
    public async login(): Promise<UserProfile> {
        const auth = getFirebaseAuth();

        if (auth) {
            try {
                const result = await signInAnonymously(auth);
                this.currentUser = result.user;
                logAnalyticsEvent('sign_in', {
                    method: 'anonymous'
                });
            } catch (error) {
                console.error('Firebase sign in failed:', error);
            }
        }

        // Return mock user profile for compatibility
        this.userProfile = {
            id: this.currentUser?.uid || "g_123456789",
            name: "PlayerOne",
            avatarUrl: "https://via.placeholder.com/32"
        };

        return this.userProfile;
    }

    /**
     * Check if user is logged in
     */
    public isLoggedIn(): boolean {
        return this.userProfile !== null;
    }

    /**
     * Check if user is authenticated (Firebase)
     */
    public isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    /**
     * Get current user profile
     */
    public getUser(): UserProfile | null {
        return this.userProfile;
    }

    /**
     * Get current user ID
     */
    public getUserId(): string | null {
        return this.currentUser?.uid || null;
    }

    /**
     * Get leaderboard (compatible with old method)
     */
    public async getLeaderboard(): Promise<LeaderboardEntry[]> {
        const db = getFirebaseDb();

        if (db && this.currentUser) {
            try {
                const scoresRef = collection(db, 'leaderboard');
                const q = query(
                    scoresRef,
                    orderBy('score', 'desc'),
                    limit(10)
                );

                const querySnapshot = await getDocs(q);
                const scores = querySnapshot.docs.map((doc, index) => ({
                    rank: index + 1,
                    name: doc.data().userId || 'Player',
                    score: doc.data().score || 0
                }));

                if (scores.length > 0) {
                    this.leaderboardCache = scores;
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            }
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.leaderboardCache;
    }

    /**
     * Submit score to leaderboard
     */
    public async submitScore(score: number): Promise<void> {
        const db = getFirebaseDb();

        if (db && this.currentUser) {
            try {
                const scoresRef = collection(db, 'leaderboard');
                await addDoc(scoresRef, {
                    game: 'bomber_legend',
                    score: score,
                    userId: this.currentUser.uid,
                    timestamp: Timestamp.now()
                });

                logAnalyticsEvent('high_score', {
                    game_name: 'bomber_legend',
                    score
                });
            } catch (error) {
                console.error('Failed to submit score:', error);
            }
        }

        // Update local cache
        if (this.userProfile) {
            this.leaderboardCache.push({
                rank: 6,
                name: this.userProfile.name,
                score: score
            });
            this.leaderboardCache.sort((a, b) => b.score - a.score);
            this.leaderboardCache = this.leaderboardCache.slice(0, 10);
            this.leaderboardCache.forEach((entry, index) => entry.rank = index + 1);
        }
    }
}
