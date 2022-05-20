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
        const { villages, params, data } = info;

        const organismDataPoints = data.map(({ organismData, tick }) => ({
            organismData: organismData.map((row, i) =>
                row.map((villageOrganisms, j) =>
                    villageOrganisms.reduce((aggregate, organism) => {
                        organism.genes.forEach((geneLevel, k) => {
                            aggregate.genes[k][geneLevel] =
                                1 + (aggregate.genes[k][geneLevel] ?? 0);
                        });
                        organism.learn.forEach((memeLevel, k) => {
                            aggregate.memes[k][memeLevel] =
                                1 + (aggregate.memes[k][memeLevel] ?? 0);
                        });
                        aggregate.social[organism.social] =
                            1 + (aggregate.social[organism.social] ?? 0);
                        aggregate.individual[organism.individual] =
                            1 + (aggregate.individual[organism.individual] ?? 0);
                        aggregate.population++;
                        return aggregate;
                    }, {
                        genes: zeroes(ARR_LEN).map(_ => ({})),
                        memes: zeroes(ARR_LEN).map(_ => ({})),
                        individual: {}, social: {},
                        population: 0, position: [i,j],
                    })
                )
            ),
            tick,
        }));

        // TODO: Ask About Saving Memory by not filling in 0 spots
        // const organismDataPoints = data.map(({ organismData, tick }) => ({
        //     organismData: organismData.map((row, i) =>
        //         row.map((villageOrganisms, j) =>
        //             villageOrganisms.reduce((aggregate, organism) => {
        //                 organism.genes.forEach((geneLevel, k) => {
        //                     aggregate.genes[k][geneLevel]++;
        //                 });
        //                 organism.learn.forEach((memeLevel, k) => {
        //                     aggregate.memes[k][memeLevel]++;
        //                 });
        //                 aggregate.social[organism.social]++;
        //                 aggregate.individual[organism.individual]++;
        //                 aggregate.population++;
        //                 return aggregate;
        //             }, {
        //                 genes: zeroes(ARR_LEN).map(_ => zeroes(params.initialPartitions)),
        //                 memes: zeroes(ARR_LEN).map(_ => zeroes(params.initialPartitions)),
        //                 individual: zeroes(params.initialPartitions),
        //                 social: zeroes(params.initialPartitions),
        //                 population: 0, position: [i,j],
        //             })
        //         )
        //     ),
        //     tick,
        // }));

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
