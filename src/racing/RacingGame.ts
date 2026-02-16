// Performance constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TARGET_FPS = 60;
const MAX_DELTA_TIME = 0.1; // Cap delta time to prevent spiral of death

interface Point { x: number; y: number; z: number; screen: { x: number; y: number; w: number; scale: number; }; camera?: { x: number; y: number; z: number; }; }
interface Segment { index: number; p1: Point; p2: Point; curve: number; color: { road: string; grass: string; rumble: string; }; }
interface Car { offset: number; z: number; speed: number; sprite: string; }

export class RacingGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private animationId: number = 0;
    private running: boolean = false;
    private onExit: () => void;

    // Performance tracking
    private lastTime: number = 0;
    private accumulator: number = 0;

    // Road Params
    private segments: Segment[] = [];
    private segmentLength: number = 200; // Length of a segment
    private rumbleLength: number = 3; // Segments per rumble color
    private roadWidth: number = 2000; // Logical road width
    private drawDistance: number = 300; // Number of segments to draw
    private fieldOfView: number = 100;
    private cameraHeight: number = 1000;
    private cameraDepth: number; // calculated

    // Player Params
    private playerX: number = 0; // -1 (left) to 1 (right)
    private playerZ: number = 0; // Distance down road
    private speed: number = 0;
    private maxSpeed: number = 12000; // Max speed
    private accel: number = 100; // Acceleration
    private breaking: number = -300; // Deceleration
    private decel: number = -50; // Friction
    private offRoadDecel: number = -200;
    private offRoadLimit: number = 10000; // Max speed offroad

    // Input States
    private keyLeft: boolean = false;
    private keyRight: boolean = false;
    private keyUp: boolean = false;
    private keyDown: boolean = false;
    private keyTurbo: boolean = false;
    // Lap & Game State
    private lap: number = 1;
    private totalLaps: number = 3;
    private lapStartTime: number = 0;
    private lastLapTime: number = 0;

    // Powerups
    private boostActive: number = 0; // timer

    // HUD Elements
    private elSpeed: HTMLElement | null;
    private elPos: HTMLElement | null;
    private elTime: HTMLElement | null;

    private cars: Car[] = [];
    private totalCars: number = 20; // Total cars in race

    constructor(canvasId: string, onExit: () => void) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.onExit = onExit;

        this.elSpeed = document.getElementById('speed-val');
        this.elPos = document.getElementById('pos-val');
        this.elTime = document.getElementById('lap-time');

        this.cameraDepth = 1 / Math.tan((this.fieldOfView / 2) * Math.PI / 180);

        this.resetRoad();

        // Resize listener
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Exit Button
        const btnExit = document.getElementById('btn-back-menu-racing');
        if (btnExit) {
            btnExit.addEventListener('click', () => {
                this.stop();
                this.onExit();
            });
        }

        // Input Listeners
        window.addEventListener('keydown', (e) => this.input(e, true));
        window.addEventListener('keyup', (e) => this.input(e, false));

        this.lapStartTime = Date.now();
    }

    private input(e: KeyboardEvent, state: boolean) {
        if (!this.running) return;
        switch (e.code) {
            case 'ArrowLeft': case 'KeyA': this.keyLeft = state; break;
            case 'ArrowRight': case 'KeyD': this.keyRight = state; break;
            case 'ArrowUp': case 'KeyW': this.keyUp = state; break;
            case 'ArrowDown': case 'KeyS': this.keyDown = state; break;
            case 'ShiftLeft': this.keyTurbo = state; break;
        }
    }

    private resize() {
        // Keep 4:3 aspect ratio - use constants for consistency
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        // Disable image smoothing for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
    }

    private resetRoad() {
        this.segments = [];
        const numSegments = 500; // Length of track
        for (let n = 0; n < numSegments; n++) {
            // Colors
            const floor = Math.floor(n / this.rumbleLength);
            const roadColor = (floor % 2 === 0) ? '#666' : '#696969';
            const grassColor = (floor % 2 === 0) ? '#103000' : '#204010';
            const rumbleColor = (floor % 2 === 0) ? '#fff' : '#c00';

            // Curve (Simple S-curve for testing)
            let curve = 0;
            if (n > 50 && n < 150) curve = 2;
            if (n > 200 && n < 300) curve = -2;

            this.segments.push({
                index: n,
                p1: { x: 0, y: 0, z: n * this.segmentLength, screen: { x: 0, y: 0, w: 0, scale: 0 } },
                p2: { x: 0, y: 0, z: (n + 1) * this.segmentLength, screen: { x: 0, y: 0, w: 0, scale: 0 } },
                curve: curve,
                color: { road: roadColor, grass: grassColor, rumble: rumbleColor }
            });
        }

        // Reset Cars
        this.cars = [];
        for (let n = 0; n < this.totalCars; n++) {
            const offset = Math.random() * 0.8 - 0.4; // Random lane
            const z = Math.random() * this.segments.length * this.segmentLength;
            const speed = this.maxSpeed * (0.5 + Math.random() * 0.3); // Varying speeds
            this.cars.push({ offset, z, speed, sprite: 'CAR' });
        }
    }

    public start() {
        if (this.running) return;
        this.running = true;
        this.loop();
    }

    public stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
    }

    private update(dt: number) {
        // const playerSegment = this.findSegment(this.playerZ); // Unused for now
        const speedPercent = this.speed / this.maxSpeed;
        const dx = dt * 2 * speedPercent; // lateral speed multiplier

        // Position Updates
        this.playerZ += dt * this.speed;

        // Handle Input
        if (this.keyLeft) this.playerX -= dx;
        if (this.keyRight) this.playerX += dx;

        // Turbo / Physics / Acceleration
        if (this.keyTurbo) {
            // Manual boost if cheat/testing? Or just unused.
            // Let's use it to start game if not running?
        }

        if (this.keyUp) this.speed += this.accel;
        else if (this.keyDown) this.speed += this.breaking;
        else this.speed += this.decel;

        // Offroad slowdown
        if ((this.playerX < -1 || this.playerX > 1) && this.speed > this.offRoadLimit) {
            this.speed += this.offRoadDecel;
        }

        // Constraints
        this.playerX = Math.max(-2, Math.min(2, this.playerX)); // Limits
        this.speed = Math.max(0, Math.min(this.maxSpeed, this.speed));

        // Lap Logic
        const trackLength = this.segments.length * this.segmentLength;
        if (this.playerZ >= trackLength) {
            this.playerZ -= trackLength;
            this.lap++;
            this.lastLapTime = (Date.now() - this.lapStartTime) / 1000;
            this.lapStartTime = Date.now(); // Reset lap time
            if (this.lap > this.totalLaps) {
                // Game Over / Win
                this.speed = 0; // Stop for now
                // Maybe show finish screen?
            }
        }
        if (this.playerZ < 0) this.playerZ += trackLength;

        // Speed Boost Logic
        if (this.boostActive > 0) {
            this.boostActive -= dt;
            this.speed += 200 * dt; // Add extra speed
            if (this.speed > this.maxSpeed + 5000) this.speed = this.maxSpeed + 5000;
        }

        // Update AI Cars
        this.cars.forEach(car => {
            car.z += car.speed * dt;
            if (car.z >= this.segments.length * this.segmentLength) {
                car.z -= this.segments.length * this.segmentLength;
            }
            // Simple AI: Avoid running off road, maybe steer around curves?
            // For now, just constant lane.

            // Collision Check with Player
            // Player Z is relative to track loop. 
            // We need to check if car is close to playerZ and playerX overlaps car.offset

            // Simplest check: relative distance
            if (this.overlap(this.playerX, 2, car.offset, 0.5, 0.8)) {
                // Check Z distance?
                // This is tricky in looped track.
                // Let's do it in render loop or segment check?
                // Better: check if player and car are in same segment (or close)
            }
        });

        // Player Collision (Simplified vs segments)
        const playerSeg = this.findSegment(this.playerZ);
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const carSeg = this.findSegment(car.z);
            if (playerSeg.index === carSeg.index) {
                // Check X overlap
                if (this.speed > car.speed) {
                    if (this.overlap(this.playerX, 0.8, car.offset, 0.8)) {
                        this.speed = Math.max(this.speed, car.speed * 0.5); // Crash slows down
                        this.playerZ = car.z - 100; // Bump back
                    }
                }
            }
        }

        // HUD Updates
        if (this.elSpeed) this.elSpeed.textContent = Math.floor(this.speed / 100).toString();

        if (this.elPos) this.elPos.textContent = `${this.getPlace()}/${this.totalCars + 1}`;

        if (this.elTime) {
            const currentLapTime = (Date.now() - this.lapStartTime) / 1000;
            // Show current lap time, and maybe last lap time if available
            const last = this.lastLapTime > 0 ? ` (Last: ${this.lastLapTime.toFixed(2)})` : '';
            this.elTime.textContent = currentLapTime.toFixed(2) + last;
        }
    }

    private overlap(x1: number, w1: number, x2: number, w2: number, percent: number = 1): boolean {
        const half = percent / 2;
        const min1 = x1 - w1 * half;
        const max1 = x1 + w1 * half;
        const min2 = x2 - w2 * half;
        const max2 = x2 + w2 * half;
        return !((max1 < min2) || (min1 > max2));
    }

    private findSegment(z: number): Segment {
        if (this.segments.length === 0) return { index: 0, p1: { x: 0, y: 0, z: 0, screen: { x: 0, y: 0, w: 0, scale: 0 } }, p2: { x: 0, y: 0, z: 0, screen: { x: 0, y: 0, w: 0, scale: 0 } }, curve: 0, color: { road: '#000', grass: '#000', rumble: '#000' } };
        return this.segments[Math.floor(z / this.segmentLength) % this.segments.length];
    }

    private getPlace(): number {
        // Calculate position based on Z + Laps
        let place = 1;

        for (const car of this.cars) {
            // Simplistic: AI cars are on same lap? 
            if (car.z > this.playerZ) place++;
        }
        return place;
    }

    private render() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear screen with a solid color to effectively "erase" previous frame
        this.ctx.fillStyle = '#000044'; // Night/Dusk Background
        this.ctx.fillRect(0, 0, width, height);

        // Sun/Moon?
        this.ctx.fillStyle = '#ff0';
        this.ctx.beginPath();
        this.ctx.arc(width - 100, 100, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // Road Rendering
        const baseSegment = this.findSegment(this.playerZ);
        const basePercent = (this.playerZ % this.segmentLength) / this.segmentLength;
        // const playerSegmentIndex = baseSegment.index; // Not used

        let dx = -(baseSegment.curve * basePercent);
        let x = 0;
        let maxY = height; // Clip bottom

        const trackLength = this.segments.length * this.segmentLength;

        for (let n = 0; n < this.drawDistance; n++) {
            const segment = this.segments[(baseSegment.index + n) % this.segments.length];
            const looped = segment.index < baseSegment.index;
            // const cameraZ = this.playersZ - (looped ? trackLength : 0); // fix loop z // Typo: this.playersZ should be this.playerZ

            // Projection P1
            // We need to handle the looping Z coordinate properly for projection.
            // Simplified:
            // P1 position relative to camera
            const p1z = (looped ? trackLength : 0) + segment.p1.z - this.playerZ;
            const p2z = (looped ? trackLength : 0) + segment.p2.z - this.playerZ;

            if (p1z < 1) continue; // Behind camera

            // Offset X for curves
            // Accumulate curve offset
            x += dx;
            dx += segment.curve;

            const p1 = segment.p1;
            const p2 = segment.p2;

            // Camera offsets
            const cameraX = this.playerX * this.roadWidth;
            const cameraY = this.cameraHeight;

            // Project P1
            const scale1 = this.cameraDepth / p1z;
            const screenX1 = Math.round((width / 2) + (scale1 * (p1.x - cameraX - x) * width / 2));
            const screenY1 = Math.round((height / 2) - (scale1 * (p1.y - cameraY) * height / 2));
            const screenW1 = Math.round((scale1 * this.roadWidth * width / 2));

            // Project P2
            const scale2 = this.cameraDepth / p2z;
            const screenX2 = Math.round((width / 2) + (scale2 * (p2.x - cameraX - x - dx) * width / 2));
            const screenY2 = Math.round((height / 2) - (scale2 * (p2.y - cameraY) * height / 2));
            const screenW2 = Math.round((scale2 * this.roadWidth * width / 2));

            if (screenY2 >= maxY) continue; // Clipped
            maxY = screenY2;

            // Draw Segment
            this.drawSegment(screenX1, screenY1, screenW1, screenX2, screenY2, screenW2, segment.color);

            // Render Cars in this segment
            // We need to iterate cars and find which ones are in this segment index
            for (let i = 0; i < this.cars.length; i++) {
                const car = this.cars[i];
                const carSeg = this.findSegment(car.z);
                if (carSeg.index === segment.index) {
                    // Calculate Car Screen Position
                    // Interpolate based on how far into segment car is?
                    // For simplicity, just use segment P1 projection
                    // const carPercent = (car.z % this.segmentLength) / this.segmentLength; // Unused
                    // Actually logic needs to project car strictly.
                    // Approximate: use same projection scale as segment P1

                    const spriteScale = scale1; // from segment render loop
                    const spriteX = Math.round((width / 2) + (scale1 * (car.offset - cameraX - x) * width / 2));
                    const spriteY = screenY1; // Ground level

                    this.drawCar(spriteX, spriteY, spriteScale, car);
                }
            }
        }

        // Draw Player Car
        this.drawPlayer(width, height);
    }

    private drawSegment(x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, color: { road: string, grass: string, rumble: string }) {
        // Grass
        this.ctx.fillStyle = color.grass;
        this.ctx.fillRect(0, y2, this.canvas.width, y1 - y2);

        // Rumble
        const r1 = w1 / 10;
        const r2 = w2 / 10;
        this.ctx.fillStyle = color.rumble;
        this.ctx.beginPath();
        this.ctx.moveTo(x1 - w1 - r1, y1);
        this.ctx.lineTo(x1 - w1, y1);
        this.ctx.lineTo(x2 - w2, y2);
        this.ctx.lineTo(x2 - w2 - r2, y2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(x1 + w1 + r1, y1);
        this.ctx.lineTo(x1 + w1, y1);
        this.ctx.lineTo(x2 + w2, y2);
        this.ctx.lineTo(x2 + w2 + r2, y2);
        this.ctx.fill();

        // Road
        this.ctx.fillStyle = color.road;
        this.ctx.beginPath();
        this.ctx.moveTo(x1 - w1, y1);
        this.ctx.lineTo(x1 + w1, y1);
        this.ctx.lineTo(x2 + w2, y2);
        this.ctx.lineTo(x2 - w2, y2);
        this.ctx.fill();
    }

    private drawPlayer(width: number, height: number) {
        // Simple pixel art car
        const carW = 80;
        const carH = 40;
        const carX = (width / 2) - (carW / 2);
        const carY = height - carH - 20;

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(carX + 10, carY + 30, carW - 20, 10);

        // Body
        this.ctx.fillStyle = '#d00';
        this.ctx.fillRect(carX, carY + 10, carW, 20); // Chassis
        this.ctx.fillStyle = '#f00';
        this.ctx.fillRect(carX + 10, carY, carW - 20, 15); // Roof/Cabin

        // Lights
        this.ctx.fillStyle = '#ff0';
        this.ctx.fillRect(carX + 5, carY + 15, 10, 5);
        this.ctx.fillRect(carX + carW - 15, carY + 15, 10, 5);

        // Tires
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(carX + 5, carY + 25, 15, 15);
        this.ctx.fillRect(carX + carW - 20, carY + 25, 15, 15);
    }

    private drawCar(x: number, y: number, scale: number, car: Car) {
        // Simple AI Car Sprite
        const w = 80 * scale * 1000; // Arbitrary scaling factor
        const h = 40 * scale * 1000;

        const drawX = x - w / 2;
        const drawY = y - h;

        // Use car param to avoid build error and add variety
        const hue = (car.offset + 1) * 180; // Different colors based on offset
        this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

        this.ctx.fillRect(drawX, drawY, w, h);

        // Taillights
        this.ctx.fillStyle = '#f00';
        this.ctx.fillRect(drawX + w * 0.1, drawY + h * 0.4, w * 0.2, h * 0.2);
        this.ctx.fillRect(drawX + w * 0.7, drawY + h * 0.4, w * 0.2, h * 0.2);
    }

    private loop(currentTime: number = 0) {
        if (!this.running) return;

        // Calculate delta time in seconds
        let deltaTime = this.lastTime === 0 ? 0 : (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap delta time to prevent spiral of death
        deltaTime = Math.min(deltaTime, MAX_DELTA_TIME);

        // Fixed timestep with accumulator for consistent physics
        const fixedDt = 1 / TARGET_FPS;
        this.accumulator += deltaTime;

        // Update physics in fixed steps
        while (this.accumulator >= fixedDt) {
            this.update(fixedDt);
            this.accumulator -= fixedDt;
        }

        // Render at display refresh rate
        this.render();

        this.animationId = requestAnimationFrame((time) => this.loop(time));
    }
}
