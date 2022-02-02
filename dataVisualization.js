class Histogram {
    constructor(
        categories, getCategory, initialData,
        x = 0, y = 0, width = 840, height = 420,
        title = "Histogram", isDrawing = true,
    ) {
        this.getCategory = getCategory;
        this.categories = categories;
        this.title = title;

        this.x = x; this.y = y;
        this.width = width; this.height = height;

        this.customDrawer;
        this.drawLast = 20;
        this.drawConsistent = true;
        this.isDrawing = isDrawing;

        this._categoryCounts = {};
        this.allCounts = [];
        this.pushData(initialData);

        this.timeSinceLastUpdate = 0;
    }

    getCounts(data) {
        const counts = { total: data.length };
        this.categories.forEach(category => counts[category] = 0);
        data.forEach(dataPoint => {
            const category = this.getCategory(dataPoint);
            if (!(category in counts))
                throw new Error(`Unknown category: ${category}`);
            counts[category] += 1
        });
        return counts;
    }

    getRatios(counts) {
        const total = counts.total;
        const ratios = this.categories.reduce((accumulated, current) => {
            accumulated[current] = counts[current] / (total || 1);
            return accumulated;
        }, {});
        return ratios;
    }

    pushData(data) { this.allCounts.push(this.getCounts(data)); }

    get currentCounts() { return this.allCounts[this.allCounts.length - 1]; }

    setIndependentUpdater(updater, updatesPerSecond) {
        if (this.intervalID) clearInterval(this.intervalID);
        this.intervalID = setInterval(() => updater(this), 1/updatesPerSecond);
    }

    stopIndependentUpdater() {
        if (this.intervalID) clearInterval(this.intervalID);
    }

    setInfoGetter(getter, updatesPerSecond) {
        this.setUpdate((histogram, gameEngine) => {
            histogram.pushData(getter(histogram, gameEngine));
        }, updatesPerSecond);
    }

    setUpdate(updater, updatesPerSecond) {
        this.updater = updater;
        this.updatesPerSecond = updatesPerSecond;
    }

    stopUpdate() { this.updater = null; this.updatesPerSecond = 0; }

    update(gameEngine) {
        if (!this.updater) return;
        this.timeSinceLastUpdate += gameEngine.deltaTime;
        const updateFrequency = 1 / this.updatesPerSecond;

        if (this.timeSinceLastUpdate > updateFrequency) {
            this.timeSinceLastUpdate -= updateFrequency;
            this.updater(this, gameEngine);
        }
    }


    draw(ctx) {
        if (!this.isDrawing) return;
        if (this.customDrawer) return this.customDrawer(this, ctx);

        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        const drawLast = this.drawConsistent
                       ? this.drawLast
                       : min(this.drawLast, this.allCounts.length);

        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        const longestCategory = this.categories.reduce((longest, current) =>
            current.toString().length > longest.length
                ? current.toString()
                : longest, "");
        const labelWidth = max(
            ctx.measureText("100.0%").width,
            ctx.measureText(longestCategory).width
        ) + 10;

        const titleHeight = 20;

        const barWidths = (this.width - labelWidth) / drawLast;
        const barHeights = (this.height - titleHeight) / this.categories.length;

        ctx.fillText(this.title,
            this.x + (this.width - ctx.measureText(this.title).width) / 2,
            this.y + this.height - titleHeight / 4);

        for (let i = this.allCounts.length - 1;
             i >= this.allCounts.length - drawLast;
             i--
        ) {
            if (i < 0) break;
            const counts = this.allCounts[i];
            const ratios = this.getRatios(counts);

            // Labels
            if (i === this.allCounts.length - 1) {
                this.categories.forEach((category, j) => {
                    // Category Label
                    ctx.fillText(category,
                        this.x + this.width - labelWidth + 5,
                        this.y + (j + 0.3) * barHeights,
                        labelWidth + 5);

                    // Percentages of latest counts
                    ctx.fillText(`${(ratios[category] * 100).toFixed(1)}%`,
                        this.x + this.width - labelWidth + 5,
                        this.y + (j + 0.7) * barHeights,
                        labelWidth + 5);
                });
            }

            const x = this.x + (i - this.allCounts.length + drawLast) * barWidths;
            this.categories.forEach((category, j) => {
                const y = this.y + (j * barHeights);
                let opacity = ratios[category];
                // TODO: Get logarithmic scale working
                // console.log(opacity = log(ratios[category] * 99 + 1) / log(100) * 512 / 1000);
                ctx.fillStyle = rgba(0, 0, 0, opacity);
                ctx.fillRect(x, y, barWidths, barHeights);
            });
        }
    }
}

// Histogram Example
const categories = ["short", "medium", "tall"];
const getCategoryForHeight = height => {
    if (height <= 3) return "short";
    if (height <= 5) return "medium";
    return "tall";
};
const initialHeightData = [ 3, 3, 3, 4, 4, 5, 5, 5, 5, 5, 6, 7 ];

const testHistogram = new Histogram(categories, getCategoryForHeight, initialHeightData);

const updater = (histogram, gameEngine) =>
    histogram.pushData(initialHeightData.map(_ => getRandomInteger(3, 8)));
// testHistogram.setUpdate(updater, 12);

const infoGetter = (histogram, gameEngine) =>
    initialHeightData.map(_ => getRandomInteger(3, 8));
testHistogram.setInfoGetter(infoGetter, 12);

const individualUpdater = histogram =>
    histogram.pushData(initialHeightData.map(_ => getRandomInteger(3, 8)));
// testHistogram.setIndependentUpdater(individualUpdater, 12);