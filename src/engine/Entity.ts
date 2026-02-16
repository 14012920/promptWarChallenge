import { ComponentType } from './Component';

export class Entity {
    public id: number;
    public components: Map<string, any> = new Map();
    public active: boolean = true;

    constructor(id: number) {
        this.id = id;
    }

    public addComponent<T>(component: T): T {
        const typeName = (component as any).constructor.name;
        this.components.set(typeName, component);
        return component;
    }

    public getComponent<T>(type: ComponentType<T>): T | undefined {
        return this.components.get(type.name);
    }

    public hasComponent<T>(type: ComponentType<T>): boolean {
        return this.components.has(type.name);
    }

    public removeComponent<T>(type: ComponentType<T>) {
        this.components.delete(type.name);
    }
}
