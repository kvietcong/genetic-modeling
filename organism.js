/**
 *
 * Organism & Task classes
 * @author KV, Raz and Kumiko
 * @version Rev 4 - 2/1/2022
 *
 */

// Constants associated with every Organism
const ARR_LEN = 5;            // the number of tasks/genes/learning that the Organism has to do
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
            for (let i = 0; i < ARR_LEN; i++) {
                const newGene = this.parent1.geneList[i].recombine(this.parent2.geneList[i]);
                newGene.mutate();
                this.geneList.push(newGene);
            }
        }
        else if (this.parent1) { // if there's a parent1 organism
            for (let i = 0; i < ARR_LEN; i++) {
                const newGene = this.parent1.geneList[i].recombine(this.parent1.geneList[i]);
                newGene.mutate();
                this.geneList.push(newGene);
            }                                                     // geneome to the recomboer.
        } else { // if this is the first set of organisms created
            for (let i = 0; i < ARR_LEN; i++) {
                this.geneList.push(new Gene());
            }
        }

        this.learnList = [];
        for (let i = 0; i < ARR_LEN; i++) {
            this.learnList.push(0);  // how well the organism will start with no learning
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
        for (let i = 0; i < ARR_LEN; i++) {
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

        // we might add input where we can put in 0 - 1 values for the percent chance of sexual reproduction or migration.
        // let sexualReproductionStatus = document.getElementById("sexualReproductionBox").checked;

        let migrationChance = random(); // random value between 0 and 1
        let migrationThreshold = 1.0;   // 20% chance of migration
                                        // adjust with different levels.

        if(this.energy >= REPRODUCTION_THRESH && otherOrganism.energy >= REPRODUCTION_THRESH) {
            this.energy -= REPRODUCTION_THRESH / 2; // this.parent1 25
            otherOrganism.energy -= REPRODUCTION_THRESH / 2; // this.parent1 25

            if (!migrationStatus || migrationChance >= migrationThreshold) { // no migration OR migration but the chance is
                    this.village.addOrganism(new Organism(this.village, this, otherOrganism));
            } else { // migration checked on and migration condition met
                    let ranVillage = this.village.getRandomNeighbor();
                    this.village.addOrganism(new Organism(ranVillage, this, otherOrganism));
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

        // 1% chance of dying
        let live = true;
        if (random() < 0.01) {
            live = false;
        }

        let sexualReproChance = random();   // random value between 0 and 1
        let sexualReproThreshold = 0.5;     // 50% chance of sexual reproduction
                                            // adjust with different levels.

        // soft age cap using the "percentage" above
        if(live === true) { // this would be 20 (7300) - 60 "years" (365 days * 60 years)
            this.successes += this.reward.successes;            // keep track of successes on the tasks
            this.failures += this.reward.failures;              // will allow percentage calculation
            this.energy += this.reward.energy;                  // energy of the Organism

            if (sexualReproChance < sexualReproThreshold) {     //sexual
                this.reproduce(this.village.getFitOrganism());
            } else { // asexual
                this.reproduce();
            }

        } else {                                                // if they are 100 or more they "die"
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