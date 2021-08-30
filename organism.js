// WARNING: INDEXING IS REALLY WEIRD RN. I NEED TO NORMALIZE HOW I/X AND J/Y WORKS. - KV

/* Default Parameters */
params.fillTo = 0;
params.cellSize = 3;
params.geneAmount = 1;
params.partitionSize = 2;
params.mutationChance = 0.1;
params.geneDimensions = params.partitionSize * 5;

/** Different Functions to initialize a Gene's cells */
const initializers = {
    /**
     * Template for function initializing gene cells
     * @param {Number} i Row Index
     * @param {Number} j Column Index
     * @param {Gene} gene The gene's state
     * @returns 0|1
     */
    template: (i, j, gene) => undefined,
    blank: () => 0,
    fill: () => 1,
    random: () => getRandomInteger(0, 1),
    fillToPartition: (p, i, j) =>
        i < params.partitionSize * p && j < params.partitionSize * p
            ? 1 : 0,
    randomToPartition: (p, i, j) =>
        i < params.partitionSize * p && j < params.partitionSize * p
            ? getRandomInteger(0,1) : 0,
};
initializers.default = (i, j) =>
    initializers.fillToPartition(params.fillTo, i, j);

/** Different Functions to recombine two Genes' cells */
const recomboers = {
    /**
     * Template for function combining genes.
     * @param {0|1} a First Gene's State
     * @param {0|1} b Second Gene's State
     * @param {Number} i Row Index
     * @param {Number} j Column Index
     * @param {Gene} gene The gene's state
     * @returns 0|1
     */
    template: (a, b, i, j, gene) => undefined,
    OR: (a, b) => ceil((a + b) / 2),
    XOR: (a, b) => (a + b) % 2,
    AND: (a, b) => (a + b) == 2 ? 1 : 0,
};
recomboers.default = recomboers.OR;

/** Different Functions to mutate a Gene's cells */
const mutators = {
    /**
     * Template for function mutating gene cells
     * @param {0|1} currentState Current Cell's State
     * @param {Number} i Row Index
     * @param {Number} j Column Index
     * @param {Gene} gene The gene's state
     * @returns 0|1
     */
    template: (currentState, i, j, gene) => undefined,
    flip: (currentState) =>
        Math.random() <= params.mutationChance
            ? (currentState + 1) % 2
            : currentState
};
mutators.default = mutators.flip;

/** Representation of an organism's specific gene */
class Gene {
    constructor(options = null) {
        if (options) {
            if (options.cells) {
                this.cells = options.cells;
            } else if (options.init_function) {
                this.initializeCells(options.init_function);
            } else {
                throw "Invalid Options!";
            }
        } else {
            this.initializeCells();
        }
        this.updateInfo();
    }

    clone() { return new Gene({cells: this.cells}); }

    updateInfo() {
        this.generatePartitions();
        this.generateLevels();
    }

    initializeCells(initializer = initializers.default) {
        const dimensions = params.geneDimensions;
        this.cells = [];

        for (let i = 0; i < dimensions; i++) {
            this.cells[i] = [];
            for (let j = 0; j < dimensions; j++) {
                this.cells[i][j] = initializer(i, j, this);
            }
        }
    }

    // Very rough idea of partitions (shapes) which are represented with Integer Representation
    generatePartitions() {
        const partitionAmount = params.geneDimensions / params.partitionSize;
        this.partitions = [];

        for (let i = 0; i < partitionAmount; i++) {
            this.partitions[i] = [];
            for (let j = 0; j < partitionAmount; j++) {
                this.partitions[i][j] = this.getPartition(i, j);
            }
        }
    }

    getPartition(i, j) {
        let partition = 0;
        const startX = params.partitionSize * i;
        const startY = params.partitionSize * j;
        const partitionSize = params.partitionSize;

        for (let x = startX; x < startX + partitionSize; x++) {
            for (let y = startY; y < startY + partitionSize; y++) {
                partition += this.cells[x][y] == 1 ? pow(2,
                    pow(partitionSize, 2) - 1
                        - ((x-startX) * partitionSize + (y-startY)))
                    : 0;
            }
        }
        return partition;
    }

    generateLevels() {
        const levelAmount = round(params.geneDimensions /
                                  params.partitionSize);
        const filledAmount = pow(2, pow(params.partitionSize, 2)) - 1;
        this.levels = []

        for (let level = 0; level < levelAmount; level++) {
            this.levels[level] = 1;
            const checkFill = (i, j) =>
                this.levels[level] = this.partitions[i][j] !== filledAmount
                    ? 0 : this.levels[level];

            let i, j;
            j = level;
            for (i = 0; i <= level; i++) checkFill(i, j);

            i = level;
            for (j = 0; i <= level; i++) checkFill(i, j);
        }
    }

    recombine(otherGene, recomboer = recomboers.default) {
        const newCells = [];
        for (let i = 0; i < this.cells.length; i++) {
            newCells[i] = [];
            for (let j = 0; j < this.cells.length; j++) {
                newCells[i][j] = recomboer(this.cells[i][j],
                                           otherGene.cells[i][j],
                                           i, j, this)
            }
        }

        return new Gene({cells: newCells});
    }

    getLevel() {
        let level = -1;
        while (this.levels[++level] === 1);
        return level;
    }

    mutate(mutator = mutators.default) {
        const level = this.getLevel();
        const partitionSize = params.partitionSize;
        const indexStart = partitionSize * level;

        // NOTE: Currently only mutates on the current level
        for (let i = 0; i < indexStart + partitionSize; i++)
            for (let j = indexStart; j < indexStart + partitionSize; j++)
                this.cells[i][j] = mutator(this.cells[i][j], i, j, this);

        for (let i = indexStart; i < indexStart + partitionSize; i++)
            for (let j = 0; j < indexStart + partitionSize; j++)
                this.cells[i][j] = mutator(this.cells[i][j], i, j, this);

        this.updateInfo();
    }

    toString() {
        return this.cells.map(row => row.join(" ")).join("\n");
    }
}

class Organism {
    constructor(options = null) {
        if (options) {
            if (options.genes) {
                this.genes = options.genes
            } else {
                throw "Invalid Options!";
            }
        } else {
            this.randomizeGenes();
        }
    }

    clone() { return new Organism({genes: this.genes}); }

    randomizeGenes() {
        this.genes = [];
        for (let i = 0; i < params.geneAmount; i++) {
            this.genes[i] = new Gene();
        }
    }

    attachGameEngine(gameEngine, x, y) {
        Object.assign(this, {gameEngine, x, y})
    }

    draw(ctx) {
        const cellSize = params.cellSize;
        const partitionSize = params.partitionSize;

        const gene = this.genes[0];
        const cells = gene.cells;
        const colors = ["red", "green", "blue"];

        // Fill the grid up specially with levels in mind
        const x = this.x + cellSize;
        const y = this.y + cellSize;
        for (let level = 0; level < cells.length / partitionSize; level++) {
            const indexStart = partitionSize * level;
            const fill = (i, j) => {
                ctx.fillStyle = cells[i][j] == 1
                    ? colors[level % colors.length]
                    : "white";
                ctx.fillRect(cellSize * j + x, cellSize * i + y, cellSize, cellSize);
            }

            for (let i = 0; i < indexStart + partitionSize; i++)
                for (let j = indexStart; j < indexStart + partitionSize; j++)
                    fill(i, j);

            for (let i = indexStart; i < indexStart + partitionSize; i++)
                for (let j = 0; j < indexStart + partitionSize; j++)
                    fill(i, j);
        }

        // Outline for box for clarity
        ctx.lineWidth = cellSize;
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x+cellSize/2, this.y+cellSize/2,
                       cellSize * cells.length + cellSize,
                       cellSize * cells.length + cellSize);
    }

    update() {
    }

    reproduce(otherOrganism) {
        const otherGenes = otherOrganism.genes;
        if (this.genes.length !== otherGenes.length) return console.log("Incompatible!");

        const newGenes = []

        for (let i = 0; i < this.genes.length; i++) {
            newGenes[i] = this.genes[i].recombine(otherGenes[i]);
        }

        return new Organism({genes: newGenes});
    }

    toString() {
        return this.genes.map(gene => gene.toString()).join("\n");
    }
}

// Good ol' Testing
const testOrganism = new Organism();
console.log(testOrganism.toString(), "\n");
console.log(testOrganism.genes[0].partitions);
console.log(testOrganism.genes[0].levels);