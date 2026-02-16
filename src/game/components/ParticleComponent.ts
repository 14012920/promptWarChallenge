import { Component } from '../../engine/Component';

export class ParticleComponent extends Component {
    public lifetime: number;
    public maxLifetime: number;
    public color: string;
    public size: number;
    public fade: boolean;

    constructor(lifetime: number, color: string, size: number, fade: boolean = true) {
        super();
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.color = color;
        this.size = size;
        this.fade = fade;
    }
}
