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

        this.tintInfo = null;
        this.backgroundColor = "white";
    }

    toCSVText() {
        return this.categories.join(",") + "\n"
            + this.allCounts.map(counts =>
                this.categories.map(category => counts[category]).join(","))
                .join("\n");
    }

    downloadCSV() {
        const currentDate = new Date();
        const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}-${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
        const csvData = new Blob([this.toCSVText()], { type: "text/csv" });
        const csvUrl = URL.createObjectURL(csvData);
        const link = document.createElement("a");
        link.href = csvUrl;
        link.target = "_blank";
        link.download = `${dateString}.csv`;
        link.click();
    }

    untint() { this.tintInfo = null; }

    tint(color, strength = 0.3) {
        if (typeof color === "object") this.tintInfo = color;
        this.tintInfo = { color, strength };
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


    draw(ctx, gameEngine) {
        if (!this.isDrawing) return;
        if (this.customDrawer) return this.customDrawer(this, ctx);

        const { offscreenCanvas, offscreenContext } = Histogram;
        offscreenCanvas.width = this.width;
        offscreenCanvas.height = this.height;

        if (typeof this.backgroundColor == "object") {
            const { color, opacity } = this.backgroundColor;
            offscreenContext.fillStyle = color;
            offscreenContext.globalAlpha = opacity;
        } else {
            offscreenContext.fillStyle = this.backgroundColor;
        }
        offscreenContext.fillRect(0, 0, this.width, this.height);
        offscreenContext.globalAlpha = 1;
        offscreenContext.strokeStyle = "black";
        offscreenContext.strokeRect(0, 0, this.width, this.height);

        offscreenContext.fillStyle = "black";
        offscreenContext.font = "14px Arial";

        const drawLast = this.drawConsistent
                       ? this.drawLast
                       : min(this.drawLast, this.allCounts.length);

        const longestCategory = this.categories.reduce((longest, current) =>
            current.toString().length > longest.length
                ? current.toString()
                : longest, "");
        const labelWidth = max(
            offscreenContext.measureText("100.0%").width,
            offscreenContext.measureText(longestCategory).width
        ) + 10;

        const titleHeight = 20;

        const barWidths = (this.width - labelWidth) / drawLast;
        const barHeights = (this.height - titleHeight) / this.categories.length;

        const totals = this.allCounts.map(count => count.total);
        const [minTotal, maxTotal] = minMax(totals);

        offscreenContext.fillText(this.title,
            0 + 5,
            0 + this.height - titleHeight / 4);

        const sampleSize = `{${minTotal}, ${maxTotal}} `
                         + ` ${totals[totals.length - 1] ?? 0}`;
        offscreenContext.fillText(sampleSize,
            0 + this.width - offscreenContext.measureText(sampleSize).width - 5,
            0 + this.height - titleHeight / 4);

        // Category Labels
        this.categories.forEach((category, j) =>
            offscreenContext.fillText(category,
                0 + this.width - labelWidth + 5,
                0 + (j + 0.3) * barHeights,
                labelWidth + 5));

        offscreenContext.beginPath();
        offscreenContext.strokeStyle = "red";
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
                    offscreenContext.fillText(`${(ratios[category] * 100).toFixed(1)}%`,
                        0 + this.width - labelWidth + 5,
                        0 + (j + 0.7) * barHeights,
                        labelWidth + 5));


            const startX = 0 + (i - this.allCounts.length + drawLast) * barWidths;
            this.categories.forEach((category, j) => {
                const y = 0 + (j * barHeights);
                let opacity = ratios[category];
                // TODO: Get logarithmic scale working
                // console.log(opacity = log(ratios[category] * 99 + 1) / log(100) * 512 / 1000);
                offscreenContext.fillStyle = rgba(0, 0, 0, opacity);
                offscreenContext.fillRect(startX, y, barWidths, barHeights);
            });

            const midX = 0 + (i + 0.5 - this.allCounts.length + drawLast) * barWidths;
            const ratio = totals[i] / maxTotal;

            if (i == this.allCounts.length - 1)
                offscreenContext.moveTo(midX, 0 + this.height * (1 - ratio));
            else offscreenContext.lineTo(midX, 0 + this.height * (1 - ratio));

        }
        offscreenContext.stroke();

        if (this.tintInfo) {
            const { color, strength } = this.tintInfo;
            offscreenContext.fillStyle = color;
            offscreenContext.globalAlpha = strength;
            offscreenContext.opa
            offscreenContext.fillRect(0, 0, this.width, this.height);
            offscreenContext.globalCompositeOperation = "destination-atop";
            offscreenContext.globalAlpha = 1;
        }

        ctx.drawImage(offscreenCanvas, this.x, this.y);
        offscreenContext.clearRect(0, 0, this.width, this.height);
    }
}

// Shared Offscreen Canvas to manipulate images with.
Histogram.offscreenCanvas = document.createElement("canvas");
Histogram.offscreenContext = Histogram.offscreenCanvas.getContext("2d");

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