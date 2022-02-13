class Histogram {
    constructor(
        categories, getCategory,
        x, y, width, height,
        title, initialData
    ) {
        this.getCategory = getCategory;
        this.categories = categories;

        this.x = x ?? 0; this.y = y ?? 0;
        this.width = width ?? 820; this.height = height ?? 420;

        this.customDrawer;
        this.drawLast = 20;
        this.drawConsistent = true;
        this.isDrawing = true;
        this.title = title ?? "Histogram";

        this._categoryCounts = {};
        this.allCounts = [];
        if (initialData) this.pushData(initialData);

        this.timeSinceLastUpdate = 0;

        this.onTickTime = false;
        this.ticksSinceLastUpdate = 0;
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

    // Shorthand for pushing data directly
    setGetter(getter, updatesPerSecond) {
        this.setUpdater(histogram =>
            histogram.pushData(getter(histogram)), updatesPerSecond);
    }

    setUpdater(updater, unitTimePerUpdate) {
        this.updater = updater;
        this.unitTimePerUpdate = unitTimePerUpdate;
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


    draw(ctx) {
        if (!this.isDrawing) return;
        if (this.customDrawer) return this.customDrawer(this, ctx);

        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = "black";
        ctx.font = "14px Arial";

        const drawLast = this.drawConsistent
                       ? this.drawLast
                       : min(this.drawLast, this.allCounts.length);

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

        const totals = this.allCounts.map(count => count.total);
        const [minTotal, maxTotal] = minMax(totals);

        ctx.fillText(this.title,
            this.x + 5,
            this.y + this.height - titleHeight / 4);

        const sampleSize = `{${minTotal}, ${maxTotal}} `
                         + ` ${totals[totals.length - 1] ?? 0}`;
        ctx.fillText(sampleSize,
            this.x + this.width - ctx.measureText(sampleSize).width - 5,
            this.y + this.height - titleHeight / 4);

        // Category Labels
        this.categories.forEach((category, j) =>
            ctx.fillText(category,
                this.x + this.width - labelWidth + 5,
                this.y + (j + 0.3) * barHeights,
                labelWidth + 5));

        for (let i = this.allCounts.length - 1;
             i >= this.allCounts.length - drawLast;
             i--
        ) {
            if (i < 0) break;
            const counts = this.allCounts[i];
            const ratios = this.getRatios(counts);

            // Label Percentages of latest counts
            if (i === this.allCounts.length - 1)
                this.categories.forEach((category, j) =>
                    ctx.fillText(`${(ratios[category] * 100).toFixed(1)}%`,
                        this.x + this.width - labelWidth + 5,
                        this.y + (j + 0.7) * barHeights,
                        labelWidth + 5));


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

        // Draw totals over time. Needs its own scope for now. Will clean later
        {
            const drawLast = this.allCounts.length;
            const barWidths = this.width / drawLast;

            ctx.beginPath();
            ctx.strokeStyle = "red";
            for (let i = this.allCounts.length - 1;
                i >= this.allCounts.length - drawLast;
                i--
            ) {
                const x = this.x + (i - this.allCounts.length + drawLast) * barWidths;
                const total = totals[i];
                const ratio = total / maxTotal;

                if (i == this.allCounts.length - 1)
                    ctx.moveTo(x, this.y + this.height * (1 - ratio));
                else ctx.lineTo(x, this.y + this.height * (1 - ratio));

            }
            ctx.stroke();
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
const testHeightData = [ 3, 3, 3, 4, 4, 5, 5, 5, 5, 5, 6, 7 ];

const testHistogram = new Histogram(categories, getCategoryForHeight);
testHistogram.title = "Height Histogram";

const updater = histogram =>
    histogram.pushData(testHeightData.map(_ => getRandomInteger(3, 8)));
// testHistogram.setUpdate(updater, 1/12);

const getter = histogram =>  // get's random integers and pushes it into the histogram
    testHeightData.map(_ => getRandomInteger(3, 8));  // probably won't use this? goes through every element in an array and puts a random integer in it
testHistogram.setGetter(getter, 1/12);

const individualUpdater = histogram =>
    histogram.pushData(testHeightData.map(_ => getRandomInteger(3, 8)));
// testHistogram.setIndependentUpdater(individualUpdater, 1/12);