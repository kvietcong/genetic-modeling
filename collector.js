class Collector {
    info;
    updater;
    onTickTime;
    unitTimePerUpdate;

    timeSinceLastUpdate;
    ticksSinceLastUpdate;

    constructor() {
        this.onTickTime = true;
        this.timeSinceLastUpdate = 0;
        this.ticksSinceLastUpdate = 0;

        this.info = {};

        this.uploadElement = document.getElementById("uploadRaw");
        this.uploadCallback = () => this.upload();
        this.uploadElement
            ?.addEventListener("click", this.uploadCallback);

        this.ticksStoredElement = document.getElementById("ticksStored");

        this.pruneElement = document.getElementById("tickPrune");
        this.pruneCallback = () => {
            this.info.data = this.info.data.filter((_, i) => i % 2 == 0);
            this.ticksStoredElement.textContent = this.info?.data?.length;
        };
        this.pruneElement
            ?.addEventListener("click", this.pruneCallback);
    }

    drop() {
        this.uploadElement
            ?.removeEventListener("click", this.uploadCallback);
        this.pruneElement
            ?.removeEventListener("click", this.pruneCallback);
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

    step(world, _gameEngine, _secondsPerStep) {
        this.ticksSinceLastUpdate += 1;
        if (this.ticksSinceLastUpdate >= this.unitTimePerUpdate) {
            this.ticksSinceLastUpdate -= this.unitTimePerUpdate;
            this.updater(this, world);
            this.ticksStoredElement.textContent = this.info?.data?.length;
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

    upload() {
        const { info } = this;
        const { villages, params, data: organismDataPoints } = info;

        const payload = {
            db: "genetic-modeling",
            collection: "runs",
            data: {
                villages, params, organismDataPoints,
                date: new Date(),
            },
        };

        console.log("Sending: ", payload)
        if (connection.isConnected) socket.emit("insert", payload);
        else alert("Could not upload. Server is not connected.");
    }
}
