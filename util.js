/** Global Parameters Object */
const params = {
    // Maybe use for toggle-able logging?
    isDebugging: true,
    debugEntities: {},

    defaultIP: "http://76.28.146.35:8888",

    gridSize: [5, 5],
    migrationThreshold: 0,
    SLradios: 0,
    sexualReproThreshold: 0,
    SLcheck: false,

    // reproduction base
    reproduction_base: 15,

    // gene weights
    gene_weight: 1,
    ind_weight: 1,
    soc_weight: 1,

    // ticket multipliers
    ind_learn_ticket_multiplier: 5,
    soc_learn_ticket_multiplier: 5,

    // Set Soft Cap
    softcap_modifier: 30,   // Take population you want and divide by this number. If the number is 5 or more,
                            // then the population growth will stop at that point.
    // World params
    worldSize: 5,
    worldType: 'random',
    isolated: true,
    // ticket multipliers
    IND_LEARN_TICKET_MULTIPLIER: 5,
    SOC_LEARN_TICKET_MULTIPLIER: 5,
    // reproduction base
    REPRODUCTION_BASE: 25,
    // gene weights
    GENE_WEIGHT: 1,
    IND_WEIGHT: 1,
    SOC_WEIGHT: 1,

    canvas: {
        width: 2000,
        height: 1600,
        // width: 1280,
        // height: 720,
        backgroundColor: "white",
        border: "1px solid black",
        attachID: "simulations",
    },
    defaultGameEngineOptions: {
        prevent: {
            contextMenu: false,
            scrolling: false,
        },
        debugging: false,
    }
};

const logReturn = thing => console.log(thing) || thing;

/** Easy access to math functions */
const {
    pow, ceil, floor, round, log, log2: lg, max, min, random, sqrt, abs,
    PI, E, sin, cos, tan, asin, acos, atan, atan2,
} = Math;

const sq = x => x * x;

/** Easy access to logging :) (Python syntax XD) */
const {log: print} = console

/**
 * @param {Number} n
 * @returns Random Integer Between 0 and n-1
 */
const randomInt = n => floor(random() * n);

/**
 * @param {Number} r Red Value
 * @param {Number} g Green Value
 * @param {Number} b Blue Value
 * @returns String that can be used as a rgb web color
 */
const rgb = (r, g, b) => `rgba(${r}, ${g}, ${b})`;

/**
 * @param {Number} r Red Value
 * @param {Number} g Green Value
 * @param {Number} b Blue Value
 * @param {Number} a Alpha Value
 * @returns String that can be used as a rgba web color
 */
const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;

/**
 * @param {Number} h Hue
 * @param {Number} s Saturation
 * @param {Number} l Lightness
 * @returns String that can be used as a hsl web color
 */
const hsl = (h, s, l) => `hsl(${h}, ${s}, ${l})`;

const minMax = array => array.reduce(
    ([min, max], x) => [x < min ? x : min, x > max ? x : max], [0, 0]);

/** Creates an alias for requestAnimationFrame for backwards compatibility */
window.requestAnimFrame = (() => {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        /**
         * Compatibility for requesting animation frames in older browsers
         * @param {Function} callback Function
         * @param {DOM} element DOM ELEMENT
         */
        ((callback, element) => {
            window.setTimeout(callback, 1000 / 60);
        });
})();

/**
 * Random Integer between two numbers inclusively
 * @param {Number} min Lower bound
 * @param {Number} max Upper bound
 */
const getRandomInteger = (min, max) => round(random() * (max - min) + min);

const average = args => {
    if (!args.length) return 0;
    return args.reduce((a, b) => a + b, 0) / args.length;
}

// Inclusive!
const range = (start, end) => [...Array(end - start + 1).keys()].map(i => i + start);

/**
 * Random number between two numbers inclusively
 * @param {Number} min Lower bound
 * @param {Number} max Upper bound
 */
const getRandomRange = (min, max) => random() * (max - min) + min;

/**
 * Compute log with arbitrary base
 * @param {Number} base Base of the log
 * @param {Number} x Number to take log of
 */
const logBase = (base, x) => log(x) / log(base);

/**
 * Deep copy JSON-serializable objects. ONLY FOR OBJECTS. DON'T PUT CLASSES HERE
 * @param {Object} object Object to deep copy
 * @returns Deep copy of the object
 */
const simpleObjectCopy = object => JSON.parse(JSON.stringify(object));

/**
 * Returns distance from two points
 * @param {Number} x1, y1, x2, y2 Coordinates of first and second point
 * @returns Distance between the two points
 */
const getDistance = (x1, y1, x2, y2) => {
    return sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
};

/**
 * Returns random element from array
 * @param {Array} items
 * @returns Returns random element from array. Null if empty
 */
const chooseRandom = items => items.length > 0
    ? items[floor(random() * items.length)]
    : null;

/**
 * Initialize Canvas within DOM and returns canvas context
 * @param {Object} options Options for canvas. Look at params for defaults
 * @returns Canvas context
 */
const initCanvas = options => {
    const {
        backgroundColor, border, width, height, attachID,
    } = options || params.canvas;

    const simulations = document.getElementById(attachID);

	const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = border;
    canvas.style.backgroundColor = backgroundColor;
    canvas.style.float = "left";
    // canvas.style.display = "inline-block";
    // canvas.style.display = "flex";

	const context = canvas.getContext("2d");
    const listItem = document.createElement("li");
    listItem.appendChild(canvas);
    simulations.appendChild(listItem);

    return context;
};

// Helper function to create a basic organism histogram
const createOrganismHistogram = (
    categories, getCategoryFromOrganism,
    x, y, width, height, title,
    villageReference, updatesPerTick,
) => {
    const histogram = new Histogram(
        categories,
        getCategoryFromOrganism,
        x, y, width, height,
        title,
    );
    histogram.onTickTime = true;
    // Can't use direct organism reference as the pointer can change in the code
    histogram.setGetter(() =>
        villageReference.organisms, updatesPerTick);
    return histogram;
}

const attachPropertyWithCallback = (object, property, initialValue, callback) => {
    Object.defineProperty(object, property, {
        get: () => object[`_${property}`],
        set: newValue => {
            object[`_${property}`] = newValue;
            callback(newValue, property);
        }
    });
    object[property] = initialValue;
};

const attachPropertiesWithCallbacks = (object, things) => {
    const t = things.reduce((acc, thing) => {
        const [ property, _initialValue, callback ] = thing;
        acc[property] = {
            get: () => object[`_${property}`],
            set: newValue => {
                object[`_${property}`] = newValue;
                if (callback) callback(newValue, property);
            }
        };
        return acc;
    }, {});
    Object.defineProperties(object, t);
    things.forEach(([ property, initialValue, _callback ]) => {
        object[property] = initialValue;
    });
};

class BitArray {
    constructor(bytes) {
        this._array = new Uint8Array(bytes);
        this._length = bytes * 8;
    }

    get length() { return this._length; }

    get(index) {
        const byteIndex = floor(index / 8);
        const bitIndex = index % 8;
        return (this._array[byteIndex] >> bitIndex) & 1;
    }

    slice(start = 0, end = this._length) {
        return range(start, end - 1).map(i => this.get(i));
    }

    sliceUint8(start = 0, end = this._length) {
        return new Uint8Array(this.slice(start, end));
    }

    clone() {
        const clonedBitArray = new BitArray(this._array.length);
        this._array.forEach((num, i) => clonedBitArray._array[i] = num);
        return clonedBitArray;
    }

    set(index, value = 1) {
        const byteIndex = floor(index / 8);
        const bitIndex = index % 8;
        const mask = 1 << bitIndex;
        const newByte = value
            ? this._array[byteIndex] | mask
            : this._array[byteIndex] & ~mask;
        this._array[byteIndex] = newByte;
        return value;
    }

    clear(index) {
        if (!index) range(0, this._length).forEach(i => this.set(i, 0));
        else this.set(index, 0);
    }

    flip(index) { this.set(index, !this.get(index)); }

    *[Symbol.iterator]() {
        for (let i = 0; i < this._length; i++) yield this.get(i);
    }

    forEach(callback) {
        for (let i = 0; i < this._length; i++) callback(this.get(i), i);
    }

    reduce(callback, initialValue) {
        let accumulated = initialValue;
        this.forEach(bit => accumulated = callback(accumulated, bit));
        return accumulated;
    }

    toString() {
        return this.reduce((string, bit) => string + (bit ? "1" : "0"), "");
    }
}

class BitArray2D {
    static clone(bitArray2D) {
        const clonedBitArray2D = new BitArray2D(bitArray2D.width, bitArray2D.height);
        clonedBitArray2D._bitArray = bitArray2D._bitArray.clone();
        return clonedBitArray2D;
    }

    constructor(width, height) {
        this._width = width; this._height = height;
        this._bitArray = new BitArray(ceil(this.width * this.height / 8));
    }

    clone() { return BitArray2D.clone(this); }

    get width() { return this._width; }
    get height() { return this._height; }

    checkBounds(i, j) {
        if (i < 0 || i >= this.width || j < 0 || j >= this.height) {
            throw new Error(`Index out of bounds: ${i}, ${j}`);
        }
    }

    get(i, j) {
        this.checkBounds(i, j);
        return this._bitArray.get(i * this._width + j);
    }

    set(i, j, value = 1) {
        this.checkBounds(i, j);
        return this._bitArray.set(i * this._width + j, value);
    }

    flip(i, j) { this.set(i, j, !this.get(i, j)) }

    clear(i, j) {
        if (!i && !j) this._bitArray.clear();
        else this.set(i, j, 0);
    }

    *[Symbol.iterator]() {
        // This Clones!
        for (let i = 0; i < this._height; i++)
            yield this._bitArray.slice(i * this._width, i * this._width + this._width);
    }

    forEach(callback) {
        let i = 0; for (const row of this) callback(row, i++);
    }

    forEachBit(callback) {
        for (let i = 0; i < this._width; i++)
            for (let j = 0; j < this._height; j++)
                callback(this.get(i, j), i, j);
    }

    reduce(callback, initialValue) {
        let accumulated = initialValue;
        this.forEach((row, i) => accumulated = callback(accumulated, row, i));
        return accumulated;
    }

    reduceBits(callback, initialValue) {
        let accumulated = initialValue;
        this.forEachBit((bit, i, j) => accumulated = callback(accumulated, bit, i, j));
        return accumulated;
    }

    toString() {
        return this.reduce((string, row) =>
            string + row.reduce((acc, bit) => acc + " " + bit,"") + "\n", "");
    }
}

class BitArrayND {
    constructor(...dimensions) {
        this._dimensions = dimensions;
        this._bitArray = new BitArray(
            ceil(this._dimensions.reduce((acc, d) => acc * d, 1) / 8));
    }

    get(...indices) {
        if (indices.length !== this._dimensions.length)
            throw new Error(`Dimensions must match: ${indices.length} !== ${this._dimensions.length}`);
        return this._bitArray.get(
            indices.reduce((acc, i, index) =>
                acc + i * this._dimensions[index], 0));
    }

    set(...indices) {
        if (indices.length !== this._dimensions.length)
            throw new Error(`Dimensions must match: ${indices.length} !== ${this._dimensions.length}`);
        return this._bitArray.set(
            indices.reduce((acc, i, index) =>
                acc + i * this._dimensions[index], 0));
    }

    forEachBit(callback) {
        this._bitArray.forEach(bit => callback(bit));
    }
}

/// Ignore Below
const create2DBitArrayWithByteDimensions = (byteWidth, byteHeight) => {
    const bitArray2D = {
        byteHeight, byteWidth,
        bitArray: createBitArray(byteHeight * byteWidth * 8), // Why x8?
    }
    bitArray2D.width = bitArray2D.byteWidth * 8;
    bitArray2D.height = bitArray2D.byteHeight * 8;
    bitArray2D.get = (i, j) =>
        bitArray2D.bitArray.get(i * bitArray2D.width + j);
    bitArray2D.set = (i, j, value = 1) =>
        bitArray2D.bitArray.set(i * bitArray2D.width + j, value);
    bitArray2D.flip = (i, j) => bitArray2D.set(i, j, !bitArray2D.get(i, j));
    bitArray2D.clear = (i, j) => {
        if (!i && !j) bitArray2D.bitArray.clear();
        else bitArray2D.set(i, j, 0);
    };
    bitArray2D[Symbol.iterator] = function* () {
        // This Clones!
        for (let i = 0; i < bitArray2D.height; i++)
            yield bitArray2D.bitArray
                .slice(i * bitArray2D.width,
                       i * bitArray2D.width + bitArray2D.width);
    };
    bitArray2D.forEach = callback => {
        for (let i = 0; i < bitArray2D.width; i++)
            for (let j = 0; j < bitArray2D.height; j++)
                callback(bitArray2D.get(i, j), i, j);
    };
    bitArray2D.forEach_ = callback => {
        for (const row of bitArray2D) callback(row);
    };
    bitArray2D.reduce = (callback, initialValue) => {
        let accumulated = initialValue;
        bitArray2D.forEach_(row => accumulated = callback(accumulated, row));
        return accumulated;
    };
    bitArray2D.toString = () =>
        bitArray2D.reduce((string, row) =>
            string
            + row.reduce((acc, bit) => acc + " " + bit,"")
            + "\n", "");
    return bitArray2D;
};
