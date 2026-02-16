import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Game } from '../../engine/Game';
import { Input } from '../../engine/Input';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { GridComponent, TileType } from '../components/GridComponent';

export class MovementSystem extends System {
    private input: Input;
    private game: Game;

    constructor(world: World, game: Game) {
        super(world);
        this.game = game;
        this.input = game.Input;
    }

    public update(dt: number) {
        const players = this.world.getEntitiesWith(PlayerComponent, PositionComponent, VelocityComponent);
        const grids = this.world.getEntitiesWith(GridComponent);
        const gridEntity = grids[0]; // Assume one grid for now
        const grid = gridEntity ? gridEntity.getComponent(GridComponent) : null;

        players.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            const vel = entity.getComponent(VelocityComponent)!;
            const player = entity.getComponent(PlayerComponent)!;

            // Input handling
            vel.dx = 0;
            vel.dy = 0;

            if (this.input.isDown('ArrowUp') || this.input.isDown('KeyW')) vel.dy = -player.speed;
            if (this.input.isDown('ArrowDown') || this.input.isDown('KeyS')) vel.dy = player.speed;
            if (this.input.isDown('ArrowLeft') || this.input.isDown('KeyA')) vel.dx = -player.speed;
            if (this.input.isDown('ArrowRight') || this.input.isDown('KeyD')) vel.dx = player.speed;

            // Normalize diagonal speed? Classic bomberman usually doesn't allow diagonal or clamps it
            // For "Evolved", we can keep it or restrict to 4-way. 
            // Let's restrict to 4-way for precision.
            if (vel.dx !== 0 && vel.dy !== 0) {
                // Prioritize last pressed axis? Or just zero one. 
                // Simple approach: if moving Horizontal, ignore Vertical unless specialized input.
                // Actually, just let them move diagonally but collision will slide.
            }

            // Apply Movement (X axis)
            const nextX = pos.x + vel.dx * dt;
            if (!grid || !this.checkCollision(nextX, pos.y, grid)) {
                pos.x = nextX;
            } else {
                // Simple slide/snap could go here
                // If we hit a wall, we might want to align to grid
                pos.x = Math.round(pos.x); // Very basic snap
            }

            // Apply Movement (Y axis)
            const nextY = pos.y + vel.dy * dt;
            if (!grid || !this.checkCollision(pos.x, nextY, grid)) {
                pos.y = nextY;
            } else {
                pos.y = Math.round(pos.y);
            }

            // Bounds check specific for canvas
            // (Optional if grid walls already cover bounds)
        });
    }

    private checkCollision(x: number, y: number, grid: GridComponent): boolean {
        // Player defines a hitbox, assume size < tileSize (e.g. 30px size for 40px tile)
        const size = 30;
        const offset = (grid.tileSize - size) / 2; // Center player in tile visual

        // Check 4 corners of the hitbox
        // Box is [x, y, x+size, y+size]

        // Convert corners to grid coordinates
        const left = Math.floor(x / grid.tileSize);
        const right = Math.floor((x + size) / grid.tileSize);
        const top = Math.floor(y / grid.tileSize);
        const bottom = Math.floor((y + size) / grid.tileSize);

        // Check if any corner is a wall/block
        const tl = grid.getTile(left, top);
        const tr = grid.getTile(right, top);
        const bl = grid.getTile(left, bottom);
        const br = grid.getTile(right, bottom);

        if (tl !== TileType.Empty && tl !== TileType.Bomb) return true;
        if (tr !== TileType.Empty && tr !== TileType.Bomb) return true;
        if (bl !== TileType.Empty && bl !== TileType.Bomb) return true;
        if (br !== TileType.Empty && br !== TileType.Bomb) return true;

        return false;
    }
}
