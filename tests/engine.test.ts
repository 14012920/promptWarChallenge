import { expect, test, describe } from 'vitest'
import { World } from '../src/engine/World'
import { System } from '../src/engine/System'

class MockSystem extends System {
    public updateCount = 0;
    update(dt: number) {
        this.updateCount++;
    }
}

describe('ECS Engine', () => {
    test('World updates systems', () => {
        const world = new World();
        const system = new MockSystem(world);
        world.addSystem(system);

        world.update(0.16);
        expect(system.updateCount).toBe(1);
    })

    test('Entity creation and retrieval', () => {
        const world = new World();
        const entity = world.createEntity();
        expect(entity.id).toBe(0);
    })
})
