/**
 *
 * Organism & Task classes
 * @author KV, Raz and Kumiko
 * @version Rev 3 - 1/25/2022
 *
 */

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
        this.geneList = [];

        // Instance variables
        // Creation of the genes associated with the current organism
        if (this.parent) { // if there's a parent organism
            for (let i = 0; i < 10; i++) {
                this.geneList.push(new Gene().recombine(parent.geneList[i])); // we're sending two of the of the same
            }                                                     // geneome to the recomboer.                                                            
        } else { // if this is the first set of organisms created
            for (let i = 0; i < 10; i++) {
                this.geneList.push(new Gene()); 
            } 
        } 

        this.learnList = [];
        for (let i = 0; i < 10; i++) {
            this.learnList.push(getRandomInteger(1, 5));  // how well the organism will learn
        } 
           
        this.taskCapabilities = [];
        this.taskCapabilities = this.getTaskCapabilities();        // will be gene + learn

        this.reward = this.village.doTasks(this);

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
    getTaskCapabilities() {
        // this.taskCapability = this.learn + this.gene.level; 
        for (let i = 0; i < 10; i++) {
            this.taskCapabilities.push(this.learnList[i] + this.geneList[i].level);
        }
        return this.taskCapabilities;
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

    // ?????
    improveLearning() {
        // improve with every x successes?
        // improve randomly (e.g., 1%)?
        // learning similar to genetic architecture. Similar to cultural evolution
    };

    /**
     * step function will advance the organism by a day every tick
     */
    step(tile, grid) {

        let live = true;

        // 1% chance of dying
        if (getRandomInteger(1, 100) === 1) {
            live = false;
        }

        // soft age cap using the "percentage" above
        if(live === true) { // this would be 20 (7300) - 60 "years" (365 days * 60 years)
            this.successes += this.reward.successes;           // keep track of successes on the tasks
            this.failures += this.reward.failures;             // will allow percentage calculation
            this.energy += this.reward.energy;                 // energy of the Organism
            this.reproduce();
        } else {                        // if they are 100 or more they "die"
            this.alive = false;
            this.village.removeOrganism(this);
        }

        // Hard age cap
        // if(this.days < 36500) { // this would be 20 (7300) - 60 "years" (365 days * 60 years)
        //     this.successes += this.reward.successes;           // keep track of successes on the tasks
        //     this.failures += this.reward.failures;             // will allow percentage calculation
        //     this.energy += this.reward.energy;                 // energy of the Organism
        //     this.reproduce();
        // } else {                        // if they are 100 or more they "die"
        //     this.alive = false;
        //     this.village.removeOrganism(this);
        // }

        // this.days++; // increment the day/age

    };
};