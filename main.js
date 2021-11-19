const ASSET_MANAGER = new AssetManager();
let gameEngines = [];
class OrganismStats {
    constructor() { this.averages = {}; }

    update(gameEngine) {
        this.averages = gameEngine.entities.reduce((averages, entity) => {
            if (entity instanceof Organism) {
                for (const skill of params.skills) {
                    averages[skill] = averages[skill]
                        ? (averages[skill] + entity.genes[skill].level) / 2
                        : entity.genes[skill].level;
                }
            }
            return averages;
        }, {});
    }

    draw(ctx) {
        ctx.font = "bold 15px Arial";
        ctx.fillStyle = "black";
        Object.entries(this.averages).forEach(([skill, average], i) => {
            ctx.fillText(skill, 25, 25 + 12 * i);
            ctx.fillText(average.toFixed(4), 125, 25 + 12 * i);
        });
    }
}

const restart = gameEngine => {
    organismExample(gameEngine);
    // geneExample(gameEngine);
}

const organismExample = gameEngine => {
    const rows = 8;
    const cols = 8;
    gameEngine.addEntity(new OrganismStats());
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const newOrganism = new Organism();
            newOrganism.x = i * ((params.canvas.width - 50) / rows) + 50;
            newOrganism.y = j * ((params.canvas.height - 50) / rows) + 50;
            newOrganism.timeSinceLastReproduction = 20;
            gameEngine.addEntity(newOrganism);
        }
    }
}

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
    ASSET_MANAGER.downloadAll(() => {
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