export class Input {
    private keys: Set<string> = new Set();
    private lastInput: string | null = null;
    private inputBufferTime: number = 0;
    private maxBufferTime: number = 100; // ms to buffer input

    constructor() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    private onKeyDown(e: KeyboardEvent) {
        this.keys.add(e.code);
        this.lastInput = e.code;
        this.inputBufferTime = performance.now();
    }

    private onKeyUp(e: KeyboardEvent) {
        this.keys.delete(e.code);
    }

    public isDown(code: string): boolean {
        return this.keys.has(code);
    }

    public getBufferedInput(): string | null {
        if (performance.now() - this.inputBufferTime < this.maxBufferTime) {
            return this.lastInput;
        }
        return null;
    }

    public consumeBufferedInput() {
        this.lastInput = null;
    }
}
