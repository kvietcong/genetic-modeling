params.stepsPerSecond = 60;

// This represents a "village"
class Village {
    constructor(x, y, grid) {

        this._grid = grid;
        this._pos = Object.freeze({ x, y });

        this.organisms = [];
        this.organismsToAdd = [];

        this.environment = 0;

        this.populateVillage();
    }

    populateVillage() {
        for (let i = 0; i < this.POPULATION; i++ ) {
            this.addOrganism(new Organism(this));
        }
    }

    addOrganism(organism) {
        this.organismsToAdd.push(organism);
    }

    removeOrganism(organism) { organism.removeFromWorld = true; }

    step() {
        // Organisms should only interact with those in their "village"
        this.organisms.forEach(organism => organism.step(this, this.grid));

        this.organisms.push(...this.organismsToAdd);
        this.organismsToAdd = [];

        this.organisms = this.organisms.filter(organism => !organism.removeFromWorld);
    }

    getTilesInRange(start, end) {
        return this._grid.getTilesInRageFrom(this, start, end);
    }

    get neighbors() {
        return this.getTilesInRange(this, 1, 1)
    }

    get x() { return this._pos.x; }
    get y() { return this._pos.y; }
    get grid() { return this._grid; }

    toString() { return `(${this.x}, ${this.y})`; }
}

// This represents the "villages"
class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.timeSinceLastStep = 0;
        this._tiles = [];               // list of villages

        // Indexing from top left
        for (let y = 0; y < width; y++) {
            this._tiles[y] = [];
            for (let x = 0; x < height; x++) {
                this._tiles[y][x] = new Village(x, y);
            }
        }
    }

    get tiles() { return this._tiles; }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error(`Tile out of bounds: ${x}, ${y}`);
        }
        return this.tiles[y]?.[x];
    }

    // Defaults to direct neighbors
    getTilesInRageFrom(tile, start = 1, end = 1) {
        const neighbors = [];
        for (let j = -end; j <= end; j++) {
            for (let i = -end; i <= end; i++) {
                if (abs(j) < start && abs(i) < start) continue;
                const n = this.getTile(tile.x + j, tile.y + i);
                if (n) neighbors.push(n);
            }
        }
        return neighbors;
    }

    getRandomTile() {
        const x = randomInt(this.width);
        const y = randomInt(this.height);
        return this.getTile(x, y);
    }

    getRandomNeighbor(tile) {
        return chooseRandom(this.getAllNeighbors(tile));
    }

    // Step will be a time independent function that advances the sim
    step() {
        for (const row of this.tiles) {
            for (const tile of row) {
                tile.step(this);
            }
        }
    }

    update(gameEngine) {
        const secondsPerStep = 1 / params.stepsPerSecond;
        this.timeSinceLastStep += gameEngine.deltaTime;

        while (this.timeSinceLastStep > secondsPerStep) {
            this.timeSinceLastStep -= secondsPerStep;
            this.step();
        }
    }

    // TODO
    // Draw the villages somehow (Maybe more opacity when more organisms?)
    draw(ctx) {
        const { width: ctxWidth, height: ctxHeight } = ctx.canvas;
        const size = min(ctxWidth, ctxHeight);
        const drawWidth = size / this.width;
        const drawHeight = size / this.height;

        for (let j = 0; j < this.width; j++) {
            for (let i = 0; i < this.height; i++) {
                const village = this.tiles[i][j];
                ctx.fillStyle = "red";
                ctx.fillRect(
                    drawWidth * j, drawHeight * i,
                    drawWidth, drawHeight);

                ctx.strokeStyle = "black";
                ctx.strokeRect(
                    drawWidth * j, drawHeight * i,
                    drawWidth, drawHeight);
            }
        }
    }

    toString() {
        return this.tiles.map(row =>
            row.map(tile => tile.toString()).join(" "))
            .join("\n");
    }
}