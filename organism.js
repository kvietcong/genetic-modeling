// Look at the comments in `gene.js` for more details on how this code works

/* Default Global Parameters related to Organisms */
params.geneAmount = 1;
params.skills = ["speed", "vision", "reproduction", "size", "health"];
params.maxReproductionTime = 15;

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
            organism.genes = params.skills
                .reduce((genes, skill) => {
                    genes[skill] = new Gene();
                    return genes;
                }, {});
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
        simpleReproduce: (organism, otherOrganism) => new Organism({
            genes: params.skills.reduce((genes, skill) => {
                genes[skill] = organism.genes[skill]
                    .recombine(otherOrganism.genes[skill]);
                return genes;
            }, {})
        })

    };
    /** Default reproduction function */
    _.reproducer = _.reproducers.simpleReproduce;

    /** Different functions to draw an Organism on the canvas */
    _.drawers = {
        /**
         * @param {Organism} organism The Organism's state
         * @param {GameEngine} gameEngine The Game Engine's State
         */
        _: (organism, ctx, gameEngine) => undefined,
        sizeDraw: (organism, ctx) => {
            const { x, y } = organism;
            ctx.beginPath();
            const size = organism.genes.size.level;
            ctx.fillStyle = [
                "red", "green", "blue", "purple", "black", "brown"
            ][size % 6];
            ctx.arc(x, y, organism.radius, 0, 2 * Math.PI);
            ctx.fill();
        },
        blendDraw: (organism, ctx) => {
            const { x, y } = organism;
            ctx.beginPath();
            ctx.fillStyle = rgba(
                organism.genes.size.level / params.initialPartitions * 400,
                organism.genes.speed.level / params.initialPartitions * 400,
                organism.genes.health.level / params.initialPartitions * 400,
                1
            );
            ctx.arc(x, y, organism.radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    };
    /** Default drawing function to display and organism */
    _.drawer = _.drawers.blendDraw;

    _.Organism = class Organism {
        /** {Array<Genes>} A list of genes that the Organism has */
        genes;
        /** {Number} Coordinates for canvas rendering */
        x = 0; y = 0;
        direction = Vector.randomUnit();

        timeSinceLastReproduction = 0;
        children = 0;
        generation = 0;

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

        get["radius"]() {
            return this.genes.size.level * 2 + 10;
        }

        canReproduce() {
            return this.timeSinceLastReproduction >
                (params.maxReproductionTime
                    / sqrt(this.genes.reproduction.level + 1));
        }

        update(gameEngine) {
            const newSpeed = this.direction
                .scale(this.genes.speed.level + 3)
                // Scale speed based on time since last frame
                .scale(gameEngine.deltaTime * 100);
            this.x += newSpeed.x;
            this.y += newSpeed.y;
            this.timeSinceLastReproduction += gameEngine.deltaTime;
            if (this.x < 0) {
                this.direction.x = abs(this.direction.x);
                this.x = 0;
            }
            if (this.x > params.canvas.width) {
                this.direction.x = -abs(this.direction.x);
                this.x = params.canvas.width;
            }
            if (this.y < 0) {
                this.direction.y = abs(this.direction.y);
                this.y = 0;
            }
            if (this.y > params.canvas.height) {
                this.direction.y = -abs(this.direction.y);
                this.y = params.canvas.height;
            }

            const entitiesToAdd = [];
            gameEngine.entities.forEach(entity => {
                if (entity !== this
                    && entity instanceof Organism
                    && getDistance(this.x, this.y, entity.x, entity.y) < this.radius
                ) {
                    // Eat the other organism if they are >2 levels smaller
                    if (this.genes.size.level - 1 > entity.genes.size.level) {
                        entity.removeFromWorld = true;
                    } else if (this.canReproduce() && entity.canReproduce()) {
                        this.children++;
                        const newOrganism = this.reproduce(entity);
                        newOrganism.x = this.x;
                        newOrganism.y = this.y;
                        newOrganism.generation = this.generation + 1;

                        for (const skill in newOrganism.genes)
                            newOrganism.genes[skill].mutate();
                        entitiesToAdd.push(newOrganism);
                    }
                }
            });
            entitiesToAdd.forEach(entity => gameEngine.addEntity(entity));
            if (random() < (0.0025 / (this.genes.health.level + 1))
                && (this.children || this.generation)
            ) {
                this.removeFromWorld = true;
            }
        }

        draw(ctx, gameEngine) {
            const drawer = _.drawer;
            return drawer(this, ctx, gameEngine);
        }

        reproduce(otherOrganism, reproducer = _.reproducer) {
            return reproducer(this, otherOrganism);
        }

        toString() {
            return Object.entries(this.genes).map(
                ([skill, gene]) => `${skill}:\n${gene.toString()}`
            ).join("\n\n");
        }
    }

    return _;
})();

// General export to have things easily accessible to all other files.
const { Organism } = libOrganism;