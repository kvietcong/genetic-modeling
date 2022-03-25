/**
 *
 * Organism & Task classes
 * @author Raz and Kumiko
 * @version Rev 6 - 2/8/2022
 *
 */

// Constants associated with every Organism
const ARR_LEN = 5;              // the number of tasks/genes/learning that the Organism has to do
const REPRODUCTION_THRESH = 50; // assume this will be the same for every Organism
const ELDER_THRESH = 50;        // Organism is considered Elder after 50 days old
const LEARN_THRESH = 15;

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
    constructor(village, parent1, parent2) {
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
            let meme = new Meme();
            this.learnList.push(meme);
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
            this.taskCapabilities.push(this.learnList[i].level + this.geneList[i].level);
        }
        return this.taskCapabilities;
    }

    get learnCapability() {
        let sum = 0;
        for (let i = 0; i < ARR_LEN; i++) {
            sum += this.learnList[i].level;
        }
        return sum;
    }

    /**
     * reproduce
     * Will create a new Organism based on the current Organism.
     * @param {*} otherOrganism
     */
    reproduce(otherOrganism = this) {
        // we might add input where we can put in 0 - 1 values for the percent chance of sexual reproduction or migration.
        // let sexualReproductionStatus = document.getElementById("sexualReproductionBox").checked;

        let migrationChance = random(); // random value between 0 and 1

        if(this.energy >= REPRODUCTION_THRESH && otherOrganism.energy >= REPRODUCTION_THRESH) {
            this.energy -= REPRODUCTION_THRESH / 2; // this.parent1 25
            otherOrganism.energy -= REPRODUCTION_THRESH / 2; // this.parent1 25

            if (migrationChance >= params.migrationThreshold ) { // no migration OR migration but the chance is
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

    // individual learning
    indLearning() {
        // (not) Chance to mutate every "x" successes
        // very low chance of indLearning every tick

        // mutate one Gene in learnList
        let randomGene = chooseRandom(this.learnList);
        randomGene.mutate();
    };

    // social learning - recombining one learn gene
    socLearning() {
        let index = getRandomInteger(0, 4);

        if (params.SLoption === 0) {
            // Random 1-4
            params.SLoption = getRandomInteger(1, 4);
        }
        if (params.SLoption === 1) {
            // 1) Random villager as teacher
            // Recombinging learn gene at index with learn gene at index of a random villager (teacher)

            let randomOrganism = this.village.getRandomOrganism();
            if (randomOrganism != undefined) {
                this.learnList[index].recombine(randomOrganism.learnList[index]);
            }
        } else if (params.SLoption === 2 && this.parent1 != undefined) {
            // 2) Parent
            if (this.parent1 === this.parent2) { // comes from asexual repr
                this.learnList[index].recombine(this.parent1.learnList[index]);
            } else if (this.parent1 != this.parent2) { // comes from sexual repr
                let parentIndex = getRandomInteger(0, 1);
                if (parentIndex === 0) {
                    this.learnList[index].recombine(this.parent1.learnList[index]);
                } else {
                    this.learnList[index].recombine(this.parent2.learnList[index]);
                }
            }
        }
        else if (params.SLoption === 3 && this.days < ELDER_THRESH) {
            // 3) Elder (age is  over 50 ticks)
            let elder = this.village.getElderOrganism();
            if (elder != undefined) {
                this.learnList[index].recombine(elder.learnList[index]);
            }
        } else if (params.SLoption === 4) {
            // 4) Smart people
            let smart = this.village.getSmartOrganism();
            if (smart != undefined) {
                this.learnList[index].recombine(smart.learnList[index]);
            }
        }
    }

    /**
     * step function will advance the organism by a day every tick
     */
    step(tile, grid) {


        // Figure out how to use this.time instead of the count or if it is necessary.
        this.days++;
        // this.time = this.village.grid.getTick;

        // 1% chance of dying
        if (this.alive && random() < 0.01) {
            this.alive = false;
            this.village.removeOrganism(this);
        }

        let sexualReproChance = random();   // random value between 0 and 1


        // soft age cap using the "percentage" above
        if (this.alive) { // this would be 20 (7300) - 60 "years" (365 days * 60 years)
            this.successes += this.reward.successes;            // keep track of successes on the tasks
            this.failures += this.reward.failures;              // will allow percentage calculation
            this.energy += this.reward.energy;
            if (this.village.organisms.length > 100) {
                this.energy -= Math.floor(this.village.organisms.length/100);
            }

            if (sexualReproChance < params.sexualReproThreshold) {     //sexual
                let otherParent = this.village.getFitOrganism();
                let countVillagers = 0;
                while (otherParent === this && countVillagers < this.village.organisms.length) {
                    otherParent = this.village.getFitOrganism();
                    countVillagers++;
                }

                if (this != otherParent) {
                    this.reproduce(otherParent);
                }
            } else { // asexual
                this.reproduce();
            }

            // social learning
            // requires at least 2 organisms in the village
            if (!params.SLcheck) {

                if (params.socialChance != 0 && random() < params.socialChance && this.village.organisms.length > 1) {
                    this.socLearning();
                }

                if (params.socialDays != 0 && this.days % params.socialDays === 0) {
                    this.socLearning();
                }
            }

            // individual learning
            if (!params.ILcheck) {

                if (params.indChance != 0 && random() < params.indChance && this.village.organisms.length > 1) {
                    this.indLearning();
                }

                if (params.indDays != 0 && this.days % params.indDays === 0) {
                    this.indLearning();
                }
            }
        }
    };
};