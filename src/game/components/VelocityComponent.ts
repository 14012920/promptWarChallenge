import { Component } from '../../engine/Component';

export class VelocityComponent extends Component {
    constructor(public dx: number = 0, public dy: number = 0) {
        super();
    }
}
