// Look at the comments in `gene.js` for more details on how this code works

// BIG BUG: Sims sometimes just spazz and delete all the organisms.

/* Default Global Parameters related to Organisms */
params.geneAmount = 1;
params.skills = ["speed", "vision", "reproduction", "size", "health"];
params.maxReproductionTime = 6;
params.fate = 0.0001; // Base chance of death
params.maxOffspringAtOneTime = 5;

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
                organism.genes.reproduction.level / params.initialPartitions * 350,
                organism.genes.speed.level / params.initialPartitions * 350,
                organism.genes.health.level / params.initialPartitions * 350,
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

        // I don't like this. Need to discuss possible ideas to make this better
        getInfo(gameEngine, ...input) {
            this.checkInputArity(input);
            const cost = this.costFunction(gameEngine, ...input);
            const doTask = () => this.taskFunction(cost, gameEngine, ...input);
            return [cost, doTask];
        }
    }
    _.Task = Task;

    _.tasks = {};
    _.tasks.unary = {};
    _.tasks.unary.required = {
        move: new Task(
            (gameEngine, organism) => {
                const cost = sq(organism.genes.speed.level + 1)
                           * (organism.genes.size.level + 1);
                return cost * gameEngine.deltaTime;
             },
            (cost, gameEngine, organism) => {
                const newSpeed = organism.direction
                    .scale(organism.genes.speed.level + 3)
                    // Scale speed based on time since last frame
                    .scale(gameEngine.deltaTime * 100);
                organism.x += newSpeed.x;
                organism.y += newSpeed.y;

                organism.energy -= cost;
            },
            1
        ),
        metabolize: new Task(
            (gameEngine, organism) => Object.values(organism.genes).reduce(
                (cost, gene) => cost * (gene.level + 1), 1
            ) * gameEngine.deltaTime,
            (cost, gameEngine, organism) => {
                organism.energy -= cost;
            },
            1
        ),
        rollDiceOfFate: new Task(
            _ => 0,
            (cost, gameEngine, organism) => {
                let fate = params.fate;
                // Greater health means you don't die as much.
                fate /= organism.genes.health.level + 1;
                // Low energy means you are more likely to die.
                fate += (organism.energy < 10) ? 0.05 : 0;
                fate = (organism.energy < 0) ? Infinity : fate;
                if ((random() < fate)
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
        bounceOff: new Task(
            (gameEngine, organism1, organism2) => 0.1,
            (cost, gameEngine, organism1, organism2) => {
                const distance = getDistance(
                    organism1.x, organism1.y,
                    organism2.x, organism2.y
                );
                const delta = organism1.radius + organism2.radius - distance;
                const difX = (organism1.x - organism2.x) / distance;
                const difY = (organism1.y - organism2.y) / distance;

                organism1.x += difX * delta / 2;
                organism1.y += difY * delta / 2;
                organism2.x -= difX * delta / 2;
                organism2.y -= difY * delta / 2;

                const temp = {
                    x: organism1.direction.x, y: organism1.direction.y
                };
                organism1.direction.x = organism2.direction.x;
                organism1.direction.y = organism2.direction.y;
                organism2.direction.x = temp.x;
                organism2.direction.y = temp.y;

                organism1.energy -= cost;
                organism2.energy -= cost;
            }
        ),
    }
    _.tasks.binary.chosen = {
        // BUG: Cost only goes to the initiator
        reproduce: new Task(
            (gameEngine, organism1, organism2) => {
                const canReproduce = organism => {
                    const refractoryPeriod = params.maxReproductionTime
                        / sqrt(organism.genes.reproduction.level + 1);
                    return refractoryPeriod
                                <= organism.timeSinceLastReproduction;
                }
                if (canReproduce(organism1) && canReproduce(organism2)) {
                    return 50 /
                        (organism1.genes.reproduction.level
                            + organism2.genes.reproduction.level + 1);
                } else return Infinity;
            },
            (cost, gameEngine, organism1, organism2) => {
                for (
                    let i = 0;
                    i <= randomInt(params.maxOffspringAtOneTime);
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

                organism1.energy -= cost;
                organism2.energy -= cost;
            }
        ),
        cannibalize: new Task(
            (gameEngine, organism1, organism2) => {
                return ((organism1.genes.size.level - 1)
                            > organism2.genes.size.level) ? -20 : Infinity;
            },
            (cost, organism1, organism2) => {
                organism1.energy -= cost;
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

        update(gameEngine) {
            // Update internal values
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

            // Do Tasks
            this.shortTermMemory = {};

            // Interact with other entities
            gameEngine.entities.forEach(entity => {
                if (entity.removeFromWorld) return;
                if (entity === this) return;
                if (!(entity instanceof Organism)) return;
                const distance = getDistance(this.x, this.y, entity.x, entity.y);
                if (distance >= (this.radius + entity.radius)) return;

                Object.values(_.tasks.binary.required).forEach(task => {
                    const [cost, doTask] =
                        task.getInfo(gameEngine, this, entity);
                    if ((cost <= this.energy)
                        && (cost <= entity.energy)) doTask()
                });
                const validTasks = Object.values(_.tasks.binary.chosen)
                    .reduce((accumulated, task) => {
                        accumulated.push(task.getInfo(gameEngine, this, entity));
                        return accumulated;
                    }, [])
                    .filter(([cost, doTask]) => (cost <= this.energy)
                                             && (cost <= entity.energy));
                const randomTask = chooseRandom(validTasks);
                randomTask?.[1]();
            });

            // Interact with self
            // Idea: Store data from binary tasks that you then access in the
            // unary tasks. This way you can do things like "I saw a food
            // source (stored in something like `this.detectedFood`) that will
            // now be accounted for in unary tasks."
            Object.values(_.tasks.unary.required).forEach(task => {
                const [cost, doTask] = task.getInfo(gameEngine, this);
                if (cost <= this.energy) doTask()
            });

            // Regenerate Energy
            this.energy +=
                (this.genes.size.level + 1)
                * sq(this.genes.health.level + 1)
                * gameEngine.deltaTime;
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