import { Component } from '../../engine/Component';

export class ExplosionComponent extends Component {
    public timer: number = 0.5; // Duration of flame
    public stage: number = 0; // Animation frame/stage

    constructor(duration: number = 0.5) {
        super();
        this.timer = duration;
    }
}
