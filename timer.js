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

class DebugFrameTimer {
    static timerCount = 0;

    constructor(label, isDebugging = params.isDebugging) {
        DebugFrameTimer.timerCount++;
        if (!label) this.label = `#${DebugFrameTimer.timerCount}`
        else this.label = label;
        this.reset();
        this.isDebugging = isDebugging;
    }

    get averageFramesPerMillisecond() {
        return this.frames / this.totalTimeElapsed;
    }

    get averageMillisecondsPerFrames() {
        return 1 / this.averageFramesPerMillisecond;
    }

    get averageFramesPerSecond() { return this.averageFramesPerMillisecond * 1000; }

    reset() {
        this.frames = 0;
        this.averageFPSElementID = null;
        this.framesPerSecond = 0;
        this.totalTimeElapsed = 0;
    }

    tick() {
        this.frames++;
        if (this.lastTime) {
            const currentTime = Date.now();
            const timeElapsed = (currentTime - this.lastTime);
            this.totalTimeElapsed += timeElapsed;
            this.framesPerSecond = 1000 / timeElapsed;
            if (this.isDebugging) console.log(`${this.label}: ${timeElapsed}ms`);
        }
        this.updateFPSElement();
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
        if (elementID) this.averageFPSElementID = elementID;
        if (!this.averageFPSElementID) return;
        const element = document.getElementById(this.averageFPSElementID);
        element.innerText = `${this.averageFramesPerSecond.toFixed(2)}`;
    }

    updateFPSElement(elementID) {
        if (elementID) this.fpsElementID = elementID;
        if (!this.fpsElementID) return;
        const element = document.getElementById(this.fpsElementID);
        if (element) element.innerText = `${this.framesPerSecond.toFixed(2)}`;
        else this.reset();
    }
}

class DebugFunctionTimer {
    static timerCount = 0;

    constructor(label, isDebugging = params.isDebugging) {
        DebugFunctionTimer.timerCount++;
        if (!label) this.label = `$${DebugFunctionTimer.timerCount}`
        else this.label = label;
        this.reset();
        this.isDebugging = isDebugging;
    }

    get averageMillisecondsPerExecution() {
        return this.totalTimeElapsed / this.executions;
    }

    reset() {
        this.executions = 0;
        this.elementID = null;
        this.totalTimeElapsed = 0;
    }

    attachTo(object, functionName) {
        this.reset();
        const oldFunction = object[functionName];
        object[functionName] = (...args) => {
            const currentTime = Date.now();

            oldFunction.apply(object, args);

            const timeElapsed = (Date.now() - currentTime);
            this.executions++;
            this.totalTimeElapsed = timeElapsed;
        };
        return this;
    }
}