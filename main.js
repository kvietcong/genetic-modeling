// WARNING: INDEXING IS REALLY WEIRD RN. I NEED TO NORMALIZE HOW I/X AND J/Y WORKS. - KV
const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine();

function restart() {
    gameEngine.entities = [];
    const organisms = [];
    for (let i = 0; i < 16; i++) {
        organisms[i] = [];
        for (let j = 0; j < 21; j++) {
            organisms[i][j] = i == 0
                ? new Organism()
                : organisms[i-1][j].reproduce(
                    organisms[i-1][getRandomInteger(0, organisms[0].length-1)]);
        }
    }

    const organismSize = params.cellSize * (params.geneDimensions + 2);
    const padding = params.cellSize * 4;

    // OG
    for (const [i, row] of organisms.entries()) {
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
