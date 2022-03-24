// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {
    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Everything that will be updated and drawn each frame
        this.entities = [];
        // Entities to be added at the end of each update
        this.entitiesToAdd = [];

        // Information on the input
        this.click = null;
        this.mouse = null;
        this.wheel = null;

        // THE KILL SWITCH
        this.isRunning = false;

        this.isPaused = false;

        // Options and the Details
        this.options = options || params.defaultGameEngineOptions;
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
    };

    start() {
        this.isRunning = true;
        const gameLoop = () => {
            this.loop();
            if (this.isRunning) {
                requestAnimFrame(gameLoop, this.ctx.canvas);
            }
        };
        gameLoop();
    };

    stop() { this.isRunning = false; }

    startInput() {
        const getXandY = e => ({
            x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
            y: e.clientY - this.ctx.canvas.getBoundingClientRect().top
        });

        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) {
                console.log("CLICK", getXandY(e));
            }
            this.click = getXandY(e);
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            if (this.options.debugging) {
                console.log("WHEEL", getXandY(e), e.wheelDelta);
            }
            if (this.options.prevent.scrolling) {
                e.preventDefault(); // Prevent Scrolling
            }
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            if (this.options.prevent.contextMenu) {
                e.preventDefault(); // Prevent Context Menu
            }
            this.rightclick = getXandY(e);
        });
    };

    addEntity(entity) {
        this.entitiesToAdd.push(entity);
    };

    draw() {
        // Clear the whole canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        // Draw latest things first
        this.entities.reduceRight((_, entity) => entity.draw?.(this.ctx, this), null);

        if (this.isPaused) {
            this.ctx.fillStyle = rgba(0, 0, 0, 0.5);
            this.ctx.fillRect(0, 0, this.width, this.height);
            const pauseText = "Game Engine Paused";
            const pauseTextWidth = this.ctx.measureText(pauseText).width;
            this.ctx.fillStyle = "red";
            this.ctx.font = "bold 50px Arial";
            // TODO: Find out why the text is not centered
            this.ctx.fillText(
                pauseText,
                this.width / 2 - pauseTextWidth / 2,
                this.height / 2,
                this.width
            );
        }
    };

    update() {
        if (this.isPaused) return;

        // Remove dead things
        this.entities = this.entities.filter(entity => !entity.removeFromWorld);
        // Update Entities
        this.entities.forEach(entity => entity.update?.(this));
        // Add new things
        this.entities = this.entities.concat(this.entitiesToAdd);
        this.entitiesToAdd = [];
    };

    get deltaTime() { return this.clockTick; }
    get width() { return this.ctx.canvas.width; }
    get height() { return this.ctx.canvas.height; }

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    };
};