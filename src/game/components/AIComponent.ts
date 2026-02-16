import { Component } from '../../engine/Component';

export enum AIBehavior {
    Wander = 0,
    Chase = 1,
    Flee = 2
}

export class AIComponent extends Component {
    public behavior: AIBehavior;
    public targetX: number = -1;
    public targetY: number = -1;
    public reactionTime: number = 1.0; // Seconds between decisions
    public timer: number = 0;
    public attackCooldown: number = 0; // New

    constructor(behavior: AIBehavior) {
        super();
        this.behavior = behavior;
        this.timer = Math.random() * this.reactionTime;
    }
}
