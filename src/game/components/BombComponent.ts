import { Component } from '../../engine/Component';
import { Entity } from '../../engine/Entity';

export class BombComponent extends Component {
    public timer: number = 3.0; // Seconds until explosion
    public range: number = 2;
    public owner: Entity | null = null; // Who placed it (for score/kill credit)

    constructor(range: number = 2, owner: Entity | null = null) {
        super();
        this.range = range;
        this.owner = owner;
    }
}
