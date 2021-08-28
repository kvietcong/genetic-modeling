function getRandomInteger(min, max) {
    return round(Math.random() * (max - min) + min);
}

const pow = Math.pow;
const ceil = Math.ceil;
const round = Math.round;

// WARNING: INDEXING IS REALLY WEIRD RN. I NEED TO NORMALIZE HOW I/X AND J/Y WORKS. - KV
const PARAMS = {
    CELL_SIZE: 3,
    GENE_AMOUNT: 1,
    PARTITION_SIZE: 2,
    MUTATION_CHANCE: 0.1,
    FILL_TO: 0
}
PARAMS.GENE_DIMENSIONS = PARAMS.PARTITION_SIZE * 5

const INIT_FUNCS = {
    BLANK: (i, j) => 0,
    FILL: (i, j) => 1,
    RANDOM: (i, j) => getRandomInteger(0, 1),
    FILL_TO_PARTITION: (p, i, j) =>
        i < PARAMS.PARTITION_SIZE * p && j < PARAMS.PARTITION_SIZE * p
            ? 1 : 0,
    RANDOM_TO_PARTITION: (p, i, j) =>
        i < PARAMS.PARTITION_SIZE * p && j < PARAMS.PARTITION_SIZE * p
            ? getRandomInteger(0,1) : 0,
}

class Gene {
    constructor(options = null) {
        if (options) {
            this.initializeCells((i,j) => options.cells[i][j]);
        } else {
            // this.initializeCells(INIT_FUNCS.BLANK); // Everything blank
            // this.initializeCells(INIT_FUNCS.RANDOM); // Random Everywhere
            // this.initializeCells((i,j) =>
            //     INIT_FUNCS.RANDOM_TO_PARTITION(1, i, j)); // Random certain Partition
            this.initializeCells((i,j) =>
                INIT_FUNCS.FILL_TO_PARTITION(PARAMS.FILL_TO, i, j)); // Fill certain Partition
        }
        this.mutate();
    }

    copy() {
        return new Gene({cells: this.cells});
    }

    initializeCells(f) {
        const dimensions = PARAMS.GENE_DIMENSIONS;
        this.cells = [];

        for (let i = 0; i < dimensions; i++) {
            this.cells[i] = [];
            for (let j = 0; j < dimensions; j++) {
                this.cells[i][j] = f(i,j);
            }
        }
        this.generatePartitions();
        this.generateLevels();
    }

    // Very rough idea of partitions (shapes) which are represented with binary
    generatePartitions() {
        const partitionAmount = PARAMS.GENE_DIMENSIONS / PARAMS.PARTITION_SIZE;
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
        const startX = PARAMS.PARTITION_SIZE * i;
        const startY = PARAMS.PARTITION_SIZE * j;
        const partitionSize = PARAMS.PARTITION_SIZE;

        for (let x = startX; x < startX + partitionSize; x++) {
            for (let y = startY; y < startY + partitionSize; y++) {
                partition += this.cells[x][y] == 1 ? pow(2,
                    pow(partitionSize, 2) - 1 - ((x-startX) * partitionSize + (y-startY)))
                    : 0;
            }
        }
        return partition;
    }

    generateLevels() {
        const levelAmount = round(PARAMS.GENE_DIMENSIONS / PARAMS.PARTITION_SIZE);
        const filledAmount = pow(2, pow(PARAMS.PARTITION_SIZE, 2)) - 1;
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

    recombine(otherGene) {
        const newCells = [];

        const OR = (a, b) => ceil((a + b) / 2);
        const XOR = (a, b) => (a + b) % 2;
        const AND = (a, b) => (a + b) == 2 ? 1 : 0;

        for (let i = 0; i < this.cells.length; i++) {
            newCells[i] = [];
            for (let j = 0; j < this.cells.length; j++) {
                newCells[i][j] = OR(this.cells[i][j], otherGene.cells[i][j])
            }
        }
        return new Gene({cells: newCells});
    }

    getLevel() {
        let level = -1;
        while (this.levels[++level] === 1);
        return level;
    }

    mutate() {
        const level = this.getLevel();
        const chance = PARAMS.MUTATION_CHANCE;
        const partitionSize = PARAMS.PARTITION_SIZE;
        const partitionStart = partitionSize * level;

        const mutateCell = (i, j) => this.cells[i][j] =
            Math.random() <= chance ? (this.cells[i][j] + 1) % 2 : this.cells[i][j]

        for (let i = 0; i < partitionStart + partitionSize; i++)
            for (let j = partitionStart; j < partitionStart + partitionSize; j++)
                mutateCell(i, j);

        for (let i = partitionStart; i < partitionStart + partitionSize; i++)
            for (let j = 0; j < partitionStart + partitionSize; j++)
                mutateCell(i, j);

        this.generatePartitions();
        this.generateLevels();
    }

    toString() {
        return this.cells.map(row => row.join(" ")).join("\n");
    }
}

class Organism {
    constructor(options = null) {
        if (options) {
            ({
                genes: this.genes
            } = options);
        } else {
            this.randomizeGenes();
        }
    }

    copy() {
        return new Organism({genes: this.genes});
    }

    randomizeGenes() {
        this.genes = [];
        for (let i = 0; i < PARAMS.GENE_AMOUNT; i++) {
            this.genes[i] = new Gene();
        }
    }

    attachGameEngine(gameEngine, x, y) {
        Object.assign(this, {gameEngine, x, y})
    }

    draw(ctx) {
        const size = PARAMS.CELL_SIZE;
        const partitionSize = PARAMS.PARTITION_SIZE;

        const gene = this.genes[0];
        const cells = gene.cells;
        const colors = ["red", "green", "blue"];

        // Fill the grid up specially with levels in mind
        const x = this.x + size;
        const y = this.y + size;
        for (let level = 0; level < cells.length / partitionSize; level++) {
            const partitionStart = partitionSize * level;
            const fill = (i, j) => {
                ctx.fillStyle = cells[i][j] == 1
                    ? colors[level % colors.length]
                    : "white";
                ctx.fillRect(size * j + x, size * i + y, size, size);
            }

            for (let i = 0; i < partitionStart + partitionSize; i++)
                for (let j = partitionStart; j < partitionStart + partitionSize; j++)
                    fill(i,j);

            for (let i = partitionStart; i < partitionStart + partitionSize; i++)
                for (let j = 0; j < partitionStart + partitionSize; j++)
                    fill(i,j);
        }

        // Outline for box for clarity
        ctx.lineWidth = size;
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x+size/2, this.y+size/2,
                       size * cells.length + size, size * cells.length + size);
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

const testOrganism1 = new Organism();
const testOrganism2 = new Organism();
console.log(testOrganism1.toString(), "\n");
/* console.log(testOrganism2.toString(), "\n");
console.log(testOrganism1.reproduce(testOrganism2).toString()); */
console.log(testOrganism1.genes[0].partitions);
console.log(testOrganism1.genes[0].levels);
