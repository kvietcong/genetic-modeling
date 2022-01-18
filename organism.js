/**
 * 
 * Organism & Task classes
 * @author KV, Raz and Kumiko
 * @version Rev 1
 * 
 */

/**
 * Task class:
 * Creates a single task for an organism 
 */
class Task {
    /**
     * Task constructor
     * @param {*} doTaskWith 
     * @param {*} village 
     */
    constructor(doTaskWith, village) {  
        this.village = village;
        this.doTaskWith = doTaskWith;    

        this.reward = 0;        // what the organism gains if the task is completed
        this.taskThresh = 0;   // the requirement to complete the task that is equal to the environment + gene + learn   
        
        this.taskSpecifics();
    };

    /**
     * Specifies the reward from completing a task and the threshold that the organism
     *  must be able to pass to receive the reward. Both are randomly assigned at this point.
     */
    taskSpecifics() {

        this.reward = Math.floor((Math.random()*5) + 1);                // randomly assign the reward
        this.taskThresh = Math.floor((Math.random() * 5) + 1);          // randomly assign the task threshold

        /** We might add this, but initially we thought random assignment would be sufficient.
            // We are assuming within each grid box, there is an environment classifcation, and this classification will determine the characteristics of the tasks.
            if(this.village.getEnvironment() === 0) {
                this.reward = 3;        // what the organism gains if the task is completed
                this.taskThresh = 5;   // the requirement to complete the task that is equal to the environment + gene + learn   
            } 
            else if(this.village.getEnvironment() === 1) {
                this.reward = 2;        
                this.taskThresh = 2;   
            }
            else if(this.village.getEnvironment() === 2) {
                this.reward = 3;        
                this.taskThresh = 2;   
            }
            else if(this.village.getEnvironment() === 3) {
                this.reward = 4;       
                this.taskThresh = 1;   
            } 
            else {
                this.reward = 2;        
                this.taskThresh = 4;   
            } 
        */
    };

    /**
     * getReward function that just returns the reward for the task
     * @returns the reward
     */
    getReward() {
        return this.reward;
    };

    /**
     * getTaskThresh function that returns the threshold requirded for the organism to 
     * get the reward assigned to the task.
     * @returns the task threshold
     */
    getTaskThresh() {
        return this.taskThresh;
    };

/*  Do we really need this? We want to set up tasks and then assign them to individual Organsims.
    But can't two different Organisms have the same task. 

    doWith(organism) {

        this.doTaskWith(organism);

    };
*/
};

/**
 * Organism class:
 * Creates a single organism 
 */
class Organism {
    // TODO
    // Initialize an organism with proper genes
    // No cost system yet (like energy or health)

    /**
     * Constructor for the Organism
     * @param {*} village 
     * @param {*} parent 
     */
    constructor(village, parent) {
        this.village = village;         // the village that the Organism lives in
        this.parent = parent;           // the parent of the Organism

        // Constants associated with every Organisma
        const NUM_TASKS = 5;            // the number of tasks that the Organism has to do
        const REPRODUCTION_THRESH = 50; // assume this will be the same for every Organism
    
        // Instance variables
        // Creation of the genes associated with the current organism
        if (this.parent !== null) { // if there's a parent organism
            this.gene = new Gene().recombine(parent.gene, parent.gene); // we're sending two of the of the same
                                                                        // geneome to the recomboer.
        } else {
            this.gene = new Gene(); // if this is the first set of organisms created
        }
        this.learn = 0;                 // how well the organism will learn
        this.taskCapabiilty = 0;        // will be gene + learn
                                        // *****************************************
                                        // We need to figure out how to get the current complete level of the gene
                                        // *****************************************

        this.taskList = [];             // all the tasks that this organism can start in one day

        this.successes = 0;             // keep track of successes on the tasks
        this.failures = 0;              // will allow percentage calculation
        this.energy = 0;                // energy of the Organism

        this.createTaskList(NUM_TASKS);

    };

    /**
     * getTaskCapability function
     * @returns the capability of the organism to complete a task
     */
    getTaskCapability() {
        this.taskCapabiilty = this.learn + this.gene.get(); // this.gene.get() is in place of getting the level of the genes
        return this.taskCapabiilty;
    }

    /**
     * createTaskList:
     * will create a list of the tasks that the organism will attempt in a tick.
     * @param {*} num 
     */
    createTaskList(num){
        let task = new Task(this, village);
        for(let i = 0; i < num; i++) {
            this.addTask(task);   // adds the task to the task list.
        }
    };

    // TODO
    // Default to Asexual reproduction but should most likely be overridden
    // for sexual reproduction
    // This should just get the corresponding genes and recombine them
    /**
     * reproduce
     * Will create a new Organism based on the current Organism.
     * @param {*} otherOrganism 
     */
    reproduce(otherOrganism = this) {
        if(this.energy >= REPRODUCTION_THRESH) {
            this.energy -= REPRODUCTION_THRESH;
            new Organism(this.village, this);         
        }
    };


    /**
     * Add a task to the list of tasks that the organism will attempt in a tick
     * @param {*} task 
     */
    addTask(task) {
        this.taskList.push(task);   // adds the task to the task list.       
    };

    /**
     * the organsim will attempt all the tasks in the task list
     * @param {*} num 
     */
    doTasks(num) {
        //const successes = this.tasks.map(task => task.doWith(this));
        for(let i = 0; i < num; i++) {
            if(this.taskCapabiilty >= this.taskList[i].getTaskThresh) {
                this.successes++;
                this.energy += this.taskList[i].getReward;
            } else {
                this.failures++;
                this.energy -= this.taskList[i].getTaskThresh;
            }
        }
    };

    
    /**
     * This will return the success rate of this Organism in completing the tasks
     * @returns the success rate
     */
    getSuccessRate() {
        return this.successes / (this.successes + this.failures);
    };

    // TODO
    // Determine how to update itself and interact with its environment (the tile)
    /**
     * step function will advance the organism by a day every tick
     * @param {*} tile 
     * @param {*} grid 
     */
    step(tile, grid) {
        // tile.neighbors // This gets neighbors
        const TICK = this.game.clockTick;  // assuming that each tick is a day

        /**
         * I'm not sure how to implement this so that the tasks only complete on a tick? Does the step function only
         * happen every tick?
         */
        this.doTasks(NUM_TASKS);
        this.reproduce(this); // right now we're working with asexual reproduction so I'm just returing this organism.


    };
};