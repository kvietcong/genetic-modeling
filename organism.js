// Look at the comments in `gene.js` for more details on how this code works

/* Default Global Parameters related to Organisms */
params.geneAmount = 1;
params.skills = ["speed", "vision", "reproduction", "size", "health"];

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
         * @param {CanvasRenderingContext2D} ctx The context where you can draw
         */
        _: (organism, ctx) => undefined,
        circleDraw: (organism, ctx) => {
            const { x, y } = organism;
            ctx.beginPath();
            const size = organism.genes.size.level;
            ctx.fillStyle = [
                "red", "green", "blue", "purple", "black", "brown"
            ][size % 6];
            ctx.arc(x, y, organism.radius, 0, 2 * Math.PI);
            ctx.fill();
        },
    };
    /** Default drawing function to display and organism */
    _.drawer = _.drawers.circleDraw;

    _.Organism = class Organism {
        /** {Array<Genes>} A list of genes that the Organism has */
        genes;
        /** {Number} Coordinates for canvas rendering */
        x = 0; y = 0;
        velocity = new Vector(getRandomRange(-3, 3), getRandomRange(3, -3));

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
                (15 / sqrt(this.genes.reproduction.level + 1));
        }

        update(gameEngine) {
            // this.x += getRandomInteger(-5, 5);
            // this.y += getRandomInteger(-5, 5);
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.timeSinceLastReproduction += gameEngine.deltaTime;
            if (this.x < 0) {
                this.velocity.x = abs(this.velocity.x);
                this.x = 0;
            }
            if (this.x > params.canvas.width) {
                this.velocity.x = -abs(this.velocity.x);
                this.x = params.canvas.width;
            }
            if (this.y < 0) {
                this.velocity.y = abs(this.velocity.y);
                this.y = 0;
            }
            if (this.y > params.canvas.height) {
                this.velocity.y = -abs(this.velocity.y);
                this.y = params.canvas.height;
            }

            const entitiesToAdd = [];
            gameEngine.entities.forEach(entity => {
                if (entity !== this
                    && entity instanceof Organism
                    && getDistance(this.x, this.y, entity.x, entity.y) < this.radius
                ) {
                    if (this.genes.size.level - 1 > entity.genes.size.level) {
                        entity.removeFromWorld = true;
                    } else if (this.canReproduce() && entity.canReproduce()) {
                        this.children++;
                        const newOrganism = this.reproduce(entity);
                        newOrganism.x = this.x;
                        newOrganism.y = this.y;
                        newOrganism.velocity = new Vector(
                            getRandomRange(3, -3) * (newOrganism.genes.speed.level + 1),
                            getRandomRange(3, -3) * (newOrganism.genes.speed.level + 1),
                        );
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

        draw(ctx) {
            const drawer = _.drawer;
            return drawer(this, ctx);
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