const assetManager = new AssetManager();
let gameEngines = [];

document.getElementById("server-ip").value = params.defaultIP;
attachPropertiesWithCallbacks(connection, [
    ["isConnected", false, connectionStatus => {
        const histogramUploadCurrentElement = document.getElementById("histogramUploadCurrent");
        const histogramUploadAllElement = document.getElementById("histogramUploadAll");
        const serverStatusElement = document.getElementById("serverStatus");
        histogramUploadCurrentElement.disabled = !connectionStatus;
        histogramUploadAllElement.disabled = !connectionStatus;
        serverStatusElement.innerText = connectionStatus ? "Connected" : "Disconnected (Failed to Connect)";
    }]
]);

const restart = gameEngine => {
    gridExample(gameEngine, params.gridSize[0], params.gridSize[1]);
    // geneExample(gameEngine);
}

const gridExample = (gameEngine, rows = 5, columns = 5) => {
    getParams();

    rows = params.worldSize;
    columns = params.worldSize;

    const world = new World(rows, columns);
    const width = params.canvas.width / columns;
    const height = params.canvas.height / rows;

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
                village, 2
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
                village, 2
            );

            const individualHistogram = createOrganismHistogram(
                // Average gene-based learn Level Histogram
                [0, 1, 2, 3, 4, 5],
                organism => organism.learnGeneList[0].level,

                // Where To Draw
                j * width, i * height,
                width, height,

                `Village ${i}, ${j}`, // Title

                // Updating variables
                village, 2
            );

            const socialHistogram = createOrganismHistogram(
                // Average gene-based learn Level Histogram
                [0, 1, 2, 3, 4, 5],
                organism => organism.learnGeneList[1].level,

                // Where To Draw
                j * width, i * height,
                width, height,

                `Village ${i}, ${j}`, // Title

                // Updating variables
                village, 2
            );

            if (!village.spiral) {
                const spiralColor = { color: params.environments[village.environment].color, opacity: 0.75 };
                learnHistogram.backgroundColor = spiralColor;
                geneHistogram.backgroundColor = spiralColor;
                individualHistogram.backgroundColor = spiralColor;
                socialHistogram.backgroundColor = spiralColor;
            } else {
                const color = { color: params.spiralEnvironments[village.environment].color, opacity: 0.75 };
                learnHistogram.backgroundColor = color;
                geneHistogram.backgroundColor = color;
                individualHistogram.backgroundColor = color;
                socialHistogram.backgroundColor = color;
            }

            learnHistogram.isDrawing = false;
            geneHistogram.isDrawing = false;
            individualHistogram.isDrawing = false;
            socialHistogram.isDrawing = false;

            histograms[i][j] = { learn: learnHistogram, gene: geneHistogram, individual: individualHistogram, social: socialHistogram };

            // For Draw Calls
            gameEngine.addEntity(learnHistogram);
            gameEngine.addEntity(geneHistogram);
            gameEngine.addEntity(individualHistogram);
            gameEngine.addEntity(socialHistogram);

            // For synced stepping
            world.syncedEntities.push(learnHistogram);
            world.syncedEntities.push(geneHistogram);
            world.syncedEntities.push(individualHistogram);
            world.syncedEntities.push(socialHistogram);
        }
    }

    const ticksPerGet = 100;
    const dataGetter = (collector) => {
        const villages = world.villages;
        if (!collector.info.data) collector.info.data = [];
        const tick = collector.info.data.length * ticksPerGet;
        const villageData = villages.map(row =>
            row.map(village => ({
                village: {
                    taskList: village.taskList,
                },
                organisms: village.organisms.map(organism => ({
                    age: organism.days,
                    genes: organism.geneList.map(gene => gene.level),
                    learn: organism.learnList.map(meme => meme.level),
                    individual: organism.learnGeneList[0].level,
                    social: organism.learnGeneList[1].level,
                    successes: organism.successes,
                    failures: organism.failures,
                    taskCapabilities: console.log(organism.getTaskCapabilities()),
                }))
            }))
        );
        collector.info.data.push({villageData, tick});
    };
    const collector = new Collector();
    collector.setUpdater(dataGetter, ticksPerGet);
    world.syncedEntities.push(collector);
    params.debugEntities.collector = collector;

    const histogramManager = new HistogramManager(histograms, "gene");
    gameEngine.histogramManager = histogramManager; // Not the best way to do this. TODO: Make this better.
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

    const levelToIndex = params.gene.partitionTooling.levelToIndex;
    const organismSize = params.cellSize
        * (levelToIndex(params.initialPartitions) + 2);
    const padding = params.cellSize * 4;

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

const getParams = () => {
    // reproduction related

    params.reproduction_base = parseFloat(document.getElementById("repBase").value);
    params.gene_weight = parseFloat(document.getElementById("geneWeight").value);
    params.ind_weight = parseFloat(document.getElementById("indWeight").value);
    params.soc_weight = parseFloat(document.getElementById("socWeight").value);

    params.migrationThreshold = parseFloat(document.getElementById("migrationChance").value);
    params.sexualReproThreshold = parseFloat(document.getElementById("sexualRepChance").value);

    // Social Learning Options
    params.ind_learn_ticket_multiplier = parseFloat(document.getElementById("indMultiplier").value);
    params.soc_learn_ticket_multiplier = parseFloat(document.getElementById("socMultiplier").value);

    params.SLradios = document.getElementsByName("socialType"); // this will return an array of the radio buttons

    if (params.SLradios[0].checked) params.SLoption = 0;      // this is for random of all the below options
    else if (params.SLradios[1].checked) params.SLoption = 1; // random villager
    else if (params.SLradios[2].checked) params.SLoption = 2; // parent
    else if (params.SLradios[3].checked) params.SLoption = 3; // elder
    else if (params.SLradios[4].checked) params.SLoption = 4; // wise

    // GENE related

    // mutate
    if (document.getElementById("destroy").checked) {
        params.gene.mutators = (gene) => libGene.mutators.currentLevel.template(gene, libGene.mutators.currentLevel.destroy);
    } else if (document.getElementById("flip").checked) {
        params.gene.mutators = (gene) => libGene.mutators.currentLevel.template(gene, libGene.mutators.currentLevel.flip);
    } else if (document.getElementById("rejuvenate").checked) {
        params.gene.mutators = (gene) => libGene.mutators.currentLevel.template(gene, libGene.mutators.currentLevel.rejuvenate);
    }

    // recombo
    if (document.getElementById("and").checked) {
        params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.AND);
    } else if (document.getElementById("orand").checked) {
        params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.ORAND);
    } else if (document.getElementById("or").checked) {
        params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.OR);
    } else if (document.getElementById("xor").checked) {
        params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.XOR);
    } else if (document.getElementById("nand").checked) {
        params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.NAND);
    } else if (document.getElementById("nor").checked) {
        params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.NOR);
    }

    // Misc Parameters
    params.fillToLevel = parseFloat(document.getElementById("fillToLevelIn").value);
    params.partitionSize = parseFloat(document.getElementById("partitionSize").value);
    params.mutationChance = parseFloat(document.getElementById("mutationChance").value);

    params.worldSize = parseFloat(document.getElementById("worldSi").value);

    // Village Type Option
    params.isolatedVillageOption = document.getElementsByName("villageType"); // this will return an array of the radio buttons

    if (params.isolatedVillageOption[0].checked) params.isolated = true;      // this is for random of all the below options
    else if (params.isolatedVillageOption[1].checked) params.isolated = false; // random villager

    // World Parameters
    if (document.getElementsByName("worldType")[0].checked) {
        params.worldType = 'layered8by8';
        params.worldSize = 8;
    } else if (document.getElementsByName("worldType")[1].checked) {
        params.worldType = 'spiral';
        params.worldSize = 5;
    } else     if (document.getElementsByName("worldType")[2].checked) {
        params.worldType = 'layered';
    } else if (document.getElementsByName("worldType")[3].checked) {
        params.worldType = 'random';
    }
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
