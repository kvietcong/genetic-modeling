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

// This represents a "village"
class Village {
    constructor(x, y, grid) {

        this._grid = grid;
        this._pos = Object.freeze({ x, y });

        this.organisms = [];
        this.organismsToAdd = [];

        this.environment = chooseRandom(Object.keys(params.environments));

        this.taskList = [];             // all the tasks associated with the village
        this.numTasks = 10;

        this.populationCap = 800;

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

            if (this.environment === "desert") {
                console.log("org cap; ", organism.taskCapabilities[i], "-- task thresh: ", task.threshold, "-- reward: ", reward)
            }
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
            // console.log("stop game");
            this._grid.stats();
            // gameEngine.stop();
            world.stop(); // stop the game when the first village reaches 10k pop
        }

    }

    getVillagesInRange(start, end) {
        return this._grid.getVillagesInRangeFrom(this, start, end);
    }

    get neighbors() {
        return this.getVillagesInRange(this, 1, 1)
    }

    get x() { return this._pos.x; }
    get y() { return this._pos.y; }
    get grid() { return this._grid; }

    toString() { return `(${this.x}, ${this.y})`; }
}

// This represents the "villages"
class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.timeSinceLastStep = 0;
        this._villages = [];
        this.days = 0;

        // Indexing from top left
        for (let y = 0; y < width; y++) {
            this._villages[y] = [];
            for (let x = 0; x < height; x++) {
                const village = new Village(x, y, this);
                village.populateVillage();
                this._villages[y][x] = village;
            }
        }
    }

    get villages() { return this._villages; }

    getVillage(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error(`Village out of bounds: ${x}, ${y}`);
        }
        return this.villages[y]?.[x];
    }

    // Defaults to direct neighbors
    getVillagesInRangeFrom(village, start = 1, end = 1) {
        const neighbors = [];
        for (let j = -end; j <= end; j++) {
            for (let i = -end; i <= end; i++) {
                if (abs(j) < start && abs(i) < start) continue;
                const n = this.getVillage(village.x + j, village.y + i);
                if (n) neighbors.push(n);
            }
        }
        return neighbors;
    }

    getRandomVillage() {
        const x = randomInt(this.width);
        const y = randomInt(this.height);
        return this.getVillage(x, y);
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

    update(gameEngine) {
        const secondsPerStep = 1 / params.stepsPerSecond;
        this.timeSinceLastStep += gameEngine.deltaTime;

        while (this.timeSinceLastStep > secondsPerStep) {
            this.timeSinceLastStep -= secondsPerStep;
            this.step(gameEngine);
        }
    }

    get stats() {
        let populationMax = 0;
        let populationMin = 0;
        let populationTotal = 0;
        const villagePopulations = [];

        for (const row of this.villages) {
            for (const village of row) {
                const villagePopulation = village.organisms.length;
                populationTotal += villagePopulation;
                populationMax = max(populationMax, villagePopulation);
                populationMin = min(populationMin, villagePopulation);
                villagePopulations.push(villagePopulation);
            }
        }

        const populationAverage = populationTotal / (this.width * this.height);

        return {
            populationAverage, populationMax, populationMin,
            populationTotal, villagePopulations,
        };
    }

    printStats() {
        const {
            populationAverage, populationMax, populationMin,
            populationTotal, villagePopulations
        } = this.stats;

        console.log("Pop total: " + populationTotal);
        console.log("Pop average: " + populationAverage);
        console.log("Pop max: " + populationMax);
        console.log("Pop min: " + populationMin);

        let i = 1;
        for (const population of villagePopulations) {
            console.log("Village " + i + " population: " + population);
            i++;
        }

        console.log("Time taken: " + this.days + " days")
    }

    // TODO
    draw(ctx) {
        const { width: ctxWidth, height: ctxHeight } = ctx.canvas;
        const size = min(ctxWidth, ctxHeight);
        const drawWidth = size / this.width;
        const drawHeight = size / this.height;

        const { populationMax, populationMin } = this.stats;

        ctx.fillStyle = "White";
        ctx.font = "18px 'Arial'";

        for (let j = 0; j < this.width; j++) {
            for (let i = 0; i < this.height; i++) {
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
                ctx.fillStyle = rgba(255, 0, 0, ratio + 0.2);
                ctx.fill();
                ctx.fillStyle = "black";
                ctx.fillText(population, x - 45, y + 40);
            }
        }

        ctx.fillStyle = "Black";
        ctx.font = "60px 'Arial'";
        ctx.fillText("Day " + this.days, 900, 50);
    }

    toString() {
        return this.villages.map(row =>
            row.map(village => village.toString()).join(" "))
            .join("\n");
    }
}