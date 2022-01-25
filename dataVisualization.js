class Histogram {
    constructor(
        categories, getCategory, data,
        x = 0, y = 0, width = 640, height = 360,
    ) {
        this.getCategory = getCategory;
        this.categories = categories;

        this.x = x; this.y = y;
        this.width = width; this.height = height;

        this.customDrawer;

        this._categoryCounts = {};
        this.data = data;
    }

    _updateCategoryCounts() {
        const categoryCounts = {};
        this.categories.forEach(category => categoryCounts[category] = 0);
        this._data.forEach(dataPoint => {
            const category = this.getCategory(dataPoint);
            if (!(category in categoryCounts))
                throw new Error(`Unknown category: ${category}`);
            categoryCounts[category] += 1
        });
        this._categoryCounts = categoryCounts;
    }

    get data() { return this._data; }
    set data(data) {
        this._data = data;
        this._updateCategoryCounts();
    }

    get categoryCounts() { return this._categoryCounts;}

    update(gameEngine) {}

    draw(ctx) {
        if (this.customDrawer) return this.customDrawer(this, ctx);

        // TODO Draw Histogram (This was auto generated)
        const counts = this.categoryCounts;
        const totalCount = this.data.length;

        const maxCount = max(...Object.values(counts));
        const maxBarHeight = this.height - 30;
        const barWidth = this.width / this.categories.length;

        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.categories.forEach((category, index) => {
            const barHeight = maxBarHeight * this.categoryCounts[category] / maxCount;
            ctx.fillStyle = "black";
            ctx.fillRect(this.x + index * barWidth, this.y + this.height - barHeight, barWidth, barHeight);
            ctx.fillStyle = "white";
            ctx.fillText(`${category}: ${this.categoryCounts[category]} (${(this.categoryCounts[category] / totalCount * 100).toFixed(2)}%)`,
                this.x + index * barWidth + barWidth / 2, this.y + this.height - barHeight / 2);
        });
    }
}

// Histogram Example
const categories = ["short", "medium", "tall"];
const getCategoryForHeight = height => {
    if (height <= 3) return "short";
    if (height <= 5) return "medium";
    return "tall";
};
const heightData = [ 3, 3, 3, 4, 4, 5, 5, 5, 5, 5, 6, 7 ];

const testHistogram = new Histogram(categories, getCategoryForHeight, heightData);