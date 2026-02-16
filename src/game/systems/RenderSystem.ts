import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Game } from '../../engine/Game';
import { GridComponent, TileType } from '../components/GridComponent';
import { PositionComponent } from '../components/PositionComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { AIComponent, AIBehavior } from '../components/AIComponent';
import { BombComponent } from '../components/BombComponent';
import { ExplosionComponent } from '../components/ExplosionComponent';

export class RenderSystem extends System {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private worldRef: World; // generic 'world' is protected in System, but type needs casting sometimes or explicit usage

    constructor(world: World, game: Game) {
        super(world);
        this.worldRef = world;
        this.ctx = game.Context;
        this.canvas = this.ctx.canvas;
    }

    public update(dt: number): void {
        // Clear screen
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render Grid
        const grids = this.worldRef.getEntitiesWith(GridComponent);
        grids.forEach(entity => {
            const grid = entity.getComponent(GridComponent)!;
            this.drawGrid(grid);
        });

        // Loop components for size
        const gridEntity = grids[0];
        const gridSize = gridEntity ? gridEntity.getComponent(GridComponent)!.tileSize : 32;

        // Render Bombs
        const bombs = this.worldRef.getEntitiesWith(BombComponent, PositionComponent);
        bombs.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            const bomb = entity.getComponent(BombComponent)!;
            this.drawBomb(pos, gridSize, bomb);
        });

        // Render Explosions
        const explosions = this.worldRef.getEntitiesWith(ExplosionComponent, PositionComponent);
        explosions.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            this.drawExplosion(pos, gridSize);
        });

        // Render Players
        const players = this.worldRef.getEntitiesWith(PlayerComponent, PositionComponent);
        players.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            this.drawPlayer(pos, gridSize);
        });

        // Render Enemies
        const enemies = this.worldRef.getEntitiesWith(AIComponent, PositionComponent);
        enemies.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            const ai = entity.getComponent(AIComponent)!;
            this.drawEnemy(pos, gridSize, ai);
        });

        // Debug FPS
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`FPS: ${Math.round(1 / dt)}`, 10, 20);
    }

    private drawBomb(pos: PositionComponent, size: number, bomb: BombComponent) {
        const px = pos.x;
        const py = pos.y;

        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 2;

        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(px + size / 2, py + size / 2, size * 0.4 + pulse, 0, Math.PI * 2);
        this.ctx.fill();

        // Fuse
        this.ctx.fillStyle = 'red'; // Spark
        this.ctx.fillRect(px + size / 2 - 2, py + size / 2 - size * 0.5, 4, 6);
    }

    private drawExplosion(pos: PositionComponent, size: number) {
        const px = pos.x;
        const py = pos.y;

        this.ctx.fillStyle = '#ffaa00'; // Fire core
        this.ctx.fillRect(px, py, size, size);

        this.ctx.fillStyle = '#ff4400'; // Outer flame
        this.ctx.fillRect(px + 4, py + 4, size - 8, size - 8);

        this.ctx.fillStyle = '#ffffeba'; // White hot center
        this.ctx.fillRect(px + 10, py + 10, size - 20, size - 20);
    }

    private drawGrid(grid: GridComponent) {
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const tile = grid.getTile(x, y);
                const px = x * grid.tileSize;
                const py = y * grid.tileSize;

                if (tile === TileType.Wall) {
                    this.ctx.fillStyle = '#666'; // Grey concrete
                    this.ctx.fillRect(px, py, grid.tileSize, grid.tileSize);
                    // 3D effect highlight
                    this.ctx.fillStyle = '#888';
                    this.ctx.fillRect(px, py, grid.tileSize, 4);
                    this.ctx.fillRect(px, py, 4, grid.tileSize);
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(px + grid.tileSize - 4, py, 4, grid.tileSize);
                    this.ctx.fillRect(px, py + grid.tileSize - 4, grid.tileSize, 4);
                } else if (tile === TileType.SoftBlock) {
                    this.ctx.fillStyle = '#D2691E'; // Brick color
                    this.ctx.fillRect(px + 1, py + 1, grid.tileSize - 2, grid.tileSize - 2);
                    // Brick pattern details
                    this.ctx.fillStyle = '#A0522D';
                    this.ctx.fillRect(px + 4, py + 10, grid.tileSize - 8, 2);
                    this.ctx.fillRect(px + 4, py + 20, grid.tileSize - 8, 2);
                } else {
                    // Floor
                    this.ctx.fillStyle = '#2d2d2d';
                    this.ctx.fillRect(px, py, grid.tileSize, grid.tileSize);
                    // Grid lines
                    this.ctx.strokeStyle = '#333';
                    this.ctx.strokeRect(px, py, grid.tileSize, grid.tileSize);
                }
            }
        }
    }

    private drawEnemy(pos: PositionComponent, size: number, ai: AIComponent) {
        const px = pos.x * size; // pos is usually in pixels properly, wait. 
        // My MovementSystem treats pos as pixels. 
        // My previous drawPlayer logic: `const playerPx = pos.x * size;` -> This assumes pos.x is in GRID UNITS.
        // BUT MovementSystem: `const nextX = pos.x + vel.dx * dt;` -> vel is px/sec. So pos.x is PIXELS.
        // ERROR IN RENDER LOGIC DETECTED.

        // I need to correct both drawPlayer and drawEnemy to treat pos as PIXELS.

        // Let's fix drawPlayer logic here too implicitly by rewriting the methods correct assumption.
        // Actually, let's fix the assumption.
        // If pos is pixels, then:
        const px2 = pos.x;
        const py2 = pos.y;

        // Draw Enemy
        this.ctx.fillStyle = ai.behavior === AIBehavior.Chase ? '#ff4444' : '#ffaa00'; // Red for chase, Orange for wander

        // Simple blob shape
        this.ctx.beginPath();
        this.ctx.arc(px2 + size / 2, py2 + size / 2, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();

        // Face
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(px2 + size * 0.35, py2 + size * 0.4, size * 0.1, 0, Math.PI * 2);
        this.ctx.arc(px2 + size * 0.65, py2 + size * 0.4, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawPlayer(pos: PositionComponent, size: number) {
        // Correcting assumption: pos is in PIXELS
        const playerPx = pos.x;
        const playerPy = pos.y;

        this.ctx.fillStyle = 'white';
        // Draw Bomber Head
        this.ctx.beginPath();
        this.ctx.arc(playerPx + size * 0.5, playerPy + size * 0.3, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        // Draw Body
        this.ctx.fillRect(playerPx + size * 0.15, playerPy + size * 0.6, size * 0.7, size * 0.3);
        // Draw Face details
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(playerPx + size * 0.3, playerPy + size * 0.25, size * 0.1, size * 0.1);
        this.ctx.fillRect(playerPx + size * 0.6, playerPy + size * 0.25, size * 0.1, size * 0.1);
    }
}
