params.stepsPerSecond = 60;
params.population = 20;

// This represents a "village"
class Village {
    constructor(x, y, grid) {

        this._grid = grid;
        this._pos = Object.freeze({ x, y });

        this.organisms = [];
        this.organismsToAdd = [];

        this.environment = 0;

        this.taskList = [];             // all the tasks associated with the village
        this.numTasks = 5;

        this.populationCap = 10000;

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
            task.reward = getRandomInteger(1, 5);
            task.threshold = getRandomInteger(1, 5);
            this.taskList.push(task);   // adds the task to the task list.
        }
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

    step() {
        if (this.organisms.length < this.populationCap) {
            this.organisms.forEach(organism => organism.step(this, this.grid));

            this.organisms.push(...this.organismsToAdd);
            this.organismsToAdd = [];

            this.organisms = this.organisms.filter(organism => !organism.removeFromWorld);

        } else {
            this._grid.stats();
            gameEngine.stop(); // stop the game when the first village reaches 10k pop
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

    // Step will be a time independent function that advances the sim
    step() {
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
            this.step();
        }
    }

    stats() {
        let populationAverage = 0;
        let populationMax = 0;
        let populationMin = 0;
        let populationTotal = 0;
        let villagePopulations = [];

        for (const row of this.villages) {
            for (const village of row) {
                populationTotal += village.organisms.length;
                populationAverage += village.organisms.length;
                populationMax = max(populationMax, village.organisms.length);
                populationMin = min(populationMin, village.organisms.length);
                villagePopulations.push(village.organisms.length);
            }
        }

        populationAverage = populationAverage / (this.width * this.height);
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
    // Draw the villages somehow (Maybe more opacity when more organisms?)
    draw(ctx) {
        const { width: ctxWidth, height: ctxHeight } = ctx.canvas;
        const size = min(ctxWidth, ctxHeight);
        const drawWidth = size / this.width;
        const drawHeight = size / this.height;

        let populationAverage = 0;
        let populationMax = 0;
        let populationMin = 0;
        let populationTotal = 0;

        for (const row of this.villages) {
            for (const village of row) {
                populationTotal += village.organisms.length;
                populationAverage += village.organisms.length;
                populationMax = max(populationMax, village.organisms.length);
                populationMin = min(populationMin, village.organisms.length);
            }
        }

        populationAverage = populationAverage / (this.width * this.height);

        ctx.fillStyle = "White";
        ctx.font = "18px 'Arial'";

        for (let j = 0; j < this.width; j++) {
            for (let i = 0; i < this.height; i++) {
                const village = this.villages[i][j];
                const environment = village.environment;
                const population = village.organisms.length;

                ctx.fillStyle = "green";
                ctx.fillRect(
                    drawWidth * j, drawHeight * i,
                    drawWidth, drawHeight);

                ctx.strokeStyle = "black";
                ctx.strokeRect(
                    drawWidth * j, drawHeight * i,
                    drawWidth, drawHeight);

                const maxRadius = (min(drawWidth, drawHeight) / 2) * 0.8;
                const radius = round(
                    (population - populationMin)
                    / (populationMax || 1)
                    * maxRadius
                );

                const x = drawWidth * j + drawWidth / 2;
                const y = drawHeight * i + drawHeight / 2;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * PI);
                ctx.fillStyle = "black";
                ctx.fill();
                ctx.fillText(population, x - 45, y + 40);
            }
        }
        
        ctx.fillStyle = "White";
        ctx.font = "60px 'Arial'";
        ctx.fillText("Day " + this.days, 900, 50);
    }

    toString() {
        return this.villages.map(row =>
            row.map(village => village.toString()).join(" "))
            .join("\n");
    }
}