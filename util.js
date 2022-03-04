/** Global Parameters Object */
const params = {
    // Maybe use for toggle-able logging?
    isDebugging: true,
    debugEntities: {},
    migrationThreshold: 0,
    SLradios: 0,
    sexualReproThreshold: 0,
    SLcheck: false,
    socialChance: 0,
    socialDays: 0, 
    ILcheck: false,
    indChance: 0,
    indDays: 0, 
    worldSize: 5,
    worldType: 'random',
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