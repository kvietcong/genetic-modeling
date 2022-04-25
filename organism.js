/**
 *
 * Organism & Task classes
 * @author Raz and Kumiko
 * @version 4/13/2022
 *
 */

// Constants associated with every Organism
const ARR_LEN = 5;              // the number of tasks/genes/learning that the Organism has to do

const ELDER_THRESH = 50;        // Organism is considered Elder after 50 days old

// Values that Raz and Kumiko have been changing to see more social evolution
// const LEARN_THRESH = 12;            // We reduced the learn threshold from 15 to 12.
                                    // make this relative by looking at the population average
                                    // first pass take average
                                    // may be a second pass is average of the top half of the average
                                    // second or third pass filter based average

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
        this.learnGeneList = [];  // The learning genes: index 0 = individual and index 1 = social
        this.reproduction_thresh = this.reproductionThresh;

        // Instance variables
        // Creation of the genes associated with the current organism

        if (this.parent1 && this.parent2) {
            for (let i = 0; i < ARR_LEN; i++) {
                const newGene = this.parent1.geneList[i].recombine(this.parent2.geneList[i]);
                newGene.mutate();
                this.geneList.push(newGene);
            }

            for (let i = 0; i < 2; i++) {
                const newLearnGene = this.parent1.learnGeneList[i].recombine(this.parent2.learnGeneList[i]);
                newLearnGene.mutate();
                this.learnGeneList.push(newLearnGene);
            }
        }
        else if (this.parent1) { // if there's a parent1 organism
            for (let i = 0; i < ARR_LEN; i++) {
                const newGene = this.parent1.geneList[i].recombine(this.parent1.geneList[i]);
                newGene.mutate();
                this.geneList.push(newGene);
            }
            for (let i = 0; i < 2; i++) {
                const newLearnGene = this.parent1.learnGeneList[i].recombine(this.parent1.learnGeneList[i]);
                newLearnGene.mutate();
                this.learnGeneList.push(newLearnGene);
            }
        } else { // if this is the first set of organisms created
            // Create the gene list
            for (let i = 0; i < ARR_LEN; i++) {
                this.geneList.push(new Gene());
            }

            // create the learn gene list
            for(let i = 0; i < 2; i++) {
                let learnGene = new Gene();
                this.learnGeneList.push(learnGene);
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

    // Function to calculate the reproduction threshold of the agent.
    get reproductionThresh() {
        let penalty = 0;

        // possibly add averaging between the parents
        if (this.parent1 && this.parent2) {
            for (let i = 0; i < ARR_LEN; i++) {
                penalty += this.parent1.geneList[i].cellCount * params.gene_weight;
                penalty += this.parent2.geneList[i].cellCount * params.gene_weight;
                // penalty += Math.floor((this.parent1.geneList[i].cellCount + this.parent2.geneList[i].cellCount) / 2) * GENE_WEIGHT;
            }

            penalty += this.parent1.learnGeneList[0].cellCount * params.ind_weight;
            penalty += this.parent2.learnGeneList[0].cellCount * params.ind_weight;
            // penalty += Math.floor((this.parent1.learnGeneList[0].cellCount + this.parent2.learnGeneList[0].cellCount) / 2) * IND_WEIGHT;

            penalty += this.parent1.learnGeneList[1].cellCount * params.soc_weight;
            penalty += this.parent2.learnGeneList[1].cellCount * params.soc_weight;
            // penalty += Math.floor((this.parent1.learnGeneList[1].cellCount + this.parent2.learnGeneList[1].cellCount) / 2) * SOC_WEIGHT;
        } else if (this.parent1) {
            for (let i = 0; i < ARR_LEN; i++) {
                penalty += this.parent1.geneList[i].cellCount * params.gene_weight;
            }

            penalty += this.parent1.learnGeneList[0].cellCount * params.ind_weight;

            penalty += this.parent1.learnGeneList[1].cellCount * params.soc_weight;

            penalty *= 2;
        }

        // if no parents (i.e. first generation of organisms), penalty is 0

        return params.reproduction_base + penalty;
    }

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
            console.log(this.learnList[i]);
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

        if(this.energy >= this.reproduction_thresh && otherOrganism.energy >= otherOrganism.reproduction_thresh) {
            this.energy -= this.reproduction_thresh / 2; // this.parent1 25
            otherOrganism.energy -= otherOrganism.reproduction_thresh / 2; // this.parent1 25

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
    socLearning(index, SLoption) {

        if (SLoption === 0) {
            // Random 1-4
            SLoption = getRandomInteger(1, 4);
        }
        if (this.parent1 === undefined || SLoption === 1) { // If there are no parents a random villager will be selected
            // 1) Random villager as teacher
            // Recombining learn gene at index with learn gene at index of a random villager (teacher)

            let randomOrganism = this.village.getRandomOrganism();
            if (randomOrganism != undefined) {
                this.learnList[index] = this.learnList[index].recombine(randomOrganism.learnList[index]).mutate();
            }
        } else if (SLoption === 2 && this.parent1 != undefined) {
            // 2) Parent
            if (this.parent1 === this.parent2) { // comes from asexual repr
                this.learnList[index] = this.learnList[index].recombine(this.parent1.learnList[index]).mutate();
            } else if (this.parent1 != this.parent2) { // comes from sexual repr
                let parentIndex = getRandomInteger(0, 1);
                if (parentIndex === 0) {
                    this.learnList[index] = this.learnList[index].recombine(this.parent1.learnList[index]).mutate();
                } else {
                    this.learnList[index] = this.learnList[index].recombine(this.parent2.learnList[index]).mutate();
                }
            }
        }
        else if (SLoption === 3 && this.days < ELDER_THRESH) {
            // 3) Elder (age is  over 50 ticks)
            let elder = this.village.getElderOrganism();
            if (elder != undefined) {
                this.learnList[index] = this.learnList[index].recombine(elder.learnList[index]).mutate();
            } else {
                this.socLearning(index, 1); // if there are no wise select random villager
            }
        } else if (SLoption === 4) {
            // 4) Smart people
            let smart = this.village.getSmartOrganism();
            if (smart != undefined) {
                this.learnList[index] = this.learnList[index].recombine(smart.learnList[index]).mutate();
            } else {
                this.socLearning(index, 1); // if there are no wise select random villager
            }
        }
    }

    /**
     * step function will advance the organism by a day every tick
     */
    step(tile, grid) {

        // Figure out how to use this.time instead of the count or if it is necessary.
        this.days++;

        // 1% chance of dying - soft age cap
        if (this.alive && random() < 0.01) {
            this.alive = false;
            this.village.removeOrganism(this);
        }

        let sexualReproChance = random();   // random value between 0 and 1

        if (this.alive) { // this would be 20 (7300) - 60 "years" (365 days * 60 years)
            this.successes += this.reward.successes;            // keep track of successes on the tasks
            this.failures += this.reward.failures;              // will allow percentage calculation
            this.energy += this.reward.energy;

            // console.log(" params.softcap_modifier: ", params.softcap_modifier);

            if (this.village.organisms.length > params.softcap_modifier) {  //CHANGES THIS TO A PARAMETER
                this.energy -= Math.floor(this.village.organisms.length/params.softcap_modifier);
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

            // make ticket multipliers fractional and require that the tickets get to a full value .
           
            let socialTickets = this.learnGeneList[1].level * params.soc_learn_ticket_multiplier;
            for(let i = 0; i < socialTickets; i++) {
                let index = getRandomInteger(0, 4);
                this.socLearning(index, params.SLoption);
            }

            let indTickets = this.learnGeneList[0].level * params.ind_learn_ticket_multiplier;
            for(let i = 0; i < indTickets; i++) {
                this.indLearning();
            }
        }
    };
};