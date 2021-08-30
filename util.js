/**
 * @param {Number} n
 * @returns Random Integer Between 0 and n-1
 */
function randomInt(n) {
    return Math.floor(Math.random() * n);
};

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
 * @param {Number} l Lightnes
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
        function (/* function */ callback, /* DOMElement */ element) {
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

/** Easy access to math functions */
const {pow, ceil, floor, round, log2: lg, max, min} = Math

/** Global Parameters Object */
const params = {};