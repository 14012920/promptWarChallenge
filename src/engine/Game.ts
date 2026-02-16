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

export class Game {
    private world: World;
    private input: Input;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D; // exposed via getter
    private lastTime: number = 0;
    private animationId: number = 0;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.world = new World();
        this.input = new Input();

        // Resize canvas to fit window or fixed size?
        // Plan said 800x600 but fully responsive is better for PWA "Evolution".
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Systems
        this.world.addSystem(new DirectorSystem(this.world, this));
        this.world.addSystem(new AISystem(this.world, this));
        this.world.addSystem(new BombSystem(this.world, this));
        this.world.addSystem(new MovementSystem(this.world, this));
        this.world.addSystem(new RenderSystem(this.world, this));

        // Initialize Level
        const gridEntity = this.world.createEntity();
        gridEntity.addComponent(new GridComponent(15, 13)); // Standard Bomberman size

        // Initialize Player
        const player = this.world.createEntity();
        player.addComponent(new PlayerComponent());
        player.addComponent(new PositionComponent(40, 40)); // Start at (1,1) -> 40,40
        player.addComponent(new VelocityComponent());

        // Initialize Enemy (Balloon)
        const enemy = this.world.createEntity();
        enemy.addComponent(new AIComponent(AIBehavior.Wander));
        enemy.addComponent(new PositionComponent(520, 440)); // Far corner
        enemy.addComponent(new VelocityComponent());
    }

    private resize() {
        // Keep 4:3 aspect ratio or fill? Let's fill for now or keep a fixed game resolution scaled up.
        // For pixel art, integer scaling is best.
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    public get World() { return this.world; }
    public get Input() { return this.input; }
    public get Context() { return this.ctx; }

    public start() {
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    private loop(timestamp: number) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.world.update(dt);

        this.animationId = requestAnimationFrame((t) => this.loop(t));
    }

    public stop() {
        cancelAnimationFrame(this.animationId);
    }
}
