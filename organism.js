// Look at the comments in `gene.js` for more details on how this code works

/* Default Global Parameters related to Organisms */
params.geneAmount = 1;
params.skills = ["speed", "vision", "reproduction", "size", "health"];
params.maxReproductionTime = 5;
params.fate = 0.0025; // Base chance of death
params.maxOffspringAtOneTime = 8;

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
                organism.genes.reproduction.level / params.initialPartitions * 300,
                organism.genes.speed.level / params.initialPartitions * 300,
                organism.genes.health.level / params.initialPartitions * 300,
                1
            );
            ctx.arc(x, y, organism.radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    };
    /** Default drawing function to display and organism */
    _.drawer = _.drawers.blendDraw;

    class Task {
        constructor(costFunction, taskFunction, arity = 2) {
            this.arity = arity;
            this.costFunction = costFunction;
            this.taskFunction = taskFunction;
        }

        checkInputArity(input) {
            if (input.length !== this.arity) {
                throw new Error(
                    `Expected ${this.arity} organisms,`
                    + ` got ${input.length}`
                );
            }
        }

        getCost(...input) {
            this.checkInputArity(input);
            return this.costFunction(...input);
        }

        doTask(gameEngine, ...input) {
            this.checkInputArity(input);
            return this.taskFunction(gameEngine, ...input);
        }
    }
    _.Task = Task;

    _.tasks = {};
    _.tasks.unary = {};
    _.tasks.unary.required = {
        move: new Task(
            (organism) => pow(organism.genes.size.level + 1, 2),
            (gameEngine, organism) => {
                const newSpeed = organism.direction
                    .scale(organism.genes.speed.level + 3)
                    // Scale speed based on time since last frame
                    .scale(gameEngine.deltaTime * 100);
                organism.x += newSpeed.x;
                organism.y += newSpeed.y;
            },
            1
        ),
        rollDiceOfFate: new Task(
            (organism) => 0,
            (gameEngine, organism) => {
                if (random() < (params.fate / (organism.genes.health.level + 1))
                    && (organism.children || organism.generation)
                ) {
                    organism.removeFromWorld = true;
                }
            },
            1
        ),
    };
    _.tasks.unary.chosen = {};

    _.tasks.binary = {}
    _.tasks.binary.required = {
        // bounceOff: new Task(
        //     (organism1, organism2) => 0,
        //     (gameEngine, organism1, organism2) => {
        //         organism1.direction.scaleInPlace(-1);
        //         organism2.direction.scaleInPlace(-1);
        //     }
        // ),
    }
    _.tasks.binary.chosen = {
        reproduce: new Task(
            (organism1, organism2) => {
                if (organism1.canReproduce() && organism2.canReproduce()) {
                    return 20 /
                        (organism1.genes.reproduction.level
                            + organism2.genes.reproduction.level + 1);
                } else return Infinity;
            },
            (gameEngine, organism1, organism2) => {
                for (let i = 0;
                     i < randomInt(params.maxOffspringAtOneTime);
                     i++
                ) {
                    organism1.children++;
                    organism2.children++;

                    const newOrganism = organism1.reproduce(organism2);
                    newOrganism.x = organism1.x;
                    newOrganism.y = organism1.y;
                    newOrganism.generation = organism1.generation + 1;

                    for (const skill in newOrganism.genes)
                        newOrganism.genes[skill].mutate();

                    gameEngine.addEntity(newOrganism);
                }
                organism1.timeSinceLastReproduction = 0;
                organism2.timeSinceLastReproduction = 0;
            }
        ),
        cannibalize: new Task(
            (organism1, organism2) => {
                if (organism1.genes.size.level - 1 > organism2.genes.size.level) {
                    return -10;
                } else return Infinity;
            },
            (organism1, organism2) => {
                organism2.removeFromWorld = true;
            }
        ),
    }

    class Organism {
        /** {Array<Genes>} A list of genes that the Organism has */
        genes;

        /** {Number} Coordinates for canvas rendering */
        x = 0; y = 0;
        direction = Vector.randomUnitVector();

        // Reproductive Values
        timeSinceLastReproduction = 0;
        children = 0;
        generation = 0;

        // TODO: Add Energy Usage
        energy = 100;

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
            // Update internal values
            this.timeSinceLastReproduction += gameEngine.deltaTime;
            // this.energy += gameEngine.deltaTime * this.genes.speed.level;

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

            // Do Tasks
            // TODO: Add Energy Usage

            // Interact with other entities
            gameEngine.entities.forEach(entity => {
                if (entity !== this
                    && entity instanceof Organism
                    && getDistance(
                        this.x, this.y, entity.x, entity.y) < this.radius
                ) {
                    Object.values(_.tasks.binary.required).forEach(task => {
                        task.doTask(gameEngine, this, entity);
                    });
                    const validTasks = Object.values(_.tasks.binary.chosen)
                        .filter(task =>
                            task.getCost(this, entity) < 100)
                        .sort((task1, task2) =>
                            task1.getCost(this, entity)
                            - task2.getCost(this, entity)
                        )
                    validTasks[0]?.doTask(gameEngine, this, entity);
                }
            });

            // Interact with self
            // Idea: Store data from binary tasks that you then access in the
            // unary tasks. This way you can do things like "I saw a food
            // source (stored in something like `this.detectedFood`) that will
            // now be accounted for in unary tasks."
            Object.values(_.tasks.unary.required).forEach(task => {
                task.doTask(gameEngine, this);
            });
            const validTasks = Object.values(_.tasks.unary.chosen)
                .filter(task =>
                    task.getCost(this) < 100)
                .sort((task1, task2) =>
                    task1.getCost(this)
                    - task2.getCost(this)
                )
            validTasks[0]?.doTask(gameEngine, this);
        }

        draw(ctx, gameEngine, drawer = _.drawer) {
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
    _.Organism = Organism;

    return _;
})();

// General export to have things easily accessible to all other files.
const { Organism, Task } = libOrganism;