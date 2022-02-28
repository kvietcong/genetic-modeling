// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class Timer {
    constructor() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.lastTimestamp = 0;
    };

    tick() {
        const current = Date.now();
        const delta = (current - this.lastTimestamp) / 1000;
        this.lastTimestamp = current;

        const gameDelta = Math.min(delta, this.maxStep);
        this.gameTime += gameDelta;
        return gameDelta;
    };
};

class DebugTimer {
    static debugTimerCount = 0;

    constructor(label, isDebugging = params.isDebugging) {
        if (!label) this.label = `#${++DebugTimer.debugTimerCount}`
        else this.label = label;
        this.reset();
        this.isDebugging = isDebugging;
    }

    get averageTicksPerMillisecond() {
        return this.ticks / this.totalTimeElapsed;
    }

    get averageMillisecondsPerTick() {
        return 1 / this.averageTicksPerMillisecond;
    }

    get averageTicksPerSecond() { return this.averageTicksPerMillisecond * 1000; }
    get averageFramesPerSecond() { return this.averageTicksPerSecond }

    reset() {
        this.ticks = 0;
        this.elementID = null;
        this.framesPerSecond = 0;
        this.totalTimeElapsed = 0;
    }

    tick() {
        this.ticks++;
        if (this.lastTime) {
            const currentTime = Date.now();
            const timeElapsed = (currentTime - this.lastTime);
            this.totalTimeElapsed += timeElapsed;
            this.framesPerSecond = 1000 / timeElapsed;
            if (this.isDebugging) console.log(`${this.label}: ${timeElapsed}ms`);
        }
        this.updateAverageFPSElement();
    }

    attachTo(object, functionName) {
        this.reset();
        const oldFunction = object[functionName];
        object[functionName] = (...args) => {
            this.tick();
            this.lastTime = Date.now();
            oldFunction.apply(object, args);
        };
        return this;
    }

    updateAverageFPSElement(elementID) {
        if (elementID) this.elementID = elementID;
        if (!this.elementID) return;
        const element = document.getElementById(this.elementID);
        element.innerText = `${this.framesPerSecond.toFixed(2)}`;
    }
}