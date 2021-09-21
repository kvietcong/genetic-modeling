/** Easy access to math functions */
const {pow, ceil, floor, round, log, log2: lg, max, min, random} = Math

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
function rgb(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
};

/**
 * @param {Number} h Hue
 * @param {Number} s Saturation
 * @param {Number} l Lightness
 * @returns String that can be used as a hsl web color
 */
function hsl(h, s, l) {
    return "hsl(" + h + "," + s + "%," + l + "%)";
};

/** Creates an alias for requestAnimationFrame for backwards compatibility */
window.requestAnimFrame = (function () {
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
        function (callback, element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

/**
 * Random Integer between two numbers inclusively
 * @param {Number} min Lower bound
 * @param {Number} max Upper bound
 */
const getRandomInteger = (min, max) =>
    round(Math.random() * (max - min) + min);

/**
 * Compute log with arbitrary base
 * @param {Number} base Base of the log
 * @param {Number} x Number to take log of
 */
const logBase = (base, x) => log(x) / log(base);

/**
 * Deep copy JSON-serializable objects
 * @param {*} object Object to deep copy
 * @returns Deep copy of the object
 */
const deepCopy = object => JSON.parse(JSON.stringify(object));

/**
 * Returns random element from array
 * @param {Array} items
 * @returns Returns random element from array. Null if empty
 */
const chooseRandom = items => items.length > 0
    ? items[floor(random() * items.length)]
    : null;

/** Global Parameters Object */
const params = {
    // Maybe use for toggle-able logging?
    DEBUG: false,
};