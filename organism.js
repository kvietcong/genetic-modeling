// Look at the comments in `gene.js` for more details on how this code works

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
        Object.assign(this, {gameEngine, x, y});
    }

    draw(ctx) { }

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