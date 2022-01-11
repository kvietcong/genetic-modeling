// WARNING:
// INDEXING IS REALLY WEIRD FOR DRAWING RN!
// I NEED TO NORMALIZE HOW I/X AND J/Y WORKS!
// - KV

// NOTE:
// I would recommend learning about passing functions in JS in order to
// understand this code. It also might be helpful to learn about anonymous
// and arrow functions.
//
// If you have any questions on how a piece of this works or a better way to
// organize the code, please shoot a message on the Discord server.
// - KV

// WORKFLOW:
// There are two main classes. Organism and Gene. An Organism can contain
// multiple genes but at the moment, it only holds one. A Gene is the more
// developed part. This is where most of the action takes place.
//
// libGene is an auto-executing function that returns a library of things that
// pertain to Genes. Within the auto-executing function there is an object
// `_` that should contain all public facing things. Under `_`, are more objects
// that contain functions that help with doing specific things in genes.
// If you want to know what parameters these functions are passed,
// look at the `_` key of the specific objects. Example: `_.partitionTools._`.
//
// Sometimes, there are nested objects within these top level objects. These
// usually contain a template to help do more specific actions without repeating
// a bunch of code.
//
// There are also some useful functions in the `./util.js` file.

/* Default Global Parameters related to Genes */
params.cellSize = 6;            // changes the size of the square that depicts a single gene - KV 2
params.fillToLevel = 4;         // determine how much of the gene is pre-filled (evolved) - KV 0
params.partitionSize = 5;       // NOT sure what this does - KV 5
params.mutationChance = .5;     // chance that mutation will affect a gene KV 0.2
params.initialPartitions = 5;   // the number of subsections within a gene KV 5

/** Library of Gene related values and functions */
const libGene = (() => {
    "use strict";

    /** Object that contains public facing things for the Gene Library */
    const _ = {};               // note the underscore is the "name" of the variable

    /** Different sets of functions to change partition sizes */
    _.partitionTools = {
        constant: {
            
            indexToLevel: index => floor(index / params.partitionSize),
            levelToIndex: level => params.partitionSize * level,
            partitionSize: () => params.partitionSize,
        },
        quadratic: {
            indexToLevel: index => index === 0 ? 0 : floor(lg(index)) + 1,
            levelToIndex: level => level === 0 ? 0 : pow(2, level - 1),
            partitionSize: level => level < 2 ? 1 : pow(2, level - 1),
        },
    };

    /** Default Partitioning Tools */
    _.partitionTooling = _.partitionTools.quadratic;


    /** Different functions to initialize a Gene's cells */
    _.initializers = {
        /**
         * @param {Gene} gene The gene's state
         */
        _: gene => undefined,
    };
    _.initializers.perCell = {
        template: (gene, initializer, ...options) => {
            const dimensions =  _.partitionTooling.levelToIndex(
                params.initialPartitions);
            gene.cells = [];

            for (let i = 0; i < dimensions; i++) {
                gene.cells[i] = [];
                for (let j = 0; j < dimensions; j++) {
                    gene.cells[i][j] = initializer(...options, i, j);
                }
            }
        },
        blank: () => 0,
        fill: () => 1,
        random: () => getRandomInteger(0, 1),
        fillToLevel: (l, i, j) => [i, j].every(index =>
                index < _.partitionTooling.levelToIndex(l))
                ? 1 : 0,
        randomToLevel: (l, i, j) => [i, j].every(index =>
                index < _.partitionTooling.levelToIndex(l))
                ? getRandomInteger(0,1) : 0,
    };
    /** Default Initializer to create new genes */
    _.initializer = gene =>
        _.initializers.perCell.template(gene,
                                        _.initializers.perCell.fillToLevel,
                                        params.fillToLevel);

    /**
     * @param {Array2D} cells Array of cells
     * @param {Array2D} newPartition Array of replacements
     * @param {Integer} x Beginning row of replacement
     * @param {Integer} y Beginning column of replacement
     * @returns New cells with a replacement
     */
    const replacePartition = (cells, newPartition, x, y) => {
        let newCells = deepObjectCopy(cells);
        for (let i = x; i < x + newPartition.length; i++) {
            for (let j = y; j < y + newPartition[0].length; j++) {
                newCells[i][j] = newPartition[i-x][j-y];
            }
        }
        return newCells;
    }

    /** Different functions to recombine two Genes' cells */
    _.recomboers = {
        /**
         * @param {Gene} gene The first gene's state
         * @param {Gene} otherGene The other gene's state
         * @returns New Gene
         */
        _: (gene, otherGene) => undefined, // takes in two genes
        // returnThisGene: (gene, otherGene) =>  gene , // defaults to what ever is at the end
    };

    /** KDunn This method will just return the original gene */
    _.recomboers.returnThisGene = {
        template: (gene, otherGene) => { 
            return gene.clone();                 // why when we select gene does it select the last level of that gene
                                         // but when we select other gene, it'll select the level that that gene was chosen?
        },
    };
    
    /** KDunn This method will just return the otherGene */
    _.recomboers.returnOtherGene = {
        template: (gene, otherGene) => { 
            return otherGene.clone(); // a clone of the gene - a deep copy of all of the gene
        },
    };

    /** KDunn This method will just "randomly" return gene or otherGene */
    _.recomboers.randomGene = (gene, otherGene) => {
        let rand = Math.floor(Math.random() *2); 
        let returnGene;
        returnGene = rand == 0 ? gene : otherGene;
        return returnGene;
    };

    /** Combine on a per cell basis */
    _.recomboers.perCell = {
        template: (gene, otherGene, recomboer) => { // goes to every cell in the gene matrix and applies the recomboer method.
            const newCells = [];
            for (let i = 0; i < gene.cells.length; i++) {
                newCells[i] = [];
                for (let j = 0; j < gene.cells.length; j++) {
                    newCells[i][j] = recomboer(gene.cells[i][j],        // recomboer is called on the two gene cells
                                               otherGene.cells[i][j],
                                               i, j);                    
                }
            }
            return new Gene({cells: newCells});
        },
        // these take the cells
        // we can do arithmetic functions here too
        XOR: (a, b) => (a + b) % 2,                                     // add randomly pick a or b
        OR: (a, b) => ceil((a + b) / 2),
        AND: (a, b) => (a + b) == 2 ? 1 : 0,
        NAND: (a, b) => !_.recomboers.perCell.AND(a, b),
        NOR: (a, b) => !_.recomboers.perCell.OR(a, b),
        // missing if then; iff
    };
    _.recomboers.chooseOnePartition = (gene, otherGene) => {
        let newCells = deepObjectCopy(gene.cells);                  // clones javascript primatives. KV wrote this. DONT CALL ON INSTANCES OF CLASSES!!
        if (gene.level !== otherGene.level)
            return (gene.level > otherGene.level ? gene : otherGene).clone();
        let level = gene.level;
        let i;
        for (i = 0; i < level; i++) {
            const newPartition1 =
                chooseRandom([gene, otherGene]).getPartition(i, level);
            const newPartition2 =
                chooseRandom([gene, otherGene]).getPartition(level, i);
            const x = _.partitionTooling.levelToIndex(i);
            const y = _.partitionTooling.levelToIndex(level);
            newCells = replacePartition(newCells, newPartition1, x, y);
            newCells = replacePartition(newCells, newPartition2, y, x);
        }
        return new Gene({cells: newCells});
    };
    _.recomboers.chooseFromPartitionLibrary = (gene, otherGene) => {
        let newCells = deepObjectCopy(gene.cells);
        if (gene.level !== otherGene.level) {
            // console.log("You don't have the same level")
            return (gene.level > otherGene.level ? gene : otherGene).clone();
        }

        const level = gene.level;
        if (_.partitionTooling.levelToIndex(level) >= gene.cells.length) {
            // console.log("You have hit a level limit")
            return (gene.level > otherGene.level ? gene : otherGene).clone();
        }

        const library = [];
        let i;
        for (i = 0; i < level; i++) {
            library.push(gene.getPartition(i, level));
            library.push(gene.getPartition(level, i));
        }
        for (i = 0; i < level; i++) {
            const x = _.partitionTooling.levelToIndex(i);
            const y = _.partitionTooling.levelToIndex(level);
            newCells = replacePartition(newCells, chooseRandom(library), x, y);
            newCells = replacePartition(newCells, chooseRandom(library), y, x);
        }
        return new Gene({cells: newCells});
    }
    /** Default Recomboer to combine two genes */
     //  _.recomboer = _.recomboers.chooseFromPartitionLibrary;
    //   _.recomboer = (gene, otherGene) =>  _.recomboers.perCell.template(gene, otherGene, _.recomboers.perCell.AND);  // default function that takes in two genes
                                                                                                                    // then call the perCell.template
                                                                                                                    // returns a new gene
     _.recomboer = _.recomboers.returnOtherGene.template; // Returns the other gene
                                                                                                                                  // Shows the the other gene may be itself
    // _.recomboer = (gene, otherGene) =>  _.recomboers.returnThisGene.template(gene, otherGene, _.recomboers.returnThisGene); // Returns the gene
    //    _.recomboer = (gene, otherGene) =>  _.recomboers.randomGene(gene, otherGene); // Randomly returns gene or otherGene
                                                                                                                                  

    /** Different functions to mutate a Gene's cells */
    _.mutators = {
        /** @param {Gene} gene The gene's state */
        _: gene => undefined,
    };

    /** Mutate Cells on the current level */
    _.mutators.currentLevel = {
        template: (gene, mutator) => {
            const level = gene.level;
            const levelToIndex = _.partitionTooling.levelToIndex;
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
        flip: currentState =>
            Math.random() <= params.mutationChance
                ? (currentState + 1) % 2
                : currentState,
        rejuvenate: () => 1,
        destroy: () => 0,
    }

    /** KDunn Mutate Cells on the previous level */
    // edge case either mutate from previous level or current level
    _.mutators.previousLevel = {
        template: (gene, mutator) => {
            const level = gene.level - 1;
            const levelToIndex = _.partitionTooling.levelToIndex;
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
        flip: currentState =>
            Math.random() <= params.mutationChance
                ? (currentState + 1) % 2
                : currentState,
        rejuvenate: () => 1,
        destroy: () => 0,
    }

    /** Default mutator for genes */
    _.mutator = gene =>
        // _.mutators.currentLevel.template(gene, _.mutators.currentLevel.flip);
        _.mutators.previousLevel.template(gene, _.mutators.currentLevel.flip);

    /** Different functions to draw a Gene's cells */
    _.drawers = {
        /**
         * @param {Gene} gene The gene's state
         * @param {CanvasRenderingContext2D} ctx The context where you can draw
         * @param {GameEngine} gameEngine The Game Engine's State
         */
        _: (gene, ctx, gameEngine) => undefined,
        simpleDraw: (gene, ctx) => {
            const cells = gene.cells;
            const cellSize = params.cellSize;
            const colors = ["red", "green", "blue"];
            const indexToLevel = _.partitionTooling.indexToLevel;

            // Fill the grid up specially with levels in mind
            const x = gene.x + cellSize;
            const y = gene.y + cellSize;
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
            ctx.strokeRect(gene.x + cellSize/2, gene.y + cellSize/2,
                           cellSize * cells.length + cellSize,
                           cellSize * cells.length + cellSize);
        },
    };
    /** Default drawing function to display a gene */
    _.drawer = _.drawers.simpleDraw;

    /** Representation of an organism's specific gene */
    _.Gene = class Gene {
        /** {Array<Array<0|1>>} Grid (2D Array) of cells that are either filled or not (1 or 0) */
        cells;
        /** {Array<0|1>} An array of 0 or 1 to determine if a level is filled */
        levels;
        /** {Number} Coordinates for canvas rendering */
        x = 0; y = 0;

        constructor(options = null) {
            if (options) {
                if (options.cells) {
                    this.cells = deepObjectCopy(options.cells);
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

        initializeCells(initializer = _.initializer) {
            initializer(this);
        }

        getPartition(i, j) {
            const partition = [];
            const partitionSize = _.partitionTooling.partitionSize(max(i, j));
            const levelToIndex = _.partitionTooling.levelToIndex;

            let kStart, lStart;
            if (i > j) {
                kStart = levelToIndex(i);
                lStart = j * partitionSize;
            } else {
                kStart = i * partitionSize;
                lStart = levelToIndex(j);
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
            const indexToLevel = _.partitionTooling.indexToLevel;
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

        recombine(otherGene, recomboer = _.recomboer) { // takes in gene and default recomboer
            return recomboer(this, otherGene);
        }

        /** Retrieve the current level of the gene. Accessed like a property */
        get ["level"]() {
            let level = -1;
            while (this.levels[++level] === 1);
            return level;
        }

        mutate(mutator = _.mutator) {
            mutator(this);
            this.updateInfo();
        }

        draw(ctx, gameEngine) {
            const drawer = _.drawer;
            return drawer(this, ctx, gameEngine);
        }

        update() { }

        toString() {
            return this.cells.map(row => row.join(" ")).join("\n");
        }
    }

    return _;
})();

// General export to have things easily accessible to all other files.
const { Gene } = libGene;