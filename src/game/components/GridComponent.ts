import { Component } from '../../engine/Component';

export enum TileType {
    Empty = 0,
    Wall = 1,
    SoftBlock = 2,
    Bomb = 3 // Temporary visual state, though bombs will be entities
}

export class GridComponent extends Component {
    public width: number;
    public height: number;
    public tileSize: number;
    public tiles: TileType[];

    constructor(width: number, height: number, tileSize: number = 40) {
        super();
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = new Array(width * height).fill(TileType.Empty);
        this.generateClassicMap();
    }

    // Classic checkerboard pattern
    private generateClassicMap() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Border Walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    this.setTile(x, y, TileType.Wall);
                    continue;
                }

                // Fixed Walls (Checkerboard)
                if (x % 2 === 0 && y % 2 === 0) {
                    this.setTile(x, y, TileType.Wall);
                    continue;
                }

                // Soft Blocks (Randomly placed, but keep start area clear)
                // Start area: (1,1), (1,2), (2,1)
                if ((x > 2 || y > 2) && Math.random() < 0.3) {
                    this.setTile(x, y, TileType.SoftBlock);
                }
            }
        }
    }

    public getTile(x: number, y: number): TileType {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return TileType.Wall;
        return this.tiles[y * this.width + x];
    }

    public setTile(x: number, y: number, type: TileType) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y * this.width + x] = type;
        }
    }
}
