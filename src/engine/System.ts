import { World } from './World';

export abstract class System {
    protected world: World;

    constructor(world: World) {
        this.world = world;
    }

    public abstract update(dt: number): void;
}
