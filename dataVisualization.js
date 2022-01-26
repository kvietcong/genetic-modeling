class Histogram {
    constructor(
        categories, getCategory, initialData,
        x = 0, y = 0, width = 640, height = 360,
    ) {
        this.getCategory = getCategory;
        this.categories = categories;

        this.x = x; this.y = y;
        this.width = width; this.height = height;

        this.drawLast = 50;
        this.drawConsistent = true;

        this.customDrawer;

        this.allCounts = [];
        this.pushData(initialData);
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
        return categories.reduce((accumulated, current) => {
            accumulated[current] = counts[current] / total;
            return accumulated;
        }, {});
    }

    pushData(data) { this.allCounts.push(this.getCounts(data)); }

    get currentCounts() { return this.allCounts[this.allCounts.length - 1]; }

    update(gameEngine) {}

    draw(ctx) {
        if (this.customDrawer) return this.customDrawer(this, ctx);
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        const drawLast = this.drawConsistent
                       ? this.drawLast
                       : min(this.drawLast, this.allCounts.length);
        const barWidths = this.width / drawLast;
        const barHeights = this.height / this.categories.length;

        for (let i = this.allCounts.length - 1;
             i >= this.allCounts.length - drawLast;
             i--
        ) {
            if (i < 0) break;
            const x = this.x + (i - this.allCounts.length + drawLast) * barWidths;
            const counts = this.allCounts[i];
            const ratios = this.getRatios(counts);
            for (let j = 0; j < this.categories.length; j++) {
                const category = this.categories[j];
                const y = this.y + (j * barHeights);
                let opacity = ratios[category];
                // console.log(opacity = log(ratios[category] * 99 + 1) / log(100) * 512 / 1000);
                ctx.fillStyle = rgba(0, 0, 0, opacity);
                ctx.fillRect(x, y, barWidths, barHeights);
            }
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

const testHistogram =
    new Histogram(categories, getCategoryForHeight, initialHeightData);

let dataCounter = 0;
let intervalID = setInterval(() => {
    if (dataCounter++ < 500) {
        const newHeightData = initialHeightData.map(_ => getRandomInteger(3, 8));
        testHistogram.pushData(newHeightData);
    } else {
        clearInterval(intervalID);
    }
}, 30);