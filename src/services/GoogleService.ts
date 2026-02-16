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

export class GoogleService {
    private static instance: GoogleService;
    private user: UserProfile | null = null;
    private leaderboard: LeaderboardEntry[] = [
        { rank: 1, name: "BomberPro", score: 5000 },
        { rank: 2, name: "BlastMaster", score: 4200 },
        { rank: 3, name: "ExplosionKing", score: 3800 },
        { rank: 4, name: "TNT_Lover", score: 3100 },
        { rank: 5, name: "FuseRunner", score: 2500 }
    ];

    private constructor() { }

    public static getInstance(): GoogleService {
        if (!GoogleService.instance) {
            GoogleService.instance = new GoogleService();
        }
        return GoogleService.instance;
    }

    public async login(): Promise<UserProfile> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock User
        this.user = {
            id: "g_123456789",
            name: "PlayerOne",
            avatarUrl: "https://via.placeholder.com/32"
        };
        return this.user;
    }

    public isLoggedIn(): boolean {
        return this.user !== null;
    }

    public getUser(): UserProfile | null {
        return this.user;
    }

    public async getLeaderboard(): Promise<LeaderboardEntry[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.leaderboard;
    }

    public async submitScore(score: number): Promise<void> {
        if (!this.user) return;

        console.log(`Submitting score ${score} to Google Play Games Services...`);
        // Mock Update
        this.leaderboard.push({
            rank: 6, // meaningful logic omitted
            name: this.user.name,
            score: score
        });
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);
        // Re-rank
        this.leaderboard.forEach((entry, index) => entry.rank = index + 1);
    }
}
