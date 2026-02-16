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

    constructor(behavior: AIBehavior = AIBehavior.Wander) {
        super();
        this.behavior = behavior;
    }
}
