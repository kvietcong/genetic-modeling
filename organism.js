// WARNING:
// INDEXING IS REALLY WEIRD FOR DRAWING RN!
// I NEED TO NORMALIZE HOW I/X AND J/Y WORKS!
// - KV

// NOTE:
// I would recommend learning about passing functions in JS in order to
// understand this code. It also might be helpful to learn about anonymous
// and arrow functions.
// (Anonymous functions are basically Arrow functions with different syntax)
//
// If you have any questions on how a piece of this works or a better way to
// organize the code, please shoot a message on the Discord server.
// - KV

// WORKFLOW:
// There are two main classes. Organism and Gene. An Organism can contain
// multiple genes but at the moment, it only holds one. A Gene is the more
// developed part. This is where most of the action takes place.
//
// There are objects defined at the beginning of the file that contain a lot
// of functions. These functions are different ways to accomplish the task
// described in the variable name. The function assigned to the default place
// is the one used throughout the codebase. If you want to know what parameters
// these functions are passed, look at the `_` key.
//
// Sometimes, there are nested objects within these top level objects. These
// usually contain a template to help do more specific actions without repeating
// a bunch of code.
//
// There are also some useful functions in the `./util.js` file.

/* Default Parameters */
params.cellSize = 2;
params.geneAmount = 1;
params.fillToLevel = 0;
params.partitionSize = 2;
params.mutationChance = 0.1;
params.initialPartitions = 5;

/** Different sets of functions to change partition sizes */
const partitionTools = {
    constant: {
        indexToLevel: (index) => floor(index / params.partitionSize),
        levelToIndex: (level) => params.partitionSize * level,
        partitionSize: () => params.partitionSize,
    },
    quadratic: {
        indexToLevel: (index) => index === 0 ? 0 : floor(lg(index)) + 1,
        levelToIndex: (level) => level === 0 ? 0 : pow(2, level - 1),
        partitionSize: (level) => level < 2 ? 1 : pow(2, level - 1),
    },
};
partitionTools.default = partitionTools.quadratic;

/** Different functions to initialize a Gene's cells */
const initializers = {
    /**
     * @param {Gene} gene The gene's state
     */
    _: (gene) => undefined,
    blank: () => 0,
    fill: () => 1,
    random: () => getRandomInteger(0, 1),
};
initializers.perCell = {
    template: (gene, initializer, ...options) => {
        const dimensions =  partitionTools.default.levelToIndex(
            params.initialPartitions);
        gene.cells = [];

        for (let i = 0; i < dimensions; i++) {
            gene.cells[i] = [];
            for (let j = 0; j < dimensions; j++) {
                gene.cells[i][j] = initializer(...options, i, j);
            }
        }
    },
    fillToLevel: (l, i, j) =>
        [i, j].every(index => index < partitionTools.default.levelToIndex(l))
            ? 1 : 0,
    randomToLevel: (l, i, j) =>
        [i, j].every(index => index < partitionTools.default.levelToIndex(l))
            ? getRandomInteger(0,1) : 0,
};
initializers.default = (gene) =>
    initializers.perCell.template(gene,
                                  initializers.perCell.fillToLevel,
                                  params.fillToLevel);

/** Different functions to recombine two Genes' cells */
const recomboers = {
    /**
     * @param {Gene} gene The first gene's state
     * @param {Gene} otherGene The other gene's state
     * @returns New Gene
     */
    _: (gene, otherGene) => undefined,
};
/** Combine on a per cell basis */
recomboers.perCell = {
    template: (gene, otherGene, recomboer) => {
        const newCells = [];
        for (let i = 0; i < gene.cells.length; i++) {
            newCells[i] = [];
            for (let j = 0; j < gene.cells.length; j++) {
                newCells[i][j] = recomboer(gene.cells[i][j],
                                           otherGene.cells[i][j],
                                           i, j);
            }
        }
        return new Gene({cells: newCells});
    },
    XOR: (a, b) => (a + b) % 2,
    OR: (a, b) => ceil((a + b) / 2),
    AND: (a, b) => (a + b) == 2 ? 1 : 0,
    NAND: (a, b) => !recomboers.perCell.AND(a, b),
    NOR: (a, b) => !recomboers.perCell.OR(a, b),
};
recomboers.default = (gene, otherGene) =>
    recomboers.perCell.template(gene, otherGene, recomboers.perCell.OR);

/** Different functions to mutate a Gene's cells */
const mutators = {
    /** @param {Gene} gene The gene's state */
    _: (gene) => undefined,
};
/** Mutate Cells on the current level */
mutators.currentLevel = {
    template: (gene, mutator) => {
        const level = gene.level;
        const levelToIndex = partitionTools.default.levelToIndex;
        const indexStart = levelToIndex(level);
        const indexEnd = levelToIndex(level + 1);

        if (indexStart >= gene.cells.length) return console.log("FULL!")

        for (let i = 0; i < indexEnd; i++)
            for (let j = indexStart; j < indexEnd; j++)
                gene.cells[i][j] = mutator(gene.cells[i][j], i, j, gene);

        for (let i = indexStart; i < indexEnd; i++)
            for (let j = 0; j < indexEnd; j++)
                gene.cells[i][j] = mutator(gene.cells[i][j], i, j, gene);
    },
    flip: (currentState) =>
        Math.random() <= params.mutationChance
            ? (currentState + 1) % 2
            : currentState,
    rejuvenate: () => 1,
    destroy: () => 0,
}
mutators.default = (gene) =>
    mutators.currentLevel.template(gene, mutators.currentLevel.flip);


/** Representation of an organism's specific gene */
class Gene {
    constructor(options = null) {
        if (options) {
            if (options.cells) {
                this.cells = deepCopy(options.cells);
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

    clone() {
        return new Gene({cells: this.cells});
    }

    updateInfo() {
        this.generateLevels();
    }

    initializeCells(initializer = initializers.default) {
        initializer(this);
    }

    getPartition(i, j) {
        const partition = [];
        const partitionSize = partitionTools.default.partitionSize(max(i, j));
        let kStart, lStart;
        if (i > j) {
            kStart = partitionTools.default.levelToIndex(i);
            lStart = j * partitionSize;
        } else {
            kStart = i * partitionSize;
            lStart = partitionTools.default.levelToIndex(j);
        }
        const kEnd = kStart + partitionSize;
        const lEnd = lStart + partitionSize;

        let x = 0;
        for (let k = kStart; k < kEnd; k++) {
            partition[x] = [];
            let y = 0;
            for (let l = lStart; l < lEnd; l++) {
                partition[x][y] = this.cells[k][l];
                y++;
            }
            x++;
        }
        return partition;
    }

    generateLevels() {
        const indexToLevel = partitionTools.default.indexToLevel;
        const levelAmount = indexToLevel(this.cells.length);
        const getLevel = (i, j) => indexToLevel(max(i, j));
        this.levels = []

        for (let level = 0; level < levelAmount; level++)
            this.levels[level] = 1;

        for (let i = 0; i < this.cells.length; i++) {
            for (let j = 0; j < this.cells.length; j++) {
                const level = getLevel(i, j);
                this.levels[level] = this.cells[i][j] === 1
                    ? this.levels[level] : 0;
            }
        }
    }

    recombine(otherGene, recomboer = recomboers.default) {
        return recomboer(this, otherGene);
    }

    get ["level"]() {
        let level = -1;
        while (this.levels[++level] === 1);
        return level;
    }

    mutate(mutator = mutators.default) {
        mutator(this);
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

    clone() {
        return new Organism({genes: this.genes}); }

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
        const indexToLevel = partitionTools.default.indexToLevel;

        const gene = this.genes[0];
        const cells = gene.cells;
        const colors = ["red", "green", "blue"];

        // Fill the grid up specially with levels in mind
        const x = this.x + cellSize;
        const y = this.y + cellSize;
        for (let i = 0; i < cells.length; i++) {
            for (let j = 0; j < cells.length; j++) {
                ctx.fillStyle = cells[i][j] == 1
                    ? colors[indexToLevel(max(i, j)) % colors.length]
                    : "white";
                ctx.fillRect(cellSize * j + x, cellSize * i + y,
                                cellSize, cellSize);
            }
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
console.log(testOrganism.genes[0].levels);