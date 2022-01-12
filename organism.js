// TODO
// Think of task structure
class Task {
    constructor(doTaskWith, village) { 
        this.village = village;
        this.doTaskWith = doTaskWith;    
        this.reward = 0;        // what the organism gains if the task is completed
        this.taskThresh = 0;   // the requirement to complete the task that is equal to the environment + gene + learn    

    }

    taskSpecifics() {
        
        // We are assuming within each grid box, there is an environment classifcation, and this classification will determine the characteristics of the tasks.
        if(this.village.getEnvironment() === 0) {
            this.reward = 3;        
            this.taskThresh = 5;   
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

    }

    doWith(organism) {

        this.doTaskWith(organism);

    }

}

class Organism {
    // TODO
    // Initialize an organism with proper genes
    // No cost system yet (like energy or health)
    constructor(village) {

        this.village = village; 

        const NUM_TASKS = 5;

        this.reproductionThresh = 50;   // the organism will reproduce
        this.learn = 0;                 // how well the organism will learn
        this.gene = new Gene();
        this.taskCapabiilty = 0;        // will be gene + learn
        this.taskList = [];

    }

    createTaskList(NUM_TASKS){
        let task = new Task(this, village);
        for(let i = 0; i < NUM_TASKS; i++) {
            this.addTask(task);   // adds the task to the task list.
        }
    }

    // TODO
    // Default to Asexual reproduction but should most likely be overridden
    // for sexual reproduction
    // This should just get the corresponding genes and recombine them
    reproduce(otherOrganism = this) {
    }

    // TODO
    addTask(task) {
        this.taskList.push(task);   // adds the task to the task list.       
    }

    // TODO
    doTasks() {
        const successes = this.tasks.map(task => task.doWith(this));
    }

    // TODO
    // Determine how to update itself and interact with its environment (the tile)
    step(tile, grid) {
        // tile.neighbors // This gets neighbors
    }
}