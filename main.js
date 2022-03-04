const assetManager = new AssetManager();
let gameEngines = [];

const restart = gameEngine => {
    gridExample(gameEngine);
    // geneExample(gameEngine);
}

const gridExample = (gameEngine, rows = 8, columns = 8) => {
    const world = new World(rows, columns);
    const width = params.canvas.width / columns;
    const height = params.canvas.height / rows;

    class HistogramManager {
        constructor(histograms, type = "learn") {
            this.histograms = histograms;
            this.histogramType = type;

            this.histogramSelectorElement =
                document.getElementById("histogramType");
            if (this.histogramSelectorElement)
                this.histogramSelectorElement.addEventListener("change",
                    event => this.histogramType = event.target.value);
        }

        get histogramType() { return this._histogramType; }
        set histogramType(type) {
            if (!this._histogramType) this._histogramType = type;

            for (const row of this.histograms) {
                for (const histogramInfo of row) {
                    histogramInfo[this.histogramType].isDrawing = false;
                }
            }
            for (const row of this.histograms) {
                for (const histogramInfo of row) {
                    if (!(type in histogramInfo))
                        throw new Error(`Invalid histogram index: ${type}`);
                    histogramInfo[type].isDrawing = true;
                }
            }

            this._histogramType = type;

            if (this.histogramSelectorElement)
                this.histogramSelectorElement.value = this.histogramType;
        }
    }

    const histograms = [];
    for (let i = 0; i < rows; i++) {
        histograms[i] = [];
        for (let j = 0; j < columns; j++) {
            const village = world.getVillage(i, j);

            // This histogram helper function can be found in `util.js`
            // More information about parameters is there too.
            const learnHistogram = createOrganismHistogram(
                // Average gene-based learn Level Histogram
                [0, 1, 2, 3, 4, 5],
                organism =>
                    floor(average(organism.learnList.map(gene => gene.level))),

                // Where To Draw
                j * width, i * height,
                width, height,

                `Village ${i}, ${j}`, // Title

                // Updating variables
                village, 1
            );
            
            const geneHistogram = createOrganismHistogram(
                // Average Gene Level Histogram
                range(0, params.initialPartitions),
                organism =>
                    floor(average(organism.geneList.map(gene => gene.level))),

                // Where To Draw
                j * width, i * height,
                width, height,

                `Village ${i}, ${j}`, // Title

                // Updating variables
                village, 1
            );
            learnHistogram.backgroundColor = { color: params.environments[village.environment].color, opacity: 0.1 };
            geneHistogram.backgroundColor = { color: params.environments[village.environment].color, opacity: 0.1 };
            learnHistogram.isDrawing = false;
            geneHistogram.isDrawing = false;

            histograms[i][j] = { learn: learnHistogram, gene: geneHistogram };
            gameEngine.addEntity(learnHistogram); // For Draw Calls
            gameEngine.addEntity(geneHistogram); // For Draw Calls
            world.syncedEntities.push(learnHistogram); // For synced stepping
            world.syncedEntities.push(geneHistogram); // For synced stepping
        }
    }
    const histogramManager = new HistogramManager(histograms, "gene");
    params.debugEntities.histogramManager = histogramManager;
    params.debugEntities.world = world;
    gameEngine.addEntity(histogramManager);
    gameEngine.addEntity(world);
};

const geneExample = gameEngine => {
    const genes = [];
    for (let i = 0; i < 16; i++) {
        genes[i] = [];
        for (let j = 0; j < 28; j++) {
            genes[i][j] = i == 0
                ? new Gene()
                : genes[i-1][j].recombine(
                    genes[i-1][getRandomInteger(0, genes[0].length-1)]);
            if (i !== 0) genes[i][j].mutate();
        }
    }

    const levelToIndex = libGene.partitionTooling.levelToIndex;
    const organismSize = params.cellDrawSize
        * (levelToIndex(params.initialPartitions) + 2);
    const padding = params.cellDrawSize * 4;

    for (const [i, row] of genes.entries()) {
        for (const [j, gene] of row.entries()) {
            gene.x = j * (organismSize + padding);
            gene.y = i * (organismSize + padding);
            gameEngine.addEntity(gene);
        }
    }
}

// DOM Manipulation
// There's probably a memory leak somewhere XD

const deleteSim = simID => {
    gameEngines[simID].stop();
    gameEngines = gameEngines.filter((_, id) => id !== simID);

    const simulations = document.getElementById("simulations");
    simulations.removeChild(simulations.childNodes[simID]);

    regenerateButtons();
};

const scrollToSim = simID => {
    const simulations = document.getElementById("simulations");
    simulations.children[simID].scrollIntoView({behavior: "smooth", block: "start"});
};

const pausePlayEngine = simID => gameEngines[simID].isPaused = !gameEngines[simID].isPaused;

const pausePlaySim = simID => gameEngines[simID]
    .entities
    .filter(e => e instanceof World)
    .forEach(world => world.isPaused = !world.isPaused);

const regenerateButtons = () => {
    const buttonList = document.getElementById("buttons");

    while (buttonList.firstChild) {
        buttonList.removeChild(buttonList.firstChild);
    }

    gameEngines.forEach((gameEngine, id) => {
        gameEngine.id = id; // Update Game Engine ID

        const deletionButton = document.createElement("button");
        deletionButton.innerText = `Delete Sim ${id}`;
        deletionButton.onclick = () => deleteSim(id);
        deletionButton.id = `delete-sim-${id}`;

        const pausePlayEngineButton = document.createElement("button");
        pausePlayEngineButton.innerText = `Pause/Play Engine ${id}`;
        pausePlayEngineButton.onclick = () => pausePlayEngine(id);
        pausePlayEngineButton.id = `pause-play-engine-${id}`;

        const pausePlaySimButton = document.createElement("button");
        pausePlaySimButton.innerText = `Pause/Play Sim ${id}`;
        pausePlaySimButton.onclick = () => pausePlaySim(id);
        pausePlaySimButton.id = `pause-play-sim-${id}`;

        const scrollToButton = document.createElement("button");
        scrollToButton.innerText = `Scroll To Sim ${id}`;
        scrollToButton.onclick = () => scrollToSim(id);
        scrollToButton.id = `scroll-to-sim-${id}`;

        const avgFPS = document.createElement("p");
        avgFPS.innerHTML = `<strong>Avg FPS: <span id="avg-fps-${id}">?</span></strong>`;
        avgFPS.style = "color: red; font-size: 1em;";

        const fps = document.createElement("p");
        fps.innerHTML = `<strong>FPS: <span id="fps-${id}">?</span></strong>`;
        fps.style = "color: red; font-size: 1em;";

        const li = document.createElement("li");
        li.appendChild(deletionButton);
        li.appendChild(scrollToButton);
        li.appendChild(pausePlayEngineButton);
        li.appendChild(pausePlaySimButton);
        li.appendChild(avgFPS);
        li.appendChild(fps);
        buttonList.appendChild(li);
    });
};

const addSim = () => {
    assetManager.downloadAll(() => {
        const gameEngine = new GameEngine();
        const ctx = initCanvas();

        gameEngine.init(ctx);
        restart(gameEngine);
        gameEngine.start();

        const id = gameEngines.length;
        gameEngines.push(gameEngine);

        regenerateButtons();

        const timer = new DebugFrameTimer(null, false);
        timer.attachTo(gameEngine, "draw");
        timer.updateAverageFPSElement(`avg-fps-${id}`);
        timer.updateFPSElement(`fps-${id}`);
    });
}

const nuke = () => {
    const simulations = document.getElementById("simulations");
    while (simulations.firstChild) {
        simulations.removeChild(simulations.firstChild);
    }
    gameEngines.forEach(gameEngine => gameEngine.stop());
    gameEngines = [];
    regenerateButtons();
}

addSim();