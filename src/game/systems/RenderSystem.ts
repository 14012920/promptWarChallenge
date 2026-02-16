import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Game } from '../../engine/Game';
import { GridComponent, TileType } from '../components/GridComponent';
import { PositionComponent } from '../components/PositionComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { AIComponent } from '../components/AIComponent';
import { BombComponent } from '../components/BombComponent';
import { ExplosionComponent } from '../components/ExplosionComponent';
import { ParticleComponent } from '../components/ParticleComponent';

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

    public update(_dt: number): void {
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

        // Render Particles
        const particles = this.worldRef.getEntitiesWith(ParticleComponent, PositionComponent);
        particles.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            const particle = entity.getComponent(ParticleComponent)!;
            this.drawParticle(pos, particle);
        });

        // Render Enemies
        const enemies = this.worldRef.getEntitiesWith(AIComponent, PositionComponent);
        enemies.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            const ai = entity.getComponent(AIComponent)!;
            this.drawEnemy(pos, gridSize, ai);
        });

        // Debug FPS
        // this.ctx.fillStyle = 'white';
        // this.ctx.font = '16px monospace';
        // this.ctx.fillText(`FPS: ${Math.round(1 / dt)}`, 10, 20);
    }

    private drawBomb(pos: PositionComponent, size: number, _bomb: BombComponent) {
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

    private drawEnemy(pos: PositionComponent, size: number, _ai: AIComponent) {
        const cx = pos.x + size / 2;
        const cy = pos.y + size / 2;
        const radius = size / 2 - 2;

        this.ctx.fillStyle = '#ff6b6b'; // Red-ish
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Face
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText("ò_ó", cx, cy);
    }

    private drawParticle(pos: PositionComponent, particle: ParticleComponent) {
        this.ctx.fillStyle = particle.color;

        // Fade out
        if (particle.fade) {
            this.ctx.globalAlpha = particle.lifetime / particle.maxLifetime;
        }

        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalAlpha = 1.0;
    }

    private drawPlayer(pos: PositionComponent, size: number) {
        const px = pos.x;
        const py = pos.y;
        const cx = px + size / 2;
        // const cy = py + size / 2; // Unused
        // const radius = size / 2;  // Unused

        // Tactical Soldier Look

        // 1. Body (Camo Vest)
        this.ctx.fillStyle = '#4b5320'; // Army Green
        this.ctx.fillRect(px + 8, py + 18, size - 16, 14);

        // 2. Head (Helmet)
        this.ctx.fillStyle = '#3d3d3d'; // Dark Helmet
        this.ctx.beginPath();
        this.ctx.arc(cx, py + 14, 10, Math.PI, 0); // Helmet Top
        this.ctx.lineTo(cx + 10, py + 18);
        this.ctx.lineTo(cx - 10, py + 18);
        this.ctx.fill();

        // 3. Face
        this.ctx.fillStyle = '#ffdbac'; // Skin
        this.ctx.fillRect(cx - 6, py + 18, 12, 8);

        // 4. Goggles / Tactical Visor
        this.ctx.fillStyle = '#33ccff';
        this.ctx.fillRect(cx - 5, py + 20, 10, 4);

        // 5. Arms
        this.ctx.fillStyle = '#ffdbac';
        this.ctx.fillRect(px + 2, py + 20, 6, 10); // Left Arm
        this.ctx.fillRect(px + size - 8, py + 20, 6, 10); // Right Arm

        // 6. Legs (Camo Pants)
        this.ctx.fillStyle = '#3b4218'; // Darker Green
        this.ctx.fillRect(px + 10, py + 32, 5, 8); // Left Leg
        this.ctx.fillRect(px + size - 15, py + 32, 5, 8); // Right Leg
    }
}
