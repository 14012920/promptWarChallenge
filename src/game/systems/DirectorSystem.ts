import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Game } from '../../engine/Game';

export class DirectorSystem extends System {
    private timer: number = 0;
    private intensity: number = 0; // 0 to 1

    constructor(world: World, _game: Game) {
        super(world);
    }

    public update(dt: number) {
        this.timer += dt;

        // Simple Director Logic: Increase intensity over time
        // In a real implementation, this would track player health, kill rate, etc.
        this.intensity = Math.min(1.0, this.timer / 300); // Max intensity after 5 minutes

        // Log director status occasionally
        if (Math.floor(this.timer) % 10 === 0 && Math.floor(this.timer - dt) % 10 !== 0) {
            console.log(`[Director] Intensity: ${this.intensity.toFixed(2)}`);
            // Spawn events could happen here
        }
    }
}
