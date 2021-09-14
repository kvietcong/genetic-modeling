// Good ol' Testing
const testOrganism = new Organism();
console.log(testOrganism.toString(), "\n");
console.log(testOrganism.genes[0].levels);

// WARNING: INDEXING IS REALLY WEIRD RN. I NEED TO NORMALIZE HOW I/X AND J/Y WORKS. - KV
const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine();
let debug;

function restart() {
    gameEngine.entities = [];
    const genes = [];
    debug = genes;
    for (let i = 0; i < 17; i++) {
        genes[i] = [];
        for (let j = 0; j < 23; j++) {
            genes[i][j] = i == 0
                ? new Gene()
                : genes[i-1][j].recombine(
                    genes[i-1][getRandomInteger(0, genes[0].length-1)]);
            genes[i][j].mutate();
        }
    }

    const levelToIndex = partitionTools.default.levelToIndex;
    const organismSize = params.cellSize
        * (levelToIndex(params.initialPartitions) + 2);
    const padding = params.cellSize * 4;

    for (const [i, row] of genes.entries()) {
        for (const [j, organism] of row.entries()) {
            organism.attachGameEngine(
                gameEngine,
                j * (organismSize + padding),
                i * (organismSize + padding));
            gameEngine.addEntity(organism);
        }
    }
}

ASSET_MANAGER.downloadAll(function () {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.init(ctx);

    restart();

	gameEngine.start();
});
