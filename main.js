let ASSET_MANAGER = new AssetManager();
let gameEngine = new GameEngine();

function restart() {
    gameEngine.entities = [];
    let organisms = [];
    for (let i = 0; i < 6; i++) {
            organisms[i] = [];
        for (let j = 0; j < 5; j++) {
            organisms[i][j] = new Organism();
        }
    }

    const organismSize = CELL_SIZE * GENE_DIMENSIONS;

    // OG
    for (let [i, row] of organisms.entries()) {
        for (let [j, organism] of row.entries()) {
            organism.attachGameEngine(gameEngine, i * organismSize * 1.5, j * organismSize * 1.5);
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
