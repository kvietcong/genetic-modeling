// TODO
// Think of task structure
class Task {
    constructor(doTaskWith) { this.doTaskWith = doTaskWith; }

    doWith(organism) {
        this.doTaskWith(organism);
    }
}

class Organism {
    // TODO
    // Initialize an organism with proper genes
    // No cost system yet (like energy or health)
    constructor() {
    }

    // TODO
    // Default to Asexual reproduction but should most likely be overridden
    // for sexual reproduction
    // This should just get the corresponding genes and recombine them
    reproduce(otherOrganism = this) {
    }

    // TODO
    addTask(task) {
    }

    // TODO
    doTasks() {
        const successes = this.tasks.map(task => task.doWith(this));
    }

    // TODO
    // Determine how to update itself and interact with its environment (the tile)
    step(tile, grid) {
        // tile.neighbors // This gets neighbors
    }
}