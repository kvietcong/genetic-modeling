params.stepsPerSecond = 60;
params.population = 20;

// play with environments.
params.environments = {
    polarice: {
        name: "polarice",
        color: "white",
        reward: 1,          // want an array of task in each environment with different values
        threshold: [4,4,4,4,4]
    },
    desert: {
        name: "desert",
        color: "yellow",
        reward: 1,
        threshold: [3,3,3,3,3]
    },
    mountains: {
        name : "mountains",
        color: "brown",
        reward: 1,
        threshold: [2,2,2,2,2]
    },
    mediterranean: {
        name: "mediterranean",
        color: "blue",
        reward: 1,          // want an array of task in each environment with different values
        threshold: [1,1,1,1,1]
    },
    rainforest: {
        name : "rainforest",
        color: "green",
        reward: 1,
        threshold: [0, 0,0,0,0]
    },
};

// This represents a "village"
class Village {
    constructor(i, j, grid) {
        this._grid = grid;
        this._pos = Object.freeze({ i, j });

        this.organisms = [];
        this.organismsToAdd = [];

        this.environment = chooseRandom(Object.keys(params.environments));

        this.taskList = [];             // all the tasks associated with the village
        this.numTasks = 5;

        this.populationCap = 1000;

        this.createTaskList();
        this.populateVillage();

    }

    /**
     * createTaskList:
     * will create a list of the tasks that the organism will attempt in a tick if they live in this village.
     */
    createTaskList() {
        for(let i = 0; i < this.numTasks; i++) {
            let task = {reward: 0, threshold: 0};
            if (this.environment === "polarice") {
                task.reward = params.environments.polarice.reward;
                task.threshold = params.environments.polarice.threshold[i];
            }
            else if (this.environment === "desert") {
                 task.reward = params.environments.desert.reward;
                 task.threshold = params.environments.desert.threshold[i];
            }
            else if (this.environment === "mountains") {
                task.reward = params.environments.mountains.reward;
                task.threshold = params.environments.mountains.threshold[i];
            } else if (this.environment === "mediterranean") {
                task.reward = params.environments.mediterranean.reward;
                task.threshold = params.environments.mediterranean.threshold[i];
           }
           else if (this.environment === "rainforest") {
               task.reward = params.environments.rainforest.reward;
               task.threshold = params.environments.rainforest.threshold[i];
           }

            this.taskList.push(task);   // adds the task to the task list.
        }
    };

    doTasks(organism) {
        let reward = {successes: 0, failures: 0, energy: 0};
        let i = 0;

        for(let task of this.taskList){
            if (task.threshold > organism.taskCapabilities[i]) { // doesn't meet threshold
                reward.failures++;
            } else if (task.threshold <= organism.taskCapabilities[i]) {
                reward.successes++;
                reward.energy += task.reward;
            }
            i++;

        }
        return reward; // return the reward
    };

    populateVillage() {
        for (let i = 0; i < params.population; i++ ) {
            this.addOrganism(new Organism(this));
        }
    }

    addOrganism(organism) {
        this.organismsToAdd.push(organism);
    }

    removeOrganism(organism) { organism.removeFromWorld = true; }

    get fitOrganisms() { return this.organisms.filter(organism => organism.energy > REPRODUCTION_THRESH); }
    get elderOrganisms() { return this.organisms.filter(organism => organism.days > ELDER_THRESH); }
    get smartOrganisms() { return this.organisms.filter(organism => organism.learnCapability > LEARN_THRESH); }

    // Organisms should only interact with those in their "village"
    step(world) {

        if (this.organisms.length < this.populationCap) {
            this.organisms.forEach(organism => organism.step(this, this.grid));

            this.organisms.push(...this.organismsToAdd);
            this.organismsToAdd = [];

            this.organisms = this.organisms.filter(organism => !organism.removeFromWorld);

        } else {
            // statistic output
            world.stop(); // stop the game when the first village reaches 10k pop
        }

    }

    getVillagesInRange(start, end) {                                    // zero includes the current village
        return this._grid.getVillagesInRangeFrom(this, start, end);
    }

    get neighbors() {
        return this.getVillagesInRange(this, 1, 1);
    }

    getRandomOrganism() { return chooseRandom(this.organisms); }

    getRandomNeighbor() { return chooseRandom(this.neighbors); }

    // get organisms that meet the reproduction thresholds
    getFitOrganism(){
        return this.fitOrganisms[getRandomInteger(0, this.fitOrganisms.length - 1)];
    }

    getElderOrganism() {
        return this.elderOrganisms[getRandomInteger(0, this.elderOrganisms.length - 1)];
    }

    getSmartOrganism() {
        return this.smartOrganisms[getRandomInteger(0, this.smartOrganisms.length - 1)];
    }

    get i() { return this._pos.i; }
    get j() { return this._pos.j; }
    get grid() { return this._grid; }

    toString() { return `(${this.i}, ${this.j})`; }
}

// This represents the "villages"
class World {
    constructor(rows, columns) {
        this.rows = rows;
        this.columns = columns;
        this.timeSinceLastStep = 0;
        this._villages = [];
        this.days = 0;
        this.syncedEntities = [];
        this.TICK = 0;
        this.isPaused = false;

        // Indexing from top left
        for (let i = 0; i < rows; i++) {
            this._villages[i] = [];
            for (let j = 0; j < columns; j++) {
                const village = new Village(i, j, this);
                village.populateVillage();
                this._villages[i][j] = village;
            }
        }
    }

    get villages() { return this._villages; }

    getVillage(i, j) {
        if (i < 0 || i >= this.rows || j < 0 || j >= this.columns)
            throw new Error(`Village out of bounds: ${i}, ${j}`);
        return this.villages[i][j];
    }

    // Defaults to direct neighbors
    getVillagesInRangeFrom(village, start = 1, end = 1) {
        const neighbors = [];
        for (let i = -end; i <= end; i++) {
            for (let j = -end; j <= end; j++) {
                if (abs(i) < start && abs(j) < start) continue;
                try {
                    const neighbor =
                        this.getVillage(village.i + i, village.j + j);
                    neighbors.push(neighbor);
                } catch (error) { }
            }
        }
        return neighbors;
    }

    getRandomVillage() {
        const i = randomInt(this.rows);
        const j = randomInt(this.columns);
        return this.getVillage(i, j);
    }

    getRandomNeighbor(village) {
        return chooseRandom(this.getVillagesInRangeFrom(village));
    }

    stop() { this.stopped = true; }

    // Step will be a time independent function that advances the sim
    step(gameEngine) {
        if (this.stopped) {
            gameEngine.stop();
            this.printStats();
            return;
        };

        for (const row of this.villages) {
            for (const village of row) {
                village.step(this);
            }
        }
        this.days++;
        this.TICK = gameEngine.clockTick;

    }

    get getTick() {
        return this.TICK;
    }

    get allOrganisms() {
        return Object.freeze(this.villages.reduce((totalAccumulated, row) =>
            totalAccumulated.concat(row.reduce((rowAccumulated, village) =>
                rowAccumulated.concat(village.organisms), [])), []));
    }

    get totalPopulation() {
        return this.allOrganisms.length;
    }

    get populationPerVillage() {
        return Object.freeze(this.villages.map(row =>
            row.map(village => village.organisms.length)));
    }

    update(gameEngine) {
        if (this.isPaused) return;

        const secondsPerStep = 1 / params.stepsPerSecond;
        this.timeSinceLastStep += gameEngine.deltaTime;

        while (this.timeSinceLastStep > secondsPerStep) {
            this.timeSinceLastStep -= secondsPerStep;
            this.step(gameEngine);
            this.syncedEntities.forEach(entity =>
                entity.step(this, gameEngine, secondsPerStep));
        }
    }

    // This notation: get functionName() indicates that what follows is a computed property.
    get stats() {
        const stats = {
            ...this.populationStats,
            // ...this.geneStats,
        };
        return stats;
    }

    get populationStats() {
        let populationMax = 0;
        let populationMin = 0;
        let populationTotal = 0;

        for (const row of this.villages) {
            for (const village of row) {
                const villagePopulation = village.organisms.length;
                populationTotal += villagePopulation;
                populationMax = max(populationMax, villagePopulation);
                populationMin = min(populationMin, villagePopulation);
            }
        }

        const populationAverage = populationTotal / (this.rows * this.columns);

        const populationStats = {
            populationAverage, populationMax, populationMin, populationTotal,
        };
        return populationStats;
    }

    get geneStats() {
        let geneLevelsAll = [];
        const geneLevelAveragesForTaskPerVillage = [];

        for (const [i, row] of this.villages.entries()) {
            geneLevelAveragesForTaskPerVillage[i] = [];
            for (const [j, village] of row.entries()) {
                const villageGenes = village.organisms
                    .map(organism => organism.geneList);
                const geneAmount = villageGenes?.[0]?.length;
                if (!geneAmount) continue;

                const villageGeneLevels = villageGenes
                    .map(geneList => geneList.map(gene => gene.level));
                const villageGeneAverages = range(0, geneAmount - 1)
                    .map(k =>
                        villageGeneLevels.reduce((accumulated, geneLevels) =>
                            accumulated + geneLevels[k], 0)
                    );

                geneLevelAveragesForTaskPerVillage[i][j] = villageGeneAverages;
                geneLevelsAll = geneLevelsAll.concat(villageGeneLevels
                    .reduce((accumulated, geneLevels) =>
                        accumulated.concat(geneLevels), []));
            }
        }

        const geneLevelAverage =  average(geneLevelsAll);
        const geneLevelAveragesPerVillage = geneLevelAveragesForTaskPerVillage
            .map(row => row.map(geneLevels => average(geneLevels)));

        const geneStats = {
            geneLevelAverage, // Average gene level across all organisms (Regardless of Task)
            geneLevelAveragesForTaskPerVillage, // Average gene level for corresponding task per village
            geneLevelAveragesPerVillage, // Average gene level per village (Regardless of Task)
        };
        return geneStats;
    }

    printStats() {
        const {
            populationAverage, populationMax, populationMin, populationTotal
        } = this.stats;

        console.log("Pop total: " + populationTotal);
        console.log("Pop average: " + populationAverage);
        console.log("Pop max: " + populationMax);
        console.log("Pop min: " + populationMin);

        for (let i = 0; i < this.rows; i++)
            for (let j = 0; j < this.columns; j++)
                console.log(`Village @ (${i}, ${j}) has `
                          + `${this.populationPerVillage[i][j]} Organisms`);

        console.log("Time taken: " + this.days + " days")
    }

    draw(ctx) { }

    toString() {
        return this.villages.map(row =>
            row.map(village => village.toString()).join(" "))
            .join("\n");
    }
}