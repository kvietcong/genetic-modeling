function getRandomInteger(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

const PARAMS = {
    CELL_SIZE: 3,
    GENE_AMOUNT: 1,
    PARTITION_SIZE: 5
}
PARAMS.GENE_DIMENSIONS = PARAMS.PARTITION_SIZE * 5
// WARNING: INDEXING IS REALLY WEIRD RN. I NEED TO NORMALIZE HOW I/X AND J/Y WORKS. - KV

class Gene {
    constructor(options = null) {
        if (options) {
            ({
                cells: this.cells
            } = options);
        } else {
            // this.initializeCells((i,j) => 0); // Everything blank
            this.initializeCells((i,j) => {
                return i < PARAMS.PARTITION_SIZE && j < PARAMS.PARTITION_SIZE
                    ? getRandomInteger(0,1)
                    : 0;
            }); // Random first Partition
            this.initializeCells((i,j) => getRandomInteger(0,1)); // Random Everywhere
        }
    }

    copy() {
        return new Gene({cells: this.cells});
    }

    initializeCells(f) {
        let dimensions = PARAMS.GENE_DIMENSIONS;
        this.cells = [];

        for (let i = 0; i < dimensions; i++) {
            this.cells[i] = [];
            for (let j = 0; j < dimensions; j++) {
                this.cells[i][j] = f(i,j);
            }
        }

        this.generatePartitions();
    }

    // Very rough idea of partitions (shapes) which are represented with binary
    generatePartitions() {
        let partitionAmount = PARAMS.GENE_DIMENSIONS / PARAMS.PARTITION_SIZE;
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
        let startX = PARAMS.PARTITION_SIZE * i;
        let startY = PARAMS.PARTITION_SIZE * j;
        let partitionSize = PARAMS.PARTITION_SIZE;

        for (let x = startX; x < startX + partitionSize; x++) {
            for (let y = startY; y < startY + partitionSize; y++) {
                partition += this.cells[x][y] == 1 ? Math.pow(2,
                    Math.pow(partitionSize, 2) - 1 - ((x-startX) * partitionSize + (y-startY)))
                    : 0;
            }
        }
        return partition;
    }

    recombine(otherGene) {
        let newCells = [];

        const OR = (a, b) => Math.ceil((a + b) / 2);
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
        let size = PARAMS.CELL_SIZE;
        let partitionSize = PARAMS.PARTITION_SIZE;

        let gene = this.genes[0];
        let cells = gene.cells;
        let colors = ["red", "green", "blue"];

        // Fill the grid up specially with levels in mind
        let x = this.x + size;
        let y = this.y + size;
        for (let level = 0; level < cells.length / partitionSize; level++) {
            let partitionStart = partitionSize * level;
            const fill = (i, j, level) => {
                ctx.fillStyle = cells[i][j] == 1
                    ? colors[level % colors.length]
                    : "white";
                ctx.fillRect(size * j + x, size * i + y, size, size);
            }

            for (let i = 0; i < partitionStart + partitionSize; i++)
                for (let j = partitionStart; j < partitionStart + partitionSize; j++)
                    fill(i,j,level);

            for (let i = partitionStart; i < partitionStart + partitionSize; i++)
                for (let j = 0; j < partitionStart + partitionSize; j++)
                    fill(i,j,level);
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
        let otherGenes = otherOrganism.genes;
        if (this.genes.length !== otherGenes.length) return console.log("Incompatible!");

        let newGenes = []

        for (let i = 0; i < this.genes.length; i++) {
            newGenes[i] = this.genes[i].recombine(otherGenes[i]);
        }

        return new Organism({genes: newGenes});
    }

    toString() {
        return this.genes.map(gene => gene.toString()).join("\n");
    }
}

/* let testOrganism1 = new Organism();
let testOrganism2 = new Organism();
console.log(testOrganism1.toString(), "\n");
console.log(testOrganism2.toString(), "\n");
console.log(testOrganism1.reproduce(testOrganism2).toString());
console.log(testOrganism1.genes[0].partitions); */
