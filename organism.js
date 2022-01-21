/**
 *
 * Organism & Task classes
 * @author KV, Raz and Kumiko
 * @version Rev 2
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

    /**
     * doTasks
     * @returns the rewards object that includes the # successes and failures for all the tasks and the resulting energy
     */
    doTasks() {
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
            this.gene = new Gene().recombine(parent.gene); // we're sending two of the of the same
                                                                        // geneome to the recomboer.
        } else {
            this.gene = new Gene(); // if this is the first set of organisms created
        }

        this.learn = getRandomInteger(1,5);                 // how well the organism will learn

        this.taskCapability = this.getTaskCapability();        // will be gene + learn

        this.reward = new Task(this.village, this).doTasks();

        this.successes = 0;             // keep track of successes on the tasks
        this.failures = 0;              // will allow percentage calculation
        this.energy = 0;                // energy of the Organism

        this.alive = true;              // sets the organism to be alive
        this.days = 0;                  // the age of the organism in days.
    };

    /**
     * getTaskCapability function
     * @returns the capability of the organism to complete a task
     */
    getTaskCapability() {
        this.taskCapability = this.learn + this.gene.level; // this.gene.get() is in place of getting the level of the genes
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
            this.village.addOrganism(new Organism(this.village, this));
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
     * step function will advance the organism by a day every tick
     */
    step(tile, grid) {
        // determines the lifespan of an organism
        let live = true;
        if (getRandomInteger(1, 100) === 1) {
            live = false;
        }
        
        if(live === true) {                               
            this.successes += this.reward.successes;           // keep track of successes on the tasks
            this.failures += this.reward.failures;             // will allow percentage calculation
            this.energy += this.reward.energy;                 // energy of the Organism
            this.reproduce();
        } else {                                               // if they are 100 or more they "die"
            this.alive = false;
            this.village.removeOrganism(this);
        }

        // Hard age cap
        /* if(this.days < 36500 && live === true) {            // 100 year hard age cap
            this.successes += this.reward.successes;           // keep track of successes on the tasks
            this.failures += this.reward.failures;             // will allow percentage calculation
            this.energy += this.reward.energy;                 // energy of the Organism
            this.reproduce();
        } else {                                               // if they are 100 or more they "die"
            this.alive = false;
            this.village.removeOrganism(this);
        } */

        // this.days++; // increment the day/age
    };
};