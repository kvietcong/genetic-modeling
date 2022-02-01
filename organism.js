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
     * @param {*} parent1
     */
    constructor(village, parent1, parent2 = false) {
        this.village = village;         // the village that the Organism lives in
        this.parent1 = parent1;           // the parent1 of the Organism
        this.parent2 = parent2;
        this.geneList = [];

        // Instance variables
        // Creation of the genes associated with the current organism
        if (this.parent1 && this.parent2) {
            for (let i = 0; i < 10; i++) {
                this.geneList.push(this.parent1.geneList[i].recombine(this.parent2.geneList[i]));
            }
        }
        else if (this.parent1) { // if there's a parent1 organism
            for (let i = 0; i < 10; i++) {
                this.geneList.push(new Gene().recombine(this.parent1.geneList[i])); // we're sending two of the of the same
            }                                                     // geneome to the recomboer.
        } else { // if this is the first set of organisms created
            for (let i = 0; i < 10; i++) {
                this.geneList.push(new Gene());
            }
        }

        this.learnList = [];
        for (let i = 0; i < 10; i++) {
            this.learnList.push(getRandomInteger(1,5));  // how well the organism will learn
            // this.learnList.push(1);  // how well the organism will learn
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
        let migrationStatus = document.getElementById("migrationBox").checked;
        let sexualReproductionStatus = document.getElementById("sexualReproductionBox").checked;

        // use real values math.random() will return 0-1
        // let migrationChance = getRandomInteger(1, 10);
        let migrationChance = random();
        let migrationThreshold = .2; // 20% chance of migration
                                     // adjust with different levels.


        // cost to create offspring same with asexual and sexual reproduction.
        // so split cost between 2 parents - equal (default) or unequal (similar to humans - if we do this, we might need two sexes)
        // allow random asexual and sexual reproduction within a single sim (e.g., bacteria, some type of fish, plant world)
        // Give the option for selection of three options
        //
        if(this.energy >= REPRODUCTION_THRESH && otherOrganism.energy >= REPRODUCTION_THRESH) {
            this.energy -= REPRODUCTION_THRESH;
            otherOrganism.energy -= REPRODUCTION_THRESH;

            if (!migrationStatus || migrationChance > migrationThreshold) { // no migration OR migration but the chance is
                if (!sexualReproductionStatus) {
                    this.village.addOrganism(new Organism(this.village, this)); // asexual
                } else {
                    this.village.addOrganism(new Organism(this.village, this, otherOrganism)); // sexual
                }
            } else { // migration checked on and migration condition met
                if (!sexualReproductionStatus) {
                    this.village.addOrganism(new Organism(this.village.getVillagesInRange(1, 1)), this); // asexual
                } else {
                    this.village.addOrganism(new Organism(this.village.getVillagesInRange(1, 1)), this, otherOrganism); // sexual
                }
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
            let other = this.village.getRandomOrganism();
            // if (this.energy >= REPRODUCTION_THRESH && other.energy >= REPRODUCTION_THRESH) {}
            this.reproduce(this.village.getRandomOrganism()); // changed from reproduce() to sexual reproduction
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