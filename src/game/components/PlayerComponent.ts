import { Component } from '../../engine/Component';

export class PlayerComponent extends Component {
    public speed: number = 150; // pixels per second
    public maxBombs: number = 1;
    public bombRange: number = 2; // radius
    public bombsActive: number = 0;

    constructor() {
        super();
    }
}
