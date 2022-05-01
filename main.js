const connection = {};

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

let socket;
const establishSocket = ipString => {
    if (!ipString) ipString = params.defaultIP;
    console.log(ipString)
    socket = io.connect(ipString, { reconnection: false });
    connection.socket = socket;
    connection.isConnected = false;

    socket.on("connect", _ => {
        connection.isConnected = true;
        console.log("Connected to the server.");
    });
    socket.on("connect_error", _ => {
        connection.isConnected = false;
        console.error("Failed to connect the server!");
    });
    socket.on("disconnect", _ => {
        connection.isConnected = false;
        console.log("Disconnected from the server.");
    });
    socket.on("log", console.log);
};
establishSocket();
document.getElementById("server-ip").value = params.defaultIP;

const assetManager = new AssetManager();
let gameEngines = [];

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

    class HistogramManager {
        types = ["learn", "gene", "individual", "social"];

        constructor(histograms, type = "learn") {
            this.histograms = histograms;
            this.histogramType = type;

            this.histogramSelectorElement =
                document.getElementById("histogramType");
            if (this.histogramSelectorElement)
                this.histogramSelectorElement.addEventListener("change",
                    event => this.histogramType = event.target.value);

            this.histogramCollectionRateElement =
                document.getElementById("histogramCollectionRate");
            if (this.histogramCollectionRateElement)
                this.histogramCollectionRateElement.addEventListener("change",
                    event => this.collectionRate = event.target.value);

            this.histogramDrawLastElement =
                document.getElementById("histogramDrawLast");
            if (this.histogramDrawLastElement)
                this.histogramDrawLastElement.addEventListener("change",
                    event => this.drawLast = Number(event.target.value));

            this.histogramDownloadCurrentElement = document.getElementById("histogramDownloadCurrent");
            if (this.histogramDownloadCurrentElement)
                this.histogramDownloadCurrentElement.addEventListener("click", _ => this.downloadCSVForType());

            this.histogramDownloadAllElement = document.getElementById("histogramDownloadAll");
            if (this.histogramDownloadAllElement)
                this.histogramDownloadAllElement.addEventListener("click", _ => this.downloadCSVForAllTypes());

            this.histogramUploadCurrentElement = document.getElementById("histogramUploadCurrent");
            if (this.histogramUploadCurrentElement)
                this.histogramUploadCurrentElement.addEventListener("click", _ => this.uploadForType());

            this.histogramUploadAllElement = document.getElementById("histogramUploadAll");
            if (this.histogramUploadAllElement)
                this.histogramUploadAllElement.addEventListener("click", _ => this.uploadForAllTypes());

            this.drawLast = histograms[0][0][type].drawLast;
            this.collectionRate = histograms[0][0][type].unitTimePerUpdate;
        }

        get collectionRate() { return this._collectionRate; }
        set collectionRate(collectionRate) {
            this._collectionRate = collectionRate;
            for (const row of this.histograms) {
                for (const histogramInfo of row) {
                    this.types.forEach(type =>
                        histogramInfo[type].unitTimePerUpdate = collectionRate);
                }
            }
            this.histogramCollectionRateElement.value = this.collectionRate;
        }

        get drawLast() { return this._drawLast; }
        set drawLast(drawLast) {
            this._drawLast = drawLast;
            for (const row of this.histograms) {
                for (const histogramInfo of row) {
                    this.types.forEach(type =>
                        histogramInfo[type].drawLast = drawLast);
                }
            }
            this.histogramDrawLastElement.value = this.drawLast;
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

        toCSVTextArray(type) {
            type = type ?? this.histogramType;
            const csvTextArray = [];
            for (const [i, row] of this.histograms.entries()) {
                csvTextArray[i] = [];
                for (const [j, histogramInfo] of row.entries()) {
                    csvTextArray[i][j] = histogramInfo[type].toCSVText();
                }
            }
            return csvTextArray;
        }

        downloadZip(zip) {
            console.log("Beginning to Zip");
            let lastProgress = -1;
            zip.generateAsync(
                {
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: {
                        level: 9,
                    },
                },
                metadata => {
                    let newProgress = floor(metadata.percent.toFixed(0) / 5) * 5;
                    if (lastProgress === newProgress) return;
                    lastProgress = newProgress;
                    console.log(`Zipping Progress: ${metadata.percent.toFixed(0)}%`)
                },
            ).then(content => {
                const currentDate = new Date();
                const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}-${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
                const allCSVData = new Blob([content]);
                const url = URL.createObjectURL(allCSVData);
                const link = document.createElement("a");
                link.href = url;
                link.target = "_blank";
                link.download = `${dateString}.zip`;
                link.click();
            });
        }

        downloadCSVForType(type) {
            const zip = new JSZip();
            for (const [i, row] of this.toCSVTextArray(type).entries()) {
                for (const [j, csvData] of row.entries()) {
                    zip.file(`${i}.${j}.csv`, csvData);
                }
            }
            this.downloadZip(zip);
        }

        downloadCSVForAllTypes() {
            const zip = new JSZip();
            for (const type of this.types) {
                for (const [i, row] of this.toCSVTextArray(type).entries()) {
                    for (const [j, csvData] of row.entries()) {
                        zip.folder(type).file(`${i}.${j}.csv`, csvData);
                    }
                }
            }
            this.downloadZip(zip);
        }

        uploadForType(type) {
            type = type ?? this.histogramType;
            let ticks = 0;
            const data = this.histograms.reduce((acc, row, i) => {
                acc.push([]);
                row.forEach((histogramInfo, j) => {
                    acc[i][j] = histogramInfo[type].allCounts.slice();
                    ticks = ticks || acc[i][j].length;
                });
                return acc;
            }, []);

            const payload = {
                db: "genetic-modeling",
                collection: "histogramData",
                data: {
                    data,
                    type,
                    ticks,
                    date: new Date(),
                },
            };

            if (connection.isConnected) socket.emit("insert", payload);
            else alert("NOT CONNECTED");
        }

        uploadForAllTypes() { this.types.forEach(type => this.uploadForType(type)); }
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