/** Global Parameters Object */
const params = {
    isDebugging: true,
};

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

/** A class to represent a 2D vector */
class Vector {
    x; y;

    constructor(x = 0, y = 0) {
        this.x = x; this.y = y;
    }

    clone() { return new Vector(this.x, this.y); }

    static detectInput(...input) {
        if (input.length === 1 && input[0] instanceof Vector) {
            return { x: input[0].x, y: input[0].y };
        }
        if (input.length === 2
            && typeof input[0] === "number"
            && typeof input[1] === "number"
        ) {
            return { x: input[0], y: input[1] };
        }
        throw new Error("Invalid input");
    }

    set(...input) {
        const { x, y } = Vector.detectInput(...input);
        this.x = x; this.y = y; return this;
    }

    add(...input) {
        const { x, y } = Vector.detectInput(...input);
        return this.clone().addInPlace(x, y);
    }

    addInPlace(...input) {
        const { x, y } = Vector.detectInput(...input);
        this.x += x; this.y += y; return this;
    }

    subtract(...input) {
        const { x, y } = Vector.detectInput(...input);
        return this.clone().subtractInPlace(x, y);
    }

    subtractInPlace(...input) {
        const { x, y } = Vector.detectInput(...input);
        this.x -= x; this.y -= y; return this;
    }

    scale(scaleFactor) {
        return this.clone().scaleInPlace(scaleFactor);
    }

    scaleInPlace(scaleFactor) {
        this.x *= scaleFactor; this.y *= scaleFactor; return this;
    }

    lerpTo(destinationVector, t) {
        return this.clone().lerpInPlace(destinationVector, t);
    }

    lerpToInPlace(destinationVector, t) {
        return this.addInPlace(destinationVector.subtract(this).scale(t));
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    angleTo(vector) {
        return Vector.angleBetween(this, vector);
    }

    rotate(angle) {
        return this.clone().rotateInPlace(angle);
    }

    rotateInPlace(angle) {
        const { x, y } = this;
        const cosVal = cos(angle); const sinVal = sin(angle);
        this.x = x * cosVal - y * sinVal; this.y = x * sinVal + y * cosVal;
        return this;
    }

    rotateTo(vector) {
        return this.clone().rotateToInPlace(vector);
    }

    rotateToInPlace(vector) {
        return this.rotateInPlace(this.angleTo(vector));
    }

    setUnit() { return this.set(this.unit); }

    get["magnitude"]() { return getDistance(0, 0, this.x, this.y); }

    get["unit"]() {
        const length = sqrt(sq(this.x) + sq(this.y));
        if (length === 0) return new Vector(0, 0);
        return new Vector(this.x / length, this.y / length);
    }

    static angleBetween(vector1, vector2) {
        return acos(
            vector1.dot(vector2)
            / (vector1.magnitude * vector2.magnitude)
        );
    }

    static angleToUnitVector(angle) {
        return new Vector(cos(angle / 180 * PI), sin(angle / 180 * PI));
    }

    static radToUnitVector(rad) {
        return new Vector(cos(rad), sin(rad));
    }

    static randomUnitVector() {
        const randomDirection = random() * 2 * PI;
        return Vector.radToUnitVector(randomDirection);
    }

    static lerp(vector1, vector2, t) {
        return vector1.add(vector2.subtract(vector1).scale(t));
    }

    static coordinatesToVector(x1, y1, x2, y2) {
        return new Vector(x2 - x1, y2 - y1);
    }

    static pointsToVector(p1, p2) {
        return Vector.coordinatesToVector(p1.x, p1.y, p2.x, p2.y);
    }
}