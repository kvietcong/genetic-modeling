const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine();

class Stats {
    update(gameEngine) {
        this.averages = gameEngine.entities.reduce((averages, entity) => {
            if (entity instanceof Organism) {
                for (const skill of params.skills) {
                    averages[skill] = (
                        (averages[skill] || 0)
                        + entity.genes[skill].level
                    ) / 2;
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

function restart() {
    const rows = 8;
    const cols = 8;
    gameEngine.addEntity(new Stats());
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const newOrganism = new Organism();
            newOrganism.x = i * 150 + 50
            newOrganism.y = j * 70 + 50;
            newOrganism.timeSinceLastReproduction = 20;
            gameEngine.addEntity(newOrganism);
        }
    }
}

ASSET_MANAGER.downloadAll(function () {
    const ctx = initCanvas();

	gameEngine.init(ctx);

    restart();

	gameEngine.start();
});
