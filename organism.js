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
    };

    doTask() {
        let reward = {successes: 0, failures: 0, energy: 0};

        for(let task of this.village.taskList){
            if (task.threshold > this.organism.taskCapability) {
                reward.failures++;
                reward.successes--;
                reward.energy -= task.threshold;
            } else if (task.threshold <= this.organism.taskCapability) {
                reward.failures--;
                reward.successes++;
                reward.energy += task.threshold;
            }
        }
        return reward; // return the reward
    };
};

// Constants associated with every Organism
const NUM_TASKS = 5;            // the number of tasks that the Organism has to do
const REPRODUCTION_THRESH = 50; // assume this will be the same for every Organism

/**
 * Organism class:
 * Creates a single organism
 */
class Organism {
    /**
     * Constructor for the Organism
     * @param {*} village
     * @param {*} parent
     */
    constructor(village, parent) {
        this.village = village;         // the village that the Organism lives in
        this.parent = parent;           // the parent of the Organism

        // Instance variables
        // Creation of the genes associated with the current organism
        if (this.parent) { // if there's a parent organism
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

        this.reward = new Task(this.village, this).doTask();
        this.successes = this.reward.successes;             // keep track of successes on the tasks
        this.failures = this.reward.failures;              // will allow percentage calculation
        this.energy = this.reward.energy;                // energy of the Organism

        this.alive = true;              // sets the organism to be alive
        this.days = 0;                  // the age of the organism in days.

    };

    /**
     * getTaskCapability function
     * @returns the capability of the organism to complete a task
     */
    getTaskCapability() {
        this.taskCapability=this.learn + this.gene.get(); // this.gene.get() is in place of getting the level of the genes
        return this.taskCapability;
    }

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
     */
    step(tile, grid) {
        this.days++; // increment the day/age

        // determines the lifespan of an organism
        if(this.days < 36500) { // this would be 100 "years" (365 days * 100 years)
            this.successes += this.reward.successes;             // keep track of successes on the tasks
            this.failures += this.reward.failures;              // will allow percentage calculation
            this.energy += this.reward.energy;                // energy of the Organism
            this.reproduce(); // right now we're working with asexual reproduction so sending this organism.
        } else {
            this.alive = FALSE;
            this.village.removeOrganism(this);
        }

    };
};