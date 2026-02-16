import { describe, it, expect, beforeEach } from 'vitest';
import { RacingGame } from './RacingGame';

describe('RacingGame', () => {
    let game: RacingGame;
    let mockCanvas: HTMLCanvasElement;
    let mockOnExit: () => void;

    beforeEach(() => {
        // Create mock canvas
        mockCanvas = document.createElement('canvas');
        mockCanvas.id = 'testCanvas';
        document.body.appendChild(mockCanvas);

        // Create mock HUD elements
        const speedEl = document.createElement('div');
        speedEl.id = 'speed-val';
        document.body.appendChild(speedEl);

        const posEl = document.createElement('div');
        posEl.id = 'pos-val';
        document.body.appendChild(posEl);

        const timeEl = document.createElement('div');
        timeEl.id = 'lap-time';
        document.body.appendChild(timeEl);

        mockOnExit = () => { };
        game = new RacingGame('testCanvas', mockOnExit);
    });

    describe('Initialization', () => {
        it('should create a racing game instance', () => {
            expect(game).toBeDefined();
        });

        it('should initialize with correct default values', () => {
            // Access private fields via type assertion for testing
            const gameAny = game as any;
            expect(gameAny.speed).toBe(0);
            expect(gameAny.playerX).toBe(0);
            expect(gameAny.playerZ).toBe(0);
            expect(gameAny.lap).toBe(1);
        });

        it('should create road segments', () => {
            const gameAny = game as any;
            expect(gameAny.segments).toBeDefined();
            expect(gameAny.segments.length).toBeGreaterThan(0);
        });

        it('should create AI cars', () => {
            const gameAny = game as any;
            expect(gameAny.cars).toBeDefined();
            expect(gameAny.cars.length).toBe(20);
        });
    });

    describe('Game Loop', () => {
        it('should start the game', () => {
            game.start();
            const gameAny = game as any;
            expect(gameAny.running).toBe(true);
        });

        it('should stop the game', () => {
            game.start();
            game.stop();
            const gameAny = game as any;
            expect(gameAny.running).toBe(false);
        });

        it('should not start if already running', () => {
            game.start();
            const firstAnimationId = (game as any).animationId;
            game.start();
            const secondAnimationId = (game as any).animationId;
            expect(firstAnimationId).toBe(secondAnimationId);
            game.stop();
        });
    });

    describe('Physics', () => {
        it('should update player position based on speed', () => {
            const gameAny = game as any;
            const initialZ = gameAny.playerZ;
            gameAny.speed = 1000;
            gameAny.update(1 / 60);
            expect(gameAny.playerZ).toBeGreaterThan(initialZ);
        });

        it('should clamp player X position', () => {
            const gameAny = game as any;
            gameAny.playerX = 10; // Way beyond limit
            gameAny.update(1 / 60);
            expect(gameAny.playerX).toBeLessThanOrEqual(2);
            expect(gameAny.playerX).toBeGreaterThanOrEqual(-2);
        });

        it('should clamp speed to max speed', () => {
            const gameAny = game as any;
            gameAny.speed = 999999; // Way beyond max
            gameAny.update(1 / 60);
            expect(gameAny.speed).toBeLessThanOrEqual(gameAny.maxSpeed);
        });

        it('should not allow negative speed', () => {
            const gameAny = game as any;
            gameAny.speed = -100;
            gameAny.update(1 / 60);
            expect(gameAny.speed).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Lap System', () => {
        it('should increment lap when completing track', () => {
            const gameAny = game as any;
            const trackLength = gameAny.segments.length * gameAny.segmentLength;
            gameAny.playerZ = trackLength - 10;
            gameAny.speed = 1000;

            // Update multiple times to cross finish line
            for (let i = 0; i < 10; i++) {
                gameAny.update(1 / 60);
            }

            expect(gameAny.lap).toBeGreaterThan(1);
        });

        it('should wrap player Z position on lap completion', () => {
            const gameAny = game as any;
            const trackLength = gameAny.segments.length * gameAny.segmentLength;
            gameAny.playerZ = trackLength + 100;
            gameAny.update(1 / 60);
            expect(gameAny.playerZ).toBeLessThan(trackLength);
        });
    });

    describe('Collision Detection', () => {
        it('should detect overlap between player and car', () => {
            const gameAny = game as any;
            const overlap = gameAny.overlap(0, 1, 0.5, 1, 1);
            expect(overlap).toBe(true);
        });

        it('should not detect overlap when objects are far apart', () => {
            const gameAny = game as any;
            const overlap = gameAny.overlap(0, 1, 5, 1, 1);
            expect(overlap).toBe(false);
        });
    });

    describe('Segment Finding', () => {
        it('should find correct segment for given Z position', () => {
            const gameAny = game as any;
            const segment = gameAny.findSegment(1000);
            expect(segment).toBeDefined();
            expect(segment.index).toBeGreaterThanOrEqual(0);
        });

        it('should handle Z position beyond track length', () => {
            const gameAny = game as any;
            const trackLength = gameAny.segments.length * gameAny.segmentLength;
            const segment = gameAny.findSegment(trackLength + 500);
            expect(segment).toBeDefined();
        });
    });

    describe('Player Ranking', () => {
        it('should calculate player position correctly', () => {
            const gameAny = game as any;
            gameAny.playerZ = 0;
            const place = gameAny.getPlace();
            expect(place).toBeGreaterThan(0);
            expect(place).toBeLessThanOrEqual(gameAny.totalCars + 1);
        });

        it('should be in first place when ahead of all cars', () => {
            const gameAny = game as any;
            const trackLength = gameAny.segments.length * gameAny.segmentLength;
            gameAny.playerZ = trackLength - 1;
            gameAny.cars.forEach((car: any) => car.z = 0);
            const place = gameAny.getPlace();
            expect(place).toBe(1);
        });
    });
});
