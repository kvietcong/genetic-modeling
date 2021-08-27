function getRandomInteger(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

const PARTITION_SIZE = 3
const DEFAULT_GENE_AMOUNT = 1
const DEFAULT_GENE_DIMENSION = PARTITION_SIZE * 3

class Gene {
    constructor(startDimension = DEFAULT_GENE_DIMENSION,
                isRandom = true,
                start = [[]]) {
        this.grid = start;
        if (isRandom) this.randomizeGrid(startDimension);
    }

    randomizeGrid(startDimension) {
        this.grid = [];
        for (let i = 0; i < startDimension; i++) {
            this.grid[i] = [];
            for (let j = 0; j < startDimension; j++) {
                this.grid[i][j] = getRandomInteger(0, 1);
            }
        }
    }

    combine(otherGene) {
        let newGrid = [];
        for (let i = 0; i < this.grid.length; i++) {
            newGrid[i] = [];
            for (let j = 0; j < this.grid.length; j++) {
                newGrid[i][j] = (this.grid[i][j] + otherGene.grid[i][j]) % 2;
            }
        }
        return new Gene(this.grid.length, false, newGrid);
    }

    toString() {
        return this.grid.map(row => row.join(" ")).join("\n");
    }
}

class Organism {
    constructor(geneAmount = DEFAULT_GENE_AMOUNT,
                geneDimensions = DEFAULT_GENE_DIMENSION,
                isRandom = true,
                genes = []) {
        this.genes = genes;
        if (isRandom) this.randomizeGenes(geneAmount, geneDimensions);
    }

    randomizeGenes(geneAmount, geneDimensions) {
        this.genes = [];
        for (let i = 0; i < geneAmount; i++) {
            this.genes[i] = new Gene(geneDimensions);
        }
    }

    draw(context) {
        console.log("Drawing");
    }

    reproduce(otherOrganism) {
        console.log("Evolving");
        let otherGenes = otherOrganism.genes;
        if (this.genes.length !== otherOrganism.length) return console.log("Incompatible!");

        let newGenes = []

        for (let i = 0; i < this.genes.length; i++) {
            newGenes[i] = this.genes[i].combine(otherGenes[i]);
        }

        return offspring = new Organism(this.genes.length, this.genes[0].length, false, newGenes);
    }

    toString() {
        return this.genes.map(gene => gene.toString()).join("\n\n");
    }
}

let testOrganism1 = new Organism(1);
let testOrganism2 = new Organism(1);
console.log(testOrganism1.toString(), "\n");
console.log(testOrganism2.toString(), "\n");
console.log(testOrganism1.reproduce(testOrganism2));
