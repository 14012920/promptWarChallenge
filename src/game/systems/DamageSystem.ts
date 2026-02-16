import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Game } from '../../engine/Game';
import { PositionComponent } from '../components/PositionComponent';
import { ExplosionComponent } from '../components/ExplosionComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { AIComponent } from '../components/AIComponent';
import { GridComponent } from '../components/GridComponent';
import { Entity } from '../../engine/Entity';

export class DamageSystem extends System {
    private game: Game;

    constructor(world: World, game: Game) {
        super(world);
        this.game = game;
    }

    public update(_dt: number) {
        const explosions = this.world.getEntitiesWith(ExplosionComponent, PositionComponent);
        if (explosions.length === 0) return;

        const players = this.world.getEntitiesWith(PlayerComponent, PositionComponent);
        const enemies = this.world.getEntitiesWith(AIComponent, PositionComponent);

        // Simple grid-based collision. 
        // Explosions trigger on specific tiles. Actors are susceptible if they are on that tile.

        // We can assume grid component exists for tileSize
        const grids = this.world.getEntitiesWith(GridComponent);
        if (grids.length === 0) return;
        const grid = grids[0].getComponent(GridComponent)!;
        const tileSize = grid.tileSize;

        // Create a set of "danger tiles" for O(1) lookup? 
        // Or just loop N*M. N explosions is small usually.

        const dangerTiles = new Set<string>();
        explosions.forEach((exp: Entity) => { // Explicitly type 'exp' as Entity
            const pos = exp.getComponent(PositionComponent)!;
            const gx = Math.round(pos.x / tileSize);
            const gy = Math.round(pos.y / tileSize);
            dangerTiles.add(`${gx},${gy}`);
        });

        // Check Players
        players.forEach((entity: Entity) => { // Explicitly type 'entity' as Entity
            const pos = entity.getComponent(PositionComponent)!;
            // Hitbox center
            const cx = pos.x + tileSize / 2;
            const cy = pos.y + tileSize / 2;
            const gx = Math.floor(cx / tileSize);
            const gy = Math.floor(cy / tileSize);

            if (dangerTiles.has(`${gx},${gy}`)) {
                // Player Hit!
                this.game.triggerGameOver(false); // Lost
                this.world.destroyEntity(entity.id);
            }
        });

        // Check Enemies
        enemies.forEach((entity: Entity) => { // Explicitly type 'entity' as Entity
            const pos = entity.getComponent(PositionComponent)!;
            const cx = pos.x + tileSize / 2;
            const cy = pos.y + tileSize / 2;
            const gx = Math.floor(cx / tileSize);
            const gy = Math.floor(cy / tileSize);

            if (dangerTiles.has(`${gx},${gy}`)) {
                // Enemy Hit!
                this.game.addScore(100); // +100 Points for kill
                this.world.destroyEntity(entity.id);
            }
        });
    }
}
