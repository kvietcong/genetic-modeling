// Look at `gene.js` for more details on how this code works

class Organism {
    /** {Array<Genes>} A list of genes that the Organism has */
    genes;
    /** {GameEngine} Current game engine instance attached to this organism */
    gameEngine;
    /** {Integer} X position of the organism within a given game engine world */
    x;
    /** {Integer} Y position of the organism within a given game engine world */
    y;

    constructor(options = null) {
        if (options) {
            if (options.genes) {
                this.genes = options.genes
            } else {
                throw "Invalid Options!";
            }
        } else {
            this.randomizeGenes();
        }
    }

    clone() {
        return new Organism({genes: this.genes});
    }

    randomizeGenes() {
        this.genes = [];
        for (let i = 0; i < params.geneAmount; i++) {
            this.genes[i] = new Gene();
        }
    }

    attachGameEngine(gameEngine, x, y) {
        Object.assign(this, {gameEngine, x, y})
    }

    draw(ctx) {
        const cellSize = params.cellSize;
        const indexToLevel = partitionTools.default.indexToLevel;

        const gene = this.genes[0];
        const cells = gene.cells;
        const colors = ["red", "green", "blue"];

        // Fill the grid up specially with levels in mind
        const x = this.x + cellSize;
        const y = this.y + cellSize;
        for (let i = 0; i < cells.length; i++) {
            for (let j = 0; j < cells.length; j++) {
                ctx.fillStyle = cells[i][j] == 1
                    ? colors[indexToLevel(max(i, j)) % colors.length]
                    : "white";
                ctx.fillRect(cellSize * j + x, cellSize * i + y,
                                cellSize, cellSize);
            }
        }

        // Outline for box for clarity
        ctx.lineWidth = cellSize;
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x+cellSize/2, this.y+cellSize/2,
                       cellSize * cells.length + cellSize,
                       cellSize * cells.length + cellSize);
    }

    update() {
    }

    reproduce(otherOrganism) {
        const otherGenes = otherOrganism.genes;
        if (this.genes.length !== otherGenes.length) return console.log("Incompatible!");

        const newGenes = []

        for (let i = 0; i < this.genes.length; i++) {
            newGenes[i] = this.genes[i].recombine(otherGenes[i]);
        }

        return new Organism({genes: newGenes});
    }

    toString() {
        return this.genes.map(gene => gene.toString()).join("\n");
    }
}