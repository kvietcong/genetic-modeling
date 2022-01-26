const assetManager = new AssetManager();
let gameEngines = [];

const restart = gameEngine => {
    gridExample(gameEngine);
    // geneExample(gameEngine);
}

const gridExample = gameEngine => {
    const width = 8;
    const height = 8;
    gameEngine.addEntity(testHistogram);
    gameEngine.addEntity(new World(width, height));
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