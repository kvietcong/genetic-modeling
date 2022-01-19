/**
 *
 * Organism & Task classes
 * @author KV, Raz and Kumiko
 * @version Rev 1
 *
 */

/**
 * Task class:
 * Creates a single task for an organism
 */
class Task {
    /**
     * Task constructor
     * @param {*} doTaskWith
     * @param {*} village
     */
    constructor(village, organism) {
        this.village = village;
        this.organism = organism;

        this.doTask();
    };

    doTask() {
        for(const task in this.village.taskList){
            

        }

        return null; // return the reward
    };
};

/**
 * Organism class:
 * Creates a single organism
 */
class Organism {
    // TODO
    // Initialize an organism with proper genes
    // No cost system yet (like energy or health)

    /**
     * Constructor for the Organism
     * @param {*} village
     * @param {*} parent
     */
    constructor(village, parent) {
        this.village = village;         // the village that the Organism lives in
        this.parent = parent;           // the parent of the Organism

        // Constants associated with every Organisma
        const NUM_TASKS = 5;            // the number of tasks that the Organism has to do
        const REPRODUCTION_THRESH = 50; // assume this will be the same for every Organism

        // Instance variables
        // Creation of the genes associated with the current organism
        if (this.parent !== null) { // if there's a parent organism
            this.gene = new Gene().recombine(parent.gene, parent.gene); // we're sending two of the of the same
                                                                        // geneome to the recomboer.
        } else {
            this.gene = new Gene(); // if this is the first set of organisms created
        }

        this.learn = 0;                 // how well the organism will learn
        this.taskCapability = 0;        // will be gene + learn
                                        // *****************************************
                                        // We need to figure out how to get the current complete level of the gene
                                        // *****************************************

        this.successes = 0;             // keep track of successes on the tasks
        this.failures = 0;              // will allow percentage calculation
        this.energy = 0;                // energy of the Organism

        this.alive = TRUE;              // sets the organism to be alive
        this.days = 0;                  // the age of the organism in days.

        this.createTaskList(NUM_TASKS); // put this in with the village?

    };

    /**
     * getTaskCapability function
     * @returns the capability of the organism to complete a task
     */
    getTaskCapability() {
        this.taskCapabiilty l=this.learn + this.gene.get(); // this.gene.get() is in place of getting the level of the genes
        return this.taskCapabiilty;l
   }



    // TODO
    // Default to Asexual reproduction but should most likely be overridden
    // for sexual reproduction
    // This should just get the corresponding genes and recombine them
    /**
     * reproduce
     * Will create a new Organism based on the current Organism.
     * @param {*} otherOrganism
     */
    reproduce(otherOrganism = this) {
        if(this.energy >= REPRODUCTION_THRESH) {
            this.energy -= REPRODUCTION_THRESH;
            new Organism(this.village, this);
        }
    };



    /**
     * the organsim will attempt all the tasks in the task list
     * @param {*} num
     */
    doTasks(num) {
        //const successes = this.tasks.map(task => task.doWith(this));
        for(let i = 0; i < num; i++) {
            if(this.taskCapabiilty l> this.taskList[i].getTaskThresh) {
                this.successes++;
                this.energy += this.taskList[i].getReward;
            } else {
                this.failures++;
                this.energy -= this.taskList[i].getTaskThresh;
            }
        }
    };


    /**
     * This will return the success rate of this Organism in completing the tasks
     * @returns the success rate
     */
    getSuccessRate() {
        return this.successes / (this.successes + this.failures);
    };

    /**
     * Add in a soft population cap?
     */
    softPopulationCap() {

    }

    // TODO
    // Determine how to update itself and interact with its environment (the tile)

    // QUESTION: who calls step?

    /**
     * step function will advance the organism by a day every tick
     * @param {*} tile
     * @param {*} grid
     */
    step(tile, grid) {
        // tile.neighbors // This gets neighbors
        const TICK = this.game.clockTick;  // assuming that each tick is a day

        this.days++; // increment the day/age

        // determines the lifespan of an organism
        if(this.days < 36500) { // this would be 100 "years" (365 days * 100 years)
            this.doTasks(NUM_TASKS);
            this.reproduce(); // right now we're working with asexual reproduction so sending this organism.
        } else {
            this.alive = FALSE;
            this.village.removeOrganism(this);
        }
    };
};