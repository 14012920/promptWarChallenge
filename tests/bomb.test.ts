import { expect, test, describe } from 'vitest'
import { World } from '../src/engine/World'
import { Game } from '../src/engine/Game'
import { BombSystem } from '../src/game/systems/BombSystem'
import { GridComponent, TileType } from '../src/game/components/GridComponent'
import { PlayerComponent } from '../src/game/components/PlayerComponent'
import { PositionComponent } from '../src/game/components/PositionComponent'
import { BombComponent } from '../src/game/components/BombComponent'
import { ExplosionComponent } from '../src/game/components/ExplosionComponent'

// Mock Input
class MockInput {
    keys: Set<string> = new Set();
    isDown(key: string) { return this.keys.has(key); }
    // Helper to simulate key press
    press(key: string) { this.keys.add(key); }
    release(key: string) { this.keys.delete(key); }
}

const mockGame = {
    Input: new MockInput(),
    Context: { canvas: {} }
} as unknown as Game;

describe('Bomb System', () => {
    test('Spawns bomb on input', () => {
        const world = new World();
        const system = new BombSystem(world, mockGame);
        world.addSystem(system);

        // Setup Grid
        const gridEntity = world.createEntity();
        gridEntity.addComponent(new GridComponent(10, 10));

        // Setup Player
        const player = world.createEntity();
        player.addComponent(new PlayerComponent());
        player.addComponent(new PositionComponent(32, 32)); // (1,1)

        // Simulate Input
        (mockGame.Input as MockInput).press('Space');

        // Update
        system.update(0.1);

        // Check for Bomb
        const bombs = world.getEntitiesWith(BombComponent);
        expect(bombs.length).toBe(1);

        const bombComp = bombs[0].getComponent(BombComponent)!;
        expect(bombComp.owner).toBe(player);
    });

    test('Bomb explodes and destroys soft blocks', () => {
        const world = new World();
        const system = new BombSystem(world, mockGame);
        world.addSystem(system);

        // Setup Grid
        const gridEntity = world.createEntity();
        const grid = new GridComponent(10, 10);
        gridEntity.addComponent(grid);

        // Place SoftBlock at (2,1) - right of (1,1)
        grid.setTile(2, 1, TileType.SoftBlock);
        expect(grid.getTile(2, 1)).toBe(TileType.SoftBlock);

        // Spawn Bomb manually at (1,1)
        const bomb = world.createEntity();
        bomb.addComponent(new BombComponent(2, null));
        bomb.addComponent(new PositionComponent(32, 32)); // (1,1)

        // Trigger Update with enough time to explode (>3s)
        // Or just manually set timer
        bomb.getComponent(BombComponent)!.timer = 0.01;

        system.update(0.1);

        // Assertions
        expect(world.getEntitiesWith(BombComponent).length).toBe(0); // Bomb gone
        expect(world.getEntitiesWith(ExplosionComponent).length).toBeGreaterThan(0); // Explosion exists

        // SoftBlock should be gone
        expect(grid.getTile(2, 1)).toBe(TileType.Empty);
    });
})
