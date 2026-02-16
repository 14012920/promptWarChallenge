import { System } from '../../engine/System';
import { World } from '../../engine/World';
import { Game } from '../../engine/Game';
import { AIComponent, AIBehavior } from '../components/AIComponent';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { GridComponent, TileType } from '../components/GridComponent';
import { PlayerComponent } from '../components/PlayerComponent';

export class AISystem extends System {
    private dangerMap: number[] = []; // Simple heat map (0 = safe, 100 = death)

    constructor(world: World, game: Game) {
        super(world);
    }

    public update(dt: number) {
        const grids = this.world.getEntitiesWith(GridComponent);
        if (grids.length === 0) return;
        const grid = grids[0].getComponent(GridComponent)!;

        // 1. Update Influence Map (every frame? or throttled?)
        // For now, let's just do simple neighbor checks in the behavior loop

        // 2. Update Agents
        const agents = this.world.getEntitiesWith(AIComponent, PositionComponent, VelocityComponent);
        const players = this.world.getEntitiesWith(PlayerComponent, PositionComponent);
        const playerPos = players.length > 0 ? players[0].getComponent(PositionComponent) : null;

        agents.forEach(entity => {
            const ai = entity.getComponent(AIComponent)!;
            const pos = entity.getComponent(PositionComponent)!;
            const vel = entity.getComponent(VelocityComponent)!;

            ai.timer -= dt;
            if (ai.timer <= 0) {
                ai.timer = ai.reactionTime; // Reset timer
                this.makeDecision(ai, pos, vel, grid, playerPos);
            }
        });
    }

    private makeDecision(ai: AIComponent, pos: PositionComponent, vel: VelocityComponent, grid: GridComponent, playerPos: PositionComponent | undefined | null) {
        // Snap to grid for decision making
        const gx = Math.round(pos.x / grid.tileSize);
        const gy = Math.round(pos.y / grid.tileSize);

        if (ai.behavior === AIBehavior.Wander) {
            // Pick a random valid neighbor
            const neighbors = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];

            const validMoves = neighbors.filter(n => {
                const tile = grid.getTile(gx + n.dx, gy + n.dy);
                return tile === TileType.Empty;
            });

            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                vel.dx = move.dx * 50; // Slow speed
                vel.dy = move.dy * 50;
            } else {
                vel.dx = 0;
                vel.dy = 0;
            }
        } else if (ai.behavior === AIBehavior.Chase && playerPos) {
            // Simple chase
            const dx = playerPos.x - pos.x;
            const dy = playerPos.y - pos.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                vel.dx = Math.sign(dx) * 70;
                vel.dy = 0;
            } else {
                vel.dx = 0;
                vel.dy = Math.sign(dy) * 70;
            }
        }
    }
}
