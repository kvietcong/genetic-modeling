/** Global Parameters Object */
const params = {
    // Maybe use for toggle-able logging?
    DEBUG: false,
    canvas: {
        width: 1280,
        height: 720,
        backgroundColor: "white",
        border: "1px solid black",
        attachID: "simulations",
    },
};

/** Easy access to math functions */
const {
    pow, ceil, floor, round, log, log2: lg, max, min, random, sqrt, abs,
    PI, E, sin, cos, tan, asin, acos, atan, atan2,
} = Math

/** Easy access to logging :) */
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
const getRandomInteger = (min, max) => round(Math.random() * (max - min) + min);

/**
 * Random number between two numbers inclusively
 * @param {Number} min Lower bound
 * @param {Number} max Upper bound
 */
const getRandomRange = (min, max) => Math.random() * (max - min) + min;

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
const deepObjectCopy = object => JSON.parse(JSON.stringify(object));

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

	const context = canvas.getContext("2d");
    const listItem = document.createElement("li");
    listItem.appendChild(canvas);
    simulations.appendChild(listItem);

    return context;
};

/** A class to represent a 2D vector */
class Vector {
    x; y;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(vector, y = null) {
        if (!y) {
            return new Vector(this.x + vector.x, this.y + vector.y);
        } else {
            const x = vector;
            return new Vector(this.x + x, this.y + y);
        }
    }

    scale(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    get["magnitude"]() { return sqrt(pow(this.x, 2) + pow(this.y, 2)); }
    get["length"]() { return this.magnitude; }

    get["unit"]() {
        const length = this.length;
        return new Vector(this.x / length, this.y / length);
    }

    static angleToUnit(angle) {
        return new Vector(cos(angle / 180 * PI), sin(angle / 180 * PI));
    }

    static radToUnit(rad) {
        return new Vector(cos(rad), sin(rad));
    }

    static randomUnit() {
        const randomDirection = random() * 2 * PI;
        return Vector.radToUnit(randomDirection);
    }
}