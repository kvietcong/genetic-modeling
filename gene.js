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

const testPrinter = (newValue, propertyName) => console.log(`${propertyName} is now ${newValue}`);
const exampleCallback = (newValue, propertyName) => {
    const container = document.getElementById(propertyName + "-container");
    const p = container.children[0];
    p.textContent = `:${propertyName}: ${newValue}`;
};

/* Default Global Parameters related to Genes */
attachPropertiesWithCallbacks(params, [ // Function in `util.js`
    [ "cellSize", 5 ], // For Drawing (Currently Unused)
    [ "fillToLevel", 0 ],  // getRandomInteger(1,3); // document.getElementById("fillToLevelIn").value;
    [ "partitionSize", 1 ], // document.getElementById("sizeOfLevelIn").value; // it was set at 2 but Chris might want this at 1
    [ "mutationChance", 0.3 ],
    [ "initialPartitions", 5 ],
    [ "gene", {} ],
    [ "meme", {} ]
]);

/** Library of Gene related values and functions */
const libGene = (() => {
    "use strict";

    /** Object that contains public facing things for the Gene Library */
    const _ = {};

    /** Different sets of functions to change partition sizes */
    _.partitionTools = {
        constant: {
            indexToLevel: index => floor(index / params.partitionSize),
            levelToIndex: level => params.partitionSize * level,
            partitionSize: () => params.partitionSize,
        },
        exponential: {
            indexToLevel: index => index === 0 ? 0 : floor(lg(index)) + 1,
            levelToIndex: level => level === 0 ? 0 : pow(2, level - 1),
            partitionSize: level => level < 2 ? 1 : pow(2, level - 1),
        },
    };
    /** Default Partitioning Tools */
    params.gene.partitionTooling = _.partitionTools.constant;

    /** Different functions to initialize a Gene's cells */
    _.initializers = {
        /**
         * @param {Gene} gene The gene's state
         */
        _: gene => undefined,
    };
    _.initializers.perCell = {
        template: (gene, initializer, ...options) => {
            const dimensions =  params.gene.partitionTooling.levelToIndex(
                params.initialPartitions);
            gene.cells = new BitArray2D(dimensions, dimensions);

            for (let i = 0; i < dimensions; i++)
                for (let j = 0; j < dimensions; j++)
                    gene.cells.set(i, j, initializer(...options, i, j));
        },
        blank: () => 0,
        fill: () => 1,
        random: () => getRandomInteger(0, 1),
        fillToLevel: (l, i, j) => [i, j].every(index =>
                index < params.gene.partitionTooling.levelToIndex(l))
                ? 1 : 0,
        randomToLevel: (l, i, j) => [i, j].every(index =>
                index < params.gene.partitionTooling.levelToIndex(l))
                ? getRandomInteger(0,1) : 0,
    };
    /** Default Initializer to create new genes */
    params.gene.initializer = gene =>
        _.initializers.perCell.template(gene,
                                        _.initializers.perCell.fillToLevel,
                                        params.fillToLevel);
    params.meme.initializer = params.gene.initializer;

    /**
     * @param {Array2D} cells Array of cells
     * @param {Array2D} newPartition Array of replacements
     * @param {Integer} x Beginning row of replacement
     * @param {Integer} y Beginning column of replacement
     * @returns New cells with a replacement
     */
    const replacePartition = (cells, newPartition, x, y) => {
        let newCells = cells.clone();
        for (let i = x; i < x + newPartition.length; i++) {
            for (let j = y; j < y + newPartition[0].length; j++) {
                newCells.set(i, j, newPartition[i-x][j-y]);
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
        _: (gene, otherGene) => undefined,
    };
    /** Combine on a per cell basis */
    _.recomboers.perCell = {
        template: (gene, otherGene, recomboer) => {
            const newCells = new BitArray2D(gene.cells.width, gene.cells.height);
            for (let i = 0; i < gene.cells.height; i++) {
                for (let j = 0; j < gene.cells.width; j++) {
                    newCells.set(i, j, recomboer(gene.cells.get(i, j),
                                                 otherGene.cells.get(i, j),
                                                 i, j));
                }
            }
            const Type = (gene instanceof Meme) ? Meme : Gene;
            return new Type({cells: newCells});
        },
        XOR: (a, b) => (a + b) % 2,
        OR: (a, b) => ceil((a + b) / 2),
        AND: (a, b) => (a + b) == 2 ? 1 : 0,
        NAND: (a, b) => !_.recomboers.perCell.AND(a, b),
        NOR: (a, b) => !_.recomboers.perCell.OR(a, b),
        ORAND: (a, b) => Math.random() < 0.5 ? _.recomboers.perCell.OR(a, b) : _.recomboers.perCell.AND(a, b), // randomly selects between OR and AND
    };
    _.recomboers.perLevel = {
        template: (gene, otherGene, recomboer) => {
            const levelA = gene.level;
            const levelB = otherGene.level;
            const level = max(levelA, levelB);

            const { levelToIndex } = params.gene.partitionTooling;
            const newCells = new BitArray2D(gene.cells.width, gene.cells.height);

            let isEmpty = false;
            let currentLevel = 0;
            while (!isEmpty && currentLevel < level) {
                isEmpty = true;
                const indexStart = levelToIndex(currentLevel);
                const indexEnd = levelToIndex(currentLevel + 1);

                if (indexStart >= gene.cells.width) break;

                for (let i = 0; i < indexEnd; i++)
                    for (let j = indexStart; j < indexEnd; j++) {
                        const newValue = recomboer(gene.cells.get(i, j), otherGene.cells.get(i, j), i, j, gene, otherGene);
                        newCells.set(i, j, newValue);
                        isEmpty = !newValue && isEmpty;
                    }

                for (let i = indexStart; i < indexEnd; i++)
                    for (let j = 0; j < indexEnd; j++) {
                        const newValue = recomboer(gene.cells.get(i, j), otherGene.cells.get(i, j), i, j, gene, otherGene);
                        newCells.set(i, j, newValue);
                        isEmpty = !newValue && isEmpty;
                    }

                currentLevel++;
            }

            const Type = (gene instanceof Meme) ? Meme : Gene;
            return new Type({cells: newCells});
        },
    };
    _.recomboers.chooseOnePartition = (gene, otherGene) => {
        let newCells = gene.cells.clone();
        if (gene.level !== otherGene.level)
            return (gene.level > otherGene.level ? gene : otherGene).clone();
        let level = gene.level;
        let i;
        for (i = 0; i < level; i++) {
            const newPartition1 =
                chooseRandom([gene, otherGene]).getPartition(i, level);
            const newPartition2 =
                chooseRandom([gene, otherGene]).getPartition(level, i);
            const x = params.gene.partitionTooling.levelToIndex(i);
            const y = params.gene.partitionTooling.levelToIndex(level);
            newCells = replacePartition(newCells, newPartition1, x, y);
            newCells = replacePartition(newCells, newPartition2, y, x);
        }
        const Type = (gene instanceof Meme) ? Meme : Gene;
        return new Type({cells: newCells});
    };
    _.recomboers.chooseFromPartitionLibrary = (gene, otherGene) => {
        let newCells = gene.cells.clone();
        if (gene.level !== otherGene.level) {
            // console.log("You don't have the same level")
            return (gene.level > otherGene.level ? gene : otherGene).clone();
        }

        const level = gene.level;
        if (params.gene.partitionTooling.levelToIndex(level) >= gene.cells.width) {
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
            const x = params.gene.partitionTooling.levelToIndex(i);
            const y = params.gene.partitionTooling.levelToIndex(level);
            newCells = replacePartition(newCells, chooseRandom(library), x, y);
            newCells = replacePartition(newCells, chooseRandom(library), y, x);
        }
        const Type = (gene instanceof Meme) ? Meme : Gene;
        return new Type({cells: newCells});
    }
    /** Default Recomboer to combine two genes */
    // params.gene.recomboer = _.recomboers.chooseFromPartitionLibrary;
    params.gene.recomboer = (gene, otherGene) => _.recomboers.perCell.template(gene, otherGene, _.recomboers.perCell.OR);
    params.meme.recomboer = params.gene.recomboer;

    const checkIfLevelIsEmpty = (gene, level) => {
        if (level === 0) return false;

        const levelToIndex = params.gene.partitionTooling.levelToIndex;
        const indexStart = levelToIndex(level - 1);
        const indexEnd = levelToIndex(level);

        let isEmpty = true;

        if (indexStart >= gene.cells.width) return isEmpty;

        for (let i = 0; i < indexEnd; i++) {
            for (let j = indexStart; j < indexEnd; j++) {
                isEmpty = !gene.cells.get(i, j);
                if (!isEmpty) return false;
            }
        }

        for (let i = indexStart; i < indexEnd; i++) {
            for (let j = 0; j < indexEnd; j++) {
                isEmpty = !gene.cells.get(i, j);
                if (!isEmpty) return false;
            }
        }

        return true;
    };

    const checkIfLevelIsFilled = (gene, level) => {
        if (level === 0) return true;

        const levelToIndex = params.gene.partitionTooling.levelToIndex;
        const indexStart = levelToIndex(level - 1);
        const indexEnd = levelToIndex(level);

        let isFilled = true;

        if (indexStart >= gene.cells.width) return false;

        for (let i = 0; i < indexEnd; i++) {
            for (let j = indexStart; j < indexEnd; j++) {
                isFilled = !!gene.cells.get(i, j);
                if (!isFilled) return false;
            }
        }

        for (let i = indexStart; i < indexEnd; i++) {
            for (let j = 0; j < indexEnd; j++) {
                isFilled = !!gene.cells.get(i, j);
                if (!isFilled) return false;
            }
        }

        return true;
    };

    /** Different functions to mutate a Gene's cells */
    _.mutators = {
        /** @param {Gene} gene The gene's state */
        _: gene => undefined,
        void: _ => undefined
    };
    /** Mutate Cells on the current level */
    _.mutators.currentLevel = {
        template: (gene, mutator) => {
            const level = gene.level;
            const levelToIndex = params.gene.partitionTooling.levelToIndex;
            const isLevelEmpty = checkIfLevelIsEmpty(gene, level);
            const indexStart = levelToIndex(level - isLevelEmpty);
            const indexEnd = levelToIndex(level + !isLevelEmpty);

            if (indexStart >= gene.cells.width) return;

            const mutateStrip = (indexStart, indexEnd) => {
                let deactivatedAnything = false;
                for (let i = 0; i < indexEnd; i++)
                    for (let j = indexStart; j < indexEnd; j++) {
                        const newValue = gene.cells.set(i, j, mutator(gene.cells.get(i, j), i, j, gene));
                        deactivatedAnything = deactivatedAnything || !newValue;
                    }

                for (let i = indexStart; i < indexEnd; i++)
                    for (let j = 0; j < indexEnd; j++) {
                        const newValue = gene.cells.set(i, j, mutator(gene.cells.get(i, j), i, j, gene));
                        deactivatedAnything = deactivatedAnything || !newValue;
                    }

                return deactivatedAnything;
            };

            const deactivatedAnything = mutateStrip(indexStart, indexEnd);
            if (isLevelEmpty && !deactivatedAnything) mutateStrip(indexEnd, levelToIndex(level + 1));

        },
        flip: currentState =>
            Math.random() <= params.mutationChance
                ? (currentState + 1) % 2
                : currentState,
        rejuvenate: () => 1,
        destroy: () => 0,
    }
    /** Default mutator for genes */
    params.gene.mutator = gene =>
        _.mutators.currentLevel.template(gene, _.mutators.currentLevel.flip);
    params.meme.mutator = params.gene.mutator;

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
            const indexToLevel = params.gene.partitionTooling.indexToLevel;

            // Fill the grid up specially with levels in mind
            const x = gene.x + cellSize;
            const y = gene.y + cellSize;
            for (let i = 0; i < cells.height; i++) {
                for (let j = 0; j < cells.width; j++) {
                    ctx.fillStyle = cells.get(i, j) == 1
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
    params.gene.drawer = _.drawers.simpleDraw;

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
                    this.cells = options.cells.clone();
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

        initializeCells(initializer = params.gene.initializer) {
            initializer(this);
        }

        getPartition(i, j) {
            const partition = [];
            const partitionSize = params.gene.partitionTooling.partitionSize(max(i, j));
            const levelToIndex = params.gene.partitionTooling.levelToIndex;

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
                    partition[x][y] = this.cells.get(k, l);
                    y++;
                }
                x++;
            }
            return partition;
        }

        generateLevels() {
            const indexToLevel = params.gene.partitionTooling.indexToLevel;
            const levelAmount = indexToLevel(this.cells.height);
            const getLevel = (i, j) => indexToLevel(max(i, j));
            this.levels = []

            for (let level = 0; level < levelAmount; level++)
                this.levels[level] = 1;

            for (let i = 0; i < this.cells.height; i++) {
                for (let j = 0; j < this.cells.width; j++) {
                    const level = getLevel(i, j);
                    this.levels[level] = this.cells.get(i, j) === 1
                        ? this.levels[level] : 0;
                }
            }
            this.cellCount = this.cells.reduceBits((accumulated, bit) => accumulated + bit, 0);
        }

        recombine(otherGene, recomboer = params.gene.recomboer) {
            return recomboer(this, otherGene);
        }

        /** Retrieve the current level of the gene. Accessed like a property */
        get level() {
            let level = -1; while (this.levels[++level] === 1); return level;
        }

        mutate(mutator = params.gene.mutator) {
            mutator(this);
            this.updateInfo();
        }

        draw(ctx, gameEngine) {
            const drawer = params.gene.drawer;
            return drawer(this, ctx, gameEngine);
        }

        update() { }

        toString() {
            // TODO
            // return this.cells.map(row => row.join(" ")).join("\n");
            return "TODO"
        }
    }

    _.Meme = class Meme extends _.Gene {
        constructor(options = null) { super(options); }

        clone() { return new Meme({cells: this.cells}); }

        initializeCells(initializer = params.meme.initializer) {
            return super.initializeCells(initializer);
        }

        recombine(otherGene, recomboer = params.meme.recomboer) {
            return super.recombine(otherGene, recomboer);
        }

        mutate(mutator = params.meme.mutator) {
            return super.mutate(mutator)
        }
    }

    return _;
})();

// General export to have things easily accessible to all other files.
const { Gene, Meme } = libGene;

// Changing the recomboer outside of the library example.
// params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.AND);