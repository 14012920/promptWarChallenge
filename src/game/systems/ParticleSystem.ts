import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Entity } from '../../engine/Entity';
import { Game } from '../../engine/Game';
import { ParticleComponent } from '../components/ParticleComponent';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';

export class ParticleSystem extends System {
    // private ctx: CanvasRenderingContext2D;

    constructor(world: World, _game: Game) {
        super(world);
        // this.ctx = game.Context;
    }

    public update(dt: number) {
        const particles = this.world.getEntitiesWith(ParticleComponent, PositionComponent, VelocityComponent);

        particles.forEach((entity: Entity) => {
            const particle = entity.getComponent(ParticleComponent)!;
            const pos = entity.getComponent(PositionComponent)!;
            const vel = entity.getComponent(VelocityComponent)!;

            // Update Physics
            pos.x += vel.dx * dt;
            pos.y += vel.dy * dt;

            // Update Lifetime
            particle.lifetime -= dt;

            if (particle.lifetime <= 0) {
                this.world.destroyEntity(entity.id);
            } else {
                // Render (Directly here for performance, or move to RenderSystem)
                // Let's render here to keep RenderSystem clean of millions of particles? 
                // Or better: RenderSystem handles all rendering. 
                // Actually, for ECS purity, RenderSystem should render. 
                // But for performance in JS, sometimes batching in a specialized system is okay.
                // Let's stick to RenderSystem handling rendering to avoid context state bleeding.
            }
        });
    }
}
