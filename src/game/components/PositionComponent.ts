import { Component } from '../../engine/Component';

export class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}
