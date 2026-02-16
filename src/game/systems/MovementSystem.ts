import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Entity } from '../../engine/Entity';
import { Game } from '../../engine/Game';
import { Input } from '../../engine/Input';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { GridComponent, TileType } from '../components/GridComponent';

export class MovementSystem extends System {
    private input: Input;

    constructor(world: World, game: Game) {
        super(world);
        this.input = game.Input;
    }

    public update(dt: number) {
        // 1. Handle Input for Players
        const players = this.world.getEntitiesWith(PlayerComponent, VelocityComponent);
        players.forEach((entity: Entity) => {
            const vel = entity.getComponent(VelocityComponent)!;
            const player = entity.getComponent(PlayerComponent)!;

            vel.dx = 0;
            vel.dy = 0;

            if (this.input.isDown('ArrowUp') || this.input.isDown('KeyW')) vel.dy = -player.speed;
            if (this.input.isDown('ArrowDown') || this.input.isDown('KeyS')) vel.dy = player.speed;
            if (this.input.isDown('ArrowLeft') || this.input.isDown('KeyA')) vel.dx = -player.speed;
            if (this.input.isDown('ArrowRight') || this.input.isDown('KeyD')) vel.dx = player.speed;
        });

        // 2. Apply Physics to ALL Movable Entities (Players + Enemies)
        const movables = this.world.getEntitiesWith(PositionComponent, VelocityComponent);
        const grids = this.world.getEntitiesWith(GridComponent);
        const gridEntity = grids[0];
        const grid = gridEntity ? gridEntity.getComponent(GridComponent) : null;

        movables.forEach((entity: Entity) => {
            const pos = entity.getComponent(PositionComponent)!;
            const vel = entity.getComponent(VelocityComponent)!;

            // Skip if no velocity
            if (vel.dx === 0 && vel.dy === 0) return;

            // Apply Movement (X axis)
            const nextX = pos.x + vel.dx * dt;
            if (!grid || !this.checkCollision(nextX, pos.y, grid)) {
                pos.x = nextX;
            } else {
                // Determine direction for simple slide assist or just stop
                // For now, just stop
            }

            // Apply Movement (Y axis)
            const nextY = pos.y + vel.dy * dt;
            if (!grid || !this.checkCollision(pos.x, nextY, grid)) {
                pos.y = nextY;
            } else {
                // Stop
            }
        });
    }

    private checkCollision(x: number, y: number, grid: GridComponent): boolean {
        // Player defines a hitbox, assume size < tileSize (e.g. 30px size for 40px tile)
        // Snap logic (optional, for perfect alignment)
        // const offset = (grid.tileSize - size) / 2; // Center player in tile visual

        // Check 4 corners of the hitbox
        // Box is [x, y, x+size, y+size]

        // Convert corners to grid coordinates
        const size = 30;
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
