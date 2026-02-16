import { Entity } from './Entity';
import { System } from './System';
import { ComponentType } from './Component';

export class World {
    private entities: Entity[] = [];
    private systems: System[] = [];
    private nextEntityId: number = 0;
    private entitiesToAdd: Entity[] = [];
    private entitiesToRemove: number[] = [];

    public createEntity(): Entity {
        const entity = new Entity(this.nextEntityId++);
        this.entitiesToAdd.push(entity);
        return entity;
    }

    public addSystem(system: System) {
        this.systems.push(system);
    }

    public getEntitiesWith(...componentTypes: ComponentType<any>[]): Entity[] {
        return this.entities.filter(entity =>
            entity.active && componentTypes.every(type => entity.hasComponent(type))
        );
    }

    public update(dt: number) {
        // Add pending entities
        if (this.entitiesToAdd.length > 0) {
            this.entities.push(...this.entitiesToAdd);
            this.entitiesToAdd = [];
        }

        // Remove pending entities (simple splice for now, optimize later with swap/pop or set active=false)
        if (this.entitiesToRemove.length > 0) {
            this.entities = this.entities.filter(e => !this.entitiesToRemove.includes(e.id));
            this.entitiesToRemove = [];
        }

        // Update systems
        for (const system of this.systems) {
            system.update(dt);
        }
    }

    public destroyEntity(id: number) {
        this.entitiesToRemove.push(id);
    }
}
