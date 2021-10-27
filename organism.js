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
                return console.log("Incompatible!") || organism;

            const newGenes = [];

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
        circleDraw: (organism, ctx) => {
            const { x, y } = organism;
            ctx.beginPath();
            ctx.fillStyle = [
                "red", "green", "blue", "purple", "black", "brown"
            ][organism.genes[0].level % 6];
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fill();
        },
    };
    /** Default drawing function to display and organism */
    _.drawer = _.drawers.circleDraw;

    _.Organism = class Organism {
        /** {Array<Genes>} A list of genes that the Organism has */
        genes;
        /** {GameEngine|undefined}
         * Current game engine instance attached to this organism */
        gameEngine;

        constructor(options = null) {
            if (options) {
                if (options.genes) {
                    this.genes = options.genes;
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

        attachGameEngine(gameEngine, x, y) {
            Object.assign(this, {gameEngine, x, y});
        }

        update() {
            this.x += getRandomInteger(-5, 5);
            this.y += getRandomInteger(-5, 5);
            if (this.x < 0) this.x = 0;
            if (this.y < 0) this.y = 0;
            if (this.x > 1000) this.x = 1000;
            if (this.y > 1000) this.y = 1000;
            const entitiesToAdd = [];
            this.gameEngine.entities.forEach(entity => {
                if (entity !== this
                    && (this.canReproduce || this.canReproduce === undefined)
                    && (this.parent !== entity.parent || !entity.parent)
                ) {
                    if (getDistance(this.x, this.y, entity.x, entity.y) < 10) {
                        const newOrganism = this.reproduce(entity);
                        newOrganism.attachGameEngine(this.gameEngine, this.x, this.y);
                        newOrganism.genes[0].mutate();
                        newOrganism.parent = this;
                        this.canReproduce = false;
                        entitiesToAdd.push(newOrganism);
                    }
                }
            });
            entitiesToAdd.forEach(entity => this.gameEngine.addEntity(entity));
            if (random() < 0.01
                && !this.canReproduce
                && (this.parent !== undefined)
            ) this.removeFromWorld = true;
        }

        draw(ctx, drawer = _.drawer) {
            return drawer(this, ctx);
        }

        reproduce(otherOrganism, reproducer = _.reproducer) {
            return reproducer(this, otherOrganism);
        }

        toString() {
            return this.genes.map(
                (gene, i) => `Gene ${i+1}:\n${gene.toString()}`
            ).join("\n\n");
        }
    }

    return _;
})();

// General export to have things easily accessible to all other files.
const { Organism } = libOrganism;