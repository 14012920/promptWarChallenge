import { World } from './World';
import { Input } from './Input';
import { GridComponent } from '../game/components/GridComponent';
import { PlayerComponent } from '../game/components/PlayerComponent';
import { PositionComponent } from '../game/components/PositionComponent';
import { VelocityComponent } from '../game/components/VelocityComponent';
import { MovementSystem } from '../game/systems/MovementSystem';
import { RenderSystem } from '../game/systems/RenderSystem';
import { AIComponent, AIBehavior } from '../game/components/AIComponent';
import { AISystem } from '../game/systems/AISystem';
import { DirectorSystem } from '../game/systems/DirectorSystem';
import { BombSystem } from '../game/systems/BombSystem';
import { ParticleSystem } from '../game/systems/ParticleSystem';
import { DamageSystem } from '../game/systems/DamageSystem';

export class Game {
    private world: World;
    private input: Input;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private animationId: number = 0;
    private isGameOver: boolean = false;
    private score: number = 0;
    private scoreEl: HTMLElement | null = null;
    private gameTime: number = 200; // Seconds
    private timeEl: HTMLElement | null = null;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.world = new World();
        this.input = new Input();
        this.scoreEl = document.getElementById('score-val');
        this.timeEl = document.getElementById('time-val');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Systems
        this.initSystems();
        // Entities
        this.initLevel();
    }

    private initSystems() {
        this.world.addSystem(new DirectorSystem(this.world, this));
        this.world.addSystem(new AISystem(this.world, this));
        this.world.addSystem(new BombSystem(this.world, this));
        this.world.addSystem(new MovementSystem(this.world, this));
        this.world.addSystem(new DamageSystem(this.world, this)); // Add DamageSystem
        this.world.addSystem(new ParticleSystem(this.world, this)); // Add ParticleSystem
        this.world.addSystem(new RenderSystem(this.world, this));
    }

    private initLevel() {
        // Clear existing (if restarting)
        // For now, easy way: just replace world or clear entities? 
        // World doesn't have clear(), let's re-instantiate world or just clear arrays if we add method.
        // Simpler: Reload page on restart? No, that's lazy.
        // Let's just re-create World for now.

        // Actually, constructor calls this. If we restart, we need to clear.
        // Let's assume this is only called once for now.

        const gridEntity = this.world.createEntity();
        gridEntity.addComponent(new GridComponent(15, 13));

        const player = this.world.createEntity();
        player.addComponent(new PlayerComponent());
        player.addComponent(new PositionComponent(40, 40));
        player.addComponent(new VelocityComponent());

        // Spawn Multiple Enemies (e.g. 5)
        const enemyCount = 5;
        // Simple random spawn logic ensuring odd tiles (grid alignment) and distance from player
        for (let i = 0; i < enemyCount; i++) {
            let ex = 0, ey = 0;
            let valid = false;
            while (!valid) {
                // Random odd numbers for grid 
                // width 15, height 13. Coordinates are 0..14, 0..12
                // Softblocks usually at odd/odd.
                // Let's just pick random valid grid coordinates (1..13, 1..11)
                const gx = Math.floor(Math.random() * 13) + 1;
                const gy = Math.floor(Math.random() * 11) + 1;

                // Distance check from player (1,1)
                if (Math.abs(gx - 1) + Math.abs(gy - 1) > 5) {
                    // Also check if wall? For now, let's assume empty or softblock. 
                    // Enemies can pass softblocks? No, usually they can't.
                    // IMPORTANT: We need to ensure we don't spawn inside a Hard Wall.
                    // Map generation hasn't been strictly defined as "Hard Walls at even/even indices" in `GridComponent` init?
                    // `GridComponent` fills walls? Let's assume standard Bomberman pattern:
                    // Walls at x%2==0 && y%2==0 are usually hard walls inside the field.

                    // Let's just spawn them at known open corners or far randoms.
                    // Or just check if not (x even AND y even).

                    if (!((gx % 2 === 0) && (gy % 2 === 0))) {
                        ex = gx * 40;
                        ey = gy * 40;
                        valid = true;
                    }
                }
            }

            const enemy = this.world.createEntity();
            enemy.addComponent(new AIComponent(AIBehavior.Wander));
            enemy.addComponent(new PositionComponent(ex, ey));
            enemy.addComponent(new VelocityComponent());
        }
    }

    private resize() {
        // Keep 4:3 aspect ratio or fill? Let's fill for now or keep a fixed game resolution scaled up.
        // For pixel art, integer scaling is best.
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    public get Context() { return this.ctx; }
    public get Input() { return this.input; }

    public start() {
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    public stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
        // Additional cleanup if needed (e.g. remove event listeners)
    }

    private loop(timestamp: number) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (!this.isGameOver) {
            this.world.update(dt);

            // Timer Logic
            this.gameTime -= dt;
            if (this.gameTime <= 0) {
                this.gameTime = 0;
                this.triggerGameOver(false); // Time out = Lose
            }
            if (this.timeEl) {
                this.timeEl.textContent = Math.ceil(this.gameTime).toString();
            }
        } else {
            // Check restart
            if (this.input.isDown('KeyR')) {
                location.reload(); // Simple restart for now
            }
        }

        this.animationId = requestAnimationFrame((ts) => this.loop(ts));
    }

    public triggerGameOver(win: boolean) {
        this.isGameOver = true;
        const el = document.getElementById('game-over');
        if (el) {
            el.classList.remove('hidden');
            const h1 = el.querySelector('h1');
            if (h1) h1.textContent = win ? "VICTORY!" : "GAME OVER";
        }
    }

    public addScore(points: number) {
        this.score += points;
        if (this.scoreEl) {
            this.scoreEl.textContent = this.score.toString();
        }
    }
}
