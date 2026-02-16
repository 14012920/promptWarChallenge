import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Game } from '../../engine/Game';
import { ParticleComponent } from '../components/ParticleComponent';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';

// Efficiency: Particle pooling constants
const MAX_PARTICLES = 100;

export class ParticleSystem extends System {
    private particlesToRemove: number[] = [];

    constructor(world: World, _game: Game) {
        super(world);
    }

    public update(dt: number) {
        const particles = this.world.getEntitiesWith(ParticleComponent);

        // Clear removal queue
        this.particlesToRemove.length = 0;

        // Efficiency: Cap particles to prevent performance degradation
        if (particles.length > MAX_PARTICLES) {
            const toRemove = particles.length - MAX_PARTICLES;
            // Remove oldest particles first
            for (let i = 0; i < toRemove; i++) {
                this.particlesToRemove.push(particles[i].id);
            }
        }

        // Update active particles
        for (let i = 0; i < particles.length; i++) {
            const entity = particles[i];
            const particle = entity.getComponent(ParticleComponent);
            const pos = entity.getComponent(PositionComponent);
            const vel = entity.getComponent(VelocityComponent);

            if (!particle || !pos || !vel) continue;

            // Update Physics
            pos.x += vel.dx * dt;
            pos.y += vel.dy * dt;

            // Update Lifetime
            particle.lifetime -= dt;

            if (particle.lifetime <= 0) {
                this.particlesToRemove.push(entity.id);
            }
        }

        // Batch remove dead particles for efficiency
        if (this.particlesToRemove.length > 0) {
            for (const id of this.particlesToRemove) {
                this.world.destroyEntity(id);
            }
        }
    }
}
