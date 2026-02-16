import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Game } from '../../engine/Game';
import { Input } from '../../engine/Input';
import { BombComponent } from '../components/BombComponent';
import { ExplosionComponent } from '../components/ExplosionComponent';
import { PositionComponent } from '../components/PositionComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { GridComponent, TileType } from '../components/GridComponent';
import { Entity } from '../../engine/Entity';

export class BombSystem extends System {
    private input: Input;
    // private game: Game; // Unused for now

    constructor(world: World, game: Game) {
        super(world);
        // this.game = game;
        this.input = game.Input;
    }

    public update(dt: number) {
        this.handleInput();
        this.handleBombs(dt);
        this.handleExplosions(dt);
    }

    private handleInput() {
        if (this.input.isDown('Space')) { // Simple debounce needed or state check
            // console.log("Space pressed");
            // Ideally Input class handles "JustPressed", but for now we can check if player has cooldown?
            // Actually, let's use a "JustPressed" logic or simple flag on player if we can't modify Input easily right now.
            // The Input class has buffer, but `isDown` is continuous. 

            // Let's implement a simple debounce for Space here or verify if Input has `getBufferedInput` logic we can misuse or extend.
            // Input.ts has `getBufferedInput`. Let's assume we mapped Space there or use a local flag.
            // For now, let's just stick to "Are we allowed to drop?" logic on the player

            const players = this.world.getEntitiesWith(PlayerComponent, PositionComponent);
            // console.log("Players found:", players.length);
            players.forEach(entity => {
                const player = entity.getComponent(PlayerComponent)!;
                const pos = entity.getComponent(PositionComponent)!;

                // Check max bombs
                if (player.bombsActive < player.maxBombs) {
                    // Check if key was just pressed (poor man's debounce: check if we placed one very recently? 
                    // No, better to add a cooldown or "canDrop" flag to Input. 
                    // Let's rely on a small cooldown in PlayerComponent or just check if the tile is empty.)

                    const grids = this.world.getEntitiesWith(GridComponent);
                    if (grids.length === 0) {
                        // console.log("No grid found");
                        return;
                    }
                    const grid = grids[0].getComponent(GridComponent)!;

                    const gx = Math.round(pos.x / grid.tileSize);
                    const gy = Math.round(pos.y / grid.tileSize);

                    // Check if tile is empty (no bomb already)
                    // Note: Actors move loosely, but bombs snap to grid.
                    // We need to check if ANY entity with BombComponent is at gx, gy.
                    const isBombAtLoc = this.world.getEntitiesWith(BombComponent, PositionComponent).some(b => {
                        const bPos = b.getComponent(PositionComponent)!;
                        return Math.round(bPos.x / grid.tileSize) === gx && Math.round(bPos.y / grid.tileSize) === gy;
                    });

                    // Also check if we lifted the key? 
                    // Since we don't have "JustPressed", we might spam bombs if we have >1 max bombs.
                    // Let's just place ONE if we aren't standing on one.

                    if (!isBombAtLoc) {
                        // Place Bomb
                        // console.log("Spawning bomb at", gx, gy);
                        this.spawnBomb(gx, gy, grid.tileSize, player.bombRange, entity);
                        player.bombsActive++;

                        // Crude input consumption: we can't consume 'Space' from here easily without modifying Input to support it. 
                        // We'll rely on the visual finding that we placed a bomb there preventing another placement.
                    } else {
                        // console.log("Bomb already at location");
                    }
                } else {
                    // console.log("Max bombs reached");
                }
            });
        }
    }

    private spawnBomb(gx: number, gy: number, tileSize: number, range: number, owner: Entity) {
        const bomb = this.world.createEntity();
        bomb.addComponent(new BombComponent(range, owner));
        bomb.addComponent(new PositionComponent(gx * tileSize, gy * tileSize)); // Snap to top-left of tile?
        // Actually render system draws circles centered if we adjust, but let's stick to Top-Left for PositionComponent convention
        // and let RenderSystem center it.
    }

    private handleBombs(dt: number) {
        const bombs = this.world.getEntitiesWith(BombComponent, PositionComponent);
        bombs.forEach(entity => {
            const bomb = entity.getComponent(BombComponent)!;
            bomb.timer -= dt;
            if (bomb.timer <= 0) {
                this.explode(entity);
            }
        });
    }

    private explode(bombEntity: Entity) {
        const bomb = bombEntity.getComponent(BombComponent)!;
        const pos = bombEntity.getComponent(PositionComponent)!;
        const grids = this.world.getEntitiesWith(GridComponent);
        if (grids.length === 0) return;
        const grid = grids[0].getComponent(GridComponent)!;

        // Decrease owner active count
        if (bomb.owner && bomb.owner.hasComponent(PlayerComponent)) {
            bomb.owner.getComponent(PlayerComponent)!.bombsActive--;
        }

        this.world.destroyEntity(bombEntity.id);

        // Create Center Explosion
        const gx = Math.round(pos.x / grid.tileSize);
        const gy = Math.round(pos.y / grid.tileSize);
        this.spawnExplosion(gx, gy, grid.tileSize);

        // Directions: [dx, dy]
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

        dirs.forEach(dir => {
            for (let i = 1; i <= bomb.range; i++) {
                const tx = gx + dir[0] * i;
                const ty = gy + dir[1] * i;

                const tile = grid.getTile(tx, ty);

                if (tile === TileType.Wall) {
                    break; // Hard block stops explosion
                }

                this.spawnExplosion(tx, ty, grid.tileSize); // Hit!

                if (tile === TileType.SoftBlock) {
                    // Destroy block
                    grid.setTile(tx, ty, TileType.Empty);
                    // TODO: Spawn Powerup?
                    break; // Soft block stops spread but is destroyed
                }

                // Check for other bombs to chain reaction?
                // (Advanced: Query bombs at tx,ty and trigger their explode 0.1s later)
            }
        });
    }

    private spawnExplosion(gx: number, gy: number, tileSize: number) {
        const exp = this.world.createEntity();
        exp.addComponent(new ExplosionComponent());
        exp.addComponent(new PositionComponent(gx * tileSize, gy * tileSize));
        // Add collision damage logic later (or duplicate Hitbox)
    }

    private handleExplosions(dt: number) {
        const explosions = this.world.getEntitiesWith(ExplosionComponent);
        explosions.forEach(entity => {
            const exp = entity.getComponent(ExplosionComponent)!;
            exp.timer -= dt;
            if (exp.timer <= 0) {
                this.world.destroyEntity(entity.id);
            }
        });
    }
}
