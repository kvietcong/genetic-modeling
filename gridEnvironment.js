params.stepsPerSecond = 10;
params.population = 20;

params.environments = {
    snow: {
        name: "snow",
        color: "white",
        reward: 1,
        threshold: 5
    },
    desert: {
        name: "desert",
        color: "yellow",
        reward: 3,
        threshold: 3
    },
    forest: {
        name : "forest",
        color: "green",
        reward: 5,
        threshold: 1
    },
};

// const organisms = ["..."];
// const reproducing = organisms.filter(organism => organism.energy > REPRODUCTION_THRESH);

// This represents a "village"
class Village {
    constructor(i, j, grid) {
        this._grid = grid;
        this._pos = Object.freeze({ i, j });

        this.organisms = [];
        this.organismsToAdd = [];

        this.environment = chooseRandom(Object.keys(params.environments));

        this.taskList = [];             // all the tasks associated with the village
        this.numTasks = 10;

        this.populationCap = 500;

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
            if (this.environment === "snow") {
                task.reward = params.environments.snow.reward;
                task.threshold = params.environments.snow.threshold;
            } else if (this.environment === "desert") {
                task.reward = params.environments.desert.reward;
                task.threshold = params.environments.desert.threshold;
            } else if (this.environment === "forest") {
                task.reward = params.environments.forest.reward;
                task.threshold = params.environments.forest.threshold;
            }
            this.taskList.push(task);   // adds the task to the task list.
        }
    };

    doTasks(organism) {
        let reward = {successes: 0, failures: 0, energy: 0};
        let i = 0;

        for(let task of this.taskList){
            if (task.threshold > organism.taskCapabilities[i]) {
                reward.failures++;
                reward.energy -= task.threshold;
            } else if (task.threshold <= organism.taskCapabilities[i]) {
                reward.successes++;
                reward.energy += task.threshold;
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

    getVillagesInRange(start, end) {
        return this._grid.getVillagesInRangeFrom(this, start, end);
    }

    get neighbors() {
        return this.getVillagesInRange(this, 1, 1)
    }

    getRandomOrganism() { return chooseRandom(this.organisms); }

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
                const n = this.getVillage(village.i + i, village.j + j);
                if (n) neighbors.push(n);
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
        return chooseRandom(this.getAllNeighbors(village));
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

    // TODO
    draw(ctx) {
        const { width: ctxWidth, height: ctxHeight } = ctx.canvas;
        const size = min(ctxWidth, ctxHeight);
        const drawWidth = size / this.columns;
        const drawHeight = size / this.rows;

        const { populationMax, populationMin } = this.stats;

        ctx.fillStyle = "White";
        ctx.font = "18px 'Arial'";

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                const village = this.villages[i][j];
                const environment = village.environment;
                const population = village.organisms.length;

                ctx.fillStyle = params.environments[environment].color;
                ctx.fillRect(
                    drawWidth * j, drawHeight * i,
                    drawWidth, drawHeight);

                ctx.strokeStyle = "black";
                ctx.strokeRect(
                    drawWidth * j, drawHeight * i,
                    drawWidth, drawHeight);

                const ratio = (population - populationMin) / (populationMax || 1);
                const maxRadius = (min(drawWidth, drawHeight) / 2) * 0.8;
                const radius = round(ratio * maxRadius);

                const x = drawWidth * j + drawWidth / 2;
                const y = drawHeight * i + drawHeight / 2;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * PI);
                ctx.fillStyle = rgba(0, 0, 0, ratio + 0.2);
                ctx.fill();
                ctx.fillStyle = "black";
                ctx.fillText(population, x - 45, y + 40);
            }
        }

        ctx.fillStyle = "Green";
        ctx.font = "60px 'Arial'";
        ctx.fillText("Day " + this.days, 740, 50);
        ctx.fillText("Migration: " + document.getElementById("migrationBox").checked, 740, 120);
        ctx.fillText("Sexual repr: " + document.getElementById("sexualReproductionBox").checked, 740, 190);
    }

    toString() {
        return this.villages.map(row =>
            row.map(village => village.toString()).join(" "))
            .join("\n");
    }
}