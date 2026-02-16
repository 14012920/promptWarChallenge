import { describe, it, expect } from 'vitest';
import { PositionComponent } from './PositionComponent';

describe('PositionComponent', () => {
    it('should initialize with given coordinates', () => {
        const pos = new PositionComponent(10, 20);
        expect(pos.x).toBe(10);
        expect(pos.y).toBe(20);
    });

    it('should initialize with default coordinates', () => {
        const pos = new PositionComponent();
        expect(pos.x).toBe(0);
        expect(pos.y).toBe(0);
    });
});
