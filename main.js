const assetManager = new AssetManager();
let gameEngines = [];

const restart = gameEngine => {
    gridExample(gameEngine);
    // geneExample(gameEngine);
}

const gridExample = gameEngine => {
    // gameEngine.addEntity(testHistogram);

    const rows = 8;
    const columns = 8;
    const world = new World(rows, columns);

    class HistogramManager {
        constructor(histograms) {
            this.histograms = histograms;
            this.selected = { i: 0, j: 0 };
        }

        update(gameEngine) {
            const size = min(gameEngine.width, gameEngine.height);
            const { x, y } = gameEngine.mouse ?? { x: 0, y: 0 };
            const rows = this.histograms.length;
            const cols = this.histograms[0].length;

            const iHover = floor(y / size * rows);
            const jHover = floor(x / size * cols);

            const { i: iOld, j: jOld } = this.selected;
            this.histograms[iOld][jOld].isDrawing = false;
            this.selected = iHover >= 0 && iHover < rows
                                && jHover >= 0 && jHover < cols
                          ? { i: iHover, j: jHover }
                          : { i: iOld, j: jOld };
            const { i, j } = this.selected;
            this.histograms[i][j].isDrawing = true;
        }

        draw(ctx) {}
    }

    const histograms = [];
    for (let i = 0; i < rows; i++) {
        histograms[i] = [];
        for (let j = 0; j < columns; j++) {
            // This histogram helper function can be found in `util.js`
            // More information about parameters is there too.
            const histogram = createOrganismHistogram(

                // Average Gene Level Histogram
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],  // need to give categories
                organism =>
                    floor(average(organism.geneList.map(gene => gene.level))), // need to give it a function

                // Average Learn Level Histogram
                // [1, 2, 3, 4, 5],
                // organism => round(average(organism.learnList)),

                // Where To Draw
                min(gameEngine.width, gameEngine.height), 250,
                550, 460,

                `Histogram for Village ${i}, ${j}`, // Title

                // Updating variables
                world.getVillage(i, j), 10
            );
            histogram.isDrawing = false;

            histograms[i][j] = histogram;
            gameEngine.addEntity(histogram); // For Draw Calls
            world.syncedEntities.push(histogram); // For synced stepping
        }
    }
    gameEngine.addEntity(world);
    gameEngine.addEntity(new HistogramManager(histograms));
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
    simulations.children[simID].scrollIntoView({behavior: "smooth"});
}

const regenerateButtons = () => {
    const buttonList = document.getElementById("buttons");
    while (buttonList.firstChild) {
        buttonList.removeChild(buttonList.firstChild);
    }
    gameEngines.forEach((_, id) => {
        const deletionButton = document.createElement("button");
        deletionButton.innerText = `Delete Sim ${id + 1}`;
        deletionButton.onclick = () => deleteSim(id);

        const scrollToButton = document.createElement("button");
        scrollToButton.innerText = `Scroll To Sim ${id + 1}`;
        scrollToButton.onclick = () => scrollToSim(id);

        const li = document.createElement("li");
        li.appendChild(deletionButton);
        li.appendChild(scrollToButton);
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

        gameEngines.push(gameEngine);

        regenerateButtons();
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