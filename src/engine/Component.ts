export type ComponentType<T> = new (...args: any[]) => T;

export class Component {
    static typeId: number = 0;
    static get NextId() { return this.typeId++; }
}

export abstract class BaseComponent {
    // Marker interface
}
