class Collector {
    info;
    updater;
    onTickTime;
    unitTimePerUpdate;

    timeSinceLastUpdate;
    ticksSinceLastUpdate;

    constructor(unitTimePerUpdate) {
        this.onTickTime = true;
        this.timeSinceLastUpdate = 0;
        this.ticksSinceLastUpdate = 0;

        this.info = {};
    }

    setIndependentUpdater(updater, updatesPerSecond) {
        if (this.intervalID) clearInterval(this.intervalID);
        this.intervalID = setInterval(() => updater(this), 1/updatesPerSecond);
    }

    stopIndependentUpdater() {
        if (this.intervalID) clearInterval(this.intervalID);
    }

    setUpdater(updater, unitTimePerUpdate) {
        this.updater = updater;
        this.unitTimePerUpdate = unitTimePerUpdate;
        this.timeSinceLastUpdate = unitTimePerUpdate;
        this.ticksSinceLastUpdate = unitTimePerUpdate;
    }

    stopUpdate() { this.updater = null; this.unitTimePerUpdate = 0; }

    step() {
        this.ticksSinceLastUpdate += 1;
        if (this.ticksSinceLastUpdate >= this.unitTimePerUpdate) {
            this.ticksSinceLastUpdate -= this.unitTimePerUpdate;
            this.updater(this);
        }
    }

    update(gameEngine) {
        if (!this.updater || this.onTickTime) {
            this.timeSinceLastUpdate = 0;
            return;
        }

        this.timeSinceLastUpdate += gameEngine.deltaTime;

        if (this.timeSinceLastUpdate > this.unitTimePerUpdate) {
            this.timeSinceLastUpdate -= this.unitTimePerUpdate;
            this.updater(this, gameEngine);
        }
    }
}
