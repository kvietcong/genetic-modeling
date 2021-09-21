// Look at the comments in `gene.js` for more details on how this code works

/* Default Global Parameters related to Organisms */
params.geneAmount = 1;

const libOrganism = (() => {
    "use strict";

    /** Object that contains public facing things for the Organism Library */
    const _ = {};

    /** Different functions to create a new organism */
    _.initializers = {
        /**
         * @param {Organism} organism The Organism's state
         */
        _: organism => undefined,
        randomize: organism => {
            organism.genes = [];
            for (let i = 0; i < params.geneAmount; i++)
                organism.genes.push(new Gene());
        }
    };
    /** Default initializing function */
    _.initializer = _.initializers.randomize;

    /** Different functions for two organism reproduction */
    _.reproducers = {
        /**
         * @param {Organism} organism The Organism's state
         * @param {Organism} otherOrganism The other Organism's state
         * @returns {Organism} Newly made organism (Offspring)
         */
        _: (organism, otherOrganism) => undefined,
        firstGeneReproduction: (organism, otherOrganism) => {
            const otherGenes = otherOrganism.genes;
            if (organism.genes.length !== otherGenes.length)
                return console.log("Incompatible!");

            const newGenes = []

            for (let i = 0; i < organism.genes.length; i++) {
                newGenes[i] = organism.genes[i].recombine(otherGenes[i]);
            }

            return new Organism({genes: newGenes});
        }
    };
    /** Default reproduction function */
    _.reproducer = _.reproducers.firstGeneReproduction;

    /** Different functions to draw an Organism on the canvas */
    _.drawers = {
        /**
         * @param {Organism} organism The Organism's state
         * @param {CanvasRenderingContext2D} ctx The context where you can draw
         */
        _: (organism, ctx) => undefined,
    };
    /** Default drawing function to display and organism */
    _.drawer = _.drawers._;

    _.Organism = class Organism {
        /** {Array<Genes>} A list of genes that the Organism has */
        genes;
        /** {GameEngine|undefined}
         * Current game engine instance attached to this organism */
        gameEngine;

        constructor(options = null) {
            if (options) {
                if (options.genes) {
                    this.genes = deepCopy(options.genes);
                } else if (options.init_function) {
                    this.initializeCells(options.init_function);
                } else {
                    throw "Invalid Options!";
                }
            } else {
                this.initializeGenes();
            }
        }

        initializeGenes(initializer = _.initializer) {
            initializer(this);
        }

        clone() {
            return new Organism({genes: this.genes});
        }

        randomizeGenes() {
            this.genes = [];
            for (let i = 0; i < params.geneAmount; i++) {
                this.genes[i] = new Gene();
            }
        }

        attachGameEngine(gameEngine, x, y) {
            Object.assign(this, {gameEngine, x, y});
        }

        draw(ctx, drawer = _.drawer) {
            return drawer(this, ctx);
        }

        reproduce(otherOrganism, reproducer = _.reproducer) {
            return reproducer(this, otherOrganism);
        }

        toString() {
            return this.genes.map(gene => gene.toString()).join("\n");
        }
    }

    return _;
})();

// General export to have things easily accessible to all other files.
const { Organism } = libOrganism;