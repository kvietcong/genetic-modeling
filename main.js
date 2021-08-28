let ASSET_MANAGER = new AssetManager();
let gameEngine = new GameEngine();

// WARNING: INDEXING IS REALLY WEIRD RN. I NEED TO NORMALIZE HOW I/X AND J/Y WORKS. - KV
function restart() {
    gameEngine.entities = [];
    let organisms = [];
    for (let i = 0; i < 8; i++) {
        organisms[i] = [];
        for (let j = 0; j < 11; j++) {
            organisms[i][j] = i == 0
                ? new Organism()
                : organisms[i-1][j].reproduce(
                    organisms[i-1][getRandomInteger(0, organisms[0].length-1)]);
        }
    }

    const organismSize = PARAMS.CELL_SIZE * PARAMS.GENE_DIMENSIONS;
    const padding = PARAMS.CELL_SIZE * 4;

    // OG
    for (let [i, row] of organisms.entries()) {
        for (let [j, organism] of row.entries()) {
            organism.attachGameEngine(
                gameEngine,
                j * (organismSize + padding),
                i * (organismSize + padding));
            gameEngine.addEntity(organism);
        }
    }
}

ASSET_MANAGER.downloadAll(function () {
	let canvas = document.getElementById("gameWorld");
	let ctx = canvas.getContext("2d");

	gameEngine.init(ctx);

    restart();

	gameEngine.start();
});
