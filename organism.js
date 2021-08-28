function getRandomInteger(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

const DEFAULT_PARTITION_SIZE = 2
const DEFAULT_GENE_AMOUNT = 1
const DEFAULT_GENE_DIMENSION = DEFAULT_PARTITION_SIZE * 2

class Gene {
    constructor(options = null) {
        if (options) {
            ({
                cells: this.cells
            } = options);
        } else {
            this.randomizeCells();
        }
    }

    copy() {
        return new Gene({cells: this.cells});
    }

    randomizeCells() {
        let dimensions = DEFAULT_GENE_DIMENSION;
        this.cells = [];

        for (let i = 0; i < dimensions; i++) {
            this.cells[i] = [];
            for (let j = 0; j < dimensions; j++) {
                this.cells[i][j] = getRandomInteger(0, 1);
            }
        }

        this.generatePartitions();
    }

    // Very rough idea of partitions (shapes) which are represented with binary
    generatePartitions() {
        let partitionAmount = DEFAULT_GENE_DIMENSION / DEFAULT_PARTITION_SIZE;
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
        let startX = DEFAULT_PARTITION_SIZE * i;
        let startY = DEFAULT_PARTITION_SIZE * j;
        let partitionSize = DEFAULT_PARTITION_SIZE;

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
        for (let i = 0; i < this.cells.length; i++) {
            newCells[i] = [];
            for (let j = 0; j < this.cells.length; j++) {
                newCells[i][j] = (this.cells[i][j] + otherGene.cells[i][j]) % 2;
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
        for (let i = 0; i < DEFAULT_GENE_AMOUNT; i++) {
            this.genes[i] = new Gene();
        }
    }

    draw(context) {
        console.log("Drawing");
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
        return this.genes.map(gene => gene.toString()).join("\n\n");
    }
}

let testOrganism1 = new Organism();
let testOrganism2 = new Organism();
console.log(testOrganism1.toString(), "\n");
console.log(testOrganism2.toString(), "\n");
console.log(testOrganism1.reproduce(testOrganism2).toString());
console.log(testOrganism1.genes[0].partitions);
