const paramsToTest = {
    "Template": {
        // How to implement this?
        // params.gene.mutator = (gene) => libGene.mutators.currentLevel.template(gene, libGene.mutators.currentLevel.flip);
        // params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.ORAND);

        // reproduction base
        reproduction_base: 1,
        // gene weights
        gene_weight: 0,
        ind_weight: 0,
        soc_weight: 0,
        sexualReproThreshold: 0.5,
        migrationThreshold: 0.01,

        // ticket multipliers
        ind_learn_ticket_multiplier: 0.04,
        soc_learn_ticket_multiplier: 0.04,
        SLoption: 0, // 0 = Random of all options below

        // World params
        isolated: false, // false = neighborly
        worldSize: 5,
        worldType: 'random',
        
        // Gene 
        cellSize: 5,
        fillToLevel: 0,
        partitionSize: 1,
        mutationChance: 0.05,
        initialPartitions: 5,

        stepsPerSecond: 20,
        population: 20,
        isDebugging: true,
        debugEntities: {},

        defaultIP: "http://76.28.146.35:8888",
        // defaultIP: "localhost:8888",

        SLradios: 0,
    
        // Soft Cap
        softcap_modifier: 30,   // Take population you want and divide by this number. If the number is 5 or more,
                                // then the population growth will stop at that point.

        collector: {
            ticksPerGet: 800,
        },
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
        },
        spiralEnvironments: {
            ///////////
                spiral00: {
                    name : "spiral00",
                    color: "white",
                    reward: 1,
                    threshold: [5,5,5,5,5]
                },
                spiral01: {
                    name : "spiral01",
                    color: "lightblue",
                    reward: 1,
                    threshold: [0,0,0,5,5]
                },
                spiral02: {
                    name : "spiral02",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,1,5,5]
                },
                spiral03: {
                    name : "spiral03",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,2,5,5]
                },
                spiral04: {
                    name : "spiral04",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,3,5,5]
                },
            ////////////////////
                spiral10: {
                    name : "spiral10",
                    color: "white",
                    reward: 1,
                    threshold: [4,5,5,5,5]
                },
                spiral11: {
                    name : "spiral11",
                    color: "lightblue",
                    reward: 1,
                    threshold: [0,0,0,4,5]
                },
                spiral12: {
                    name : "spiral12",
                    color: "green",
                    reward: 1,
                    threshold: [0,0,0,0,2]
                },
                spiral13: {
                    name : "spiral13",
                    color: "green",
                    reward: 1,
                    threshold: [0,0,0,0,3]
                },
                spiral14: {
                    name : "spiral14",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,4,5,5]
                },
            /////////////
            spiral20: {
                name : "spiral20",
                color: "white",
                reward: 1,
                threshold: [3,5,5,5,5]
            },
            spiral21: {
                name : "spiral21",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,3,5]
            },
            spiral22: {
                name : "spiral22",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,0]
            },
            spiral23: {
                name : "spiral23",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,4]
            },
            spiral24: {
                name : "spiral24",
                color: "brown",
                reward: 1,
                threshold: [0,0,5,5,5]
            },
            //////////////
            spiral30: {
                name : "spiral30",
                color: "white",
                reward: 1,
                threshold: [2,5,5,5,5]
            },
            spiral31: {
                name : "spiral31",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,2,5]
            },
            spiral32: {
                name : "spiral32",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,1,5]
            },
            spiral33: {
                name : "spiral33",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,5]
            },
            spiral34: {
                name : "spiral34",
                color: "yellow",
                reward: 1,
                threshold: [0,1,5,5,5]
            },
            //////////////
            spiral40: {
                name : "spiral40",
                color: "white",
                reward: 1,
                threshold: [1,5,5,5,5]
            },
            spiral41: {
                name : "spiral41",
                color: "yellow",
                reward: 1,
                threshold: [0,5,5,5,5]
            },
            spiral42: {
                name : "spiral42",
                color: "yellow",
                reward: 1,
                threshold: [0,4,5,5,5]
            },
            spiral43: {
                name : "spiral43",
                color: "yellow",
                reward: 1,
                threshold: [0,3,5,5,5]
            },
            spiral44: {
                name : "spiral44",
                color: "yellow",
                reward: 1,
                threshold: [0,2,5,5,5]
            },
        },
        environments: {
            polarice: {
                name: "polarice",
                color: "white",
                reward: 1,          // want an array of task in each environment with different values
                threshold: [4,4,4,4,4]
            },
            desert: {
                name: "desert",
                color: "yellow",
                reward: 1,
                threshold: [3,3,3,3,3]
            },
            mountains: {
                name : "mountains",
                color: "brown",
                reward: 1,
                threshold: [2,2,2,2,2]
            },
            mediterranean: {
                name: "mediterranean",
                color: "lightblue",
                reward: 1,          // want an array of task in each environment with different values
                threshold: [1,1,1,1,1]
            },
            rainforest: {
                name : "rainforest",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,0]
            },
        }
    },

    "No Learning": {
        // How to implement this?
        // params.gene.mutator = (gene) => libGene.mutators.currentLevel.template(gene, libGene.mutators.currentLevel.flip);
        // params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.ORAND);

        // reproduction base
        reproduction_base: 1,
        // gene weights
        gene_weight: 0,
        ind_weight: 0,
        soc_weight: 0,
        sexualReproThreshold: 0.5,
        migrationThreshold: 0.01,

        // ticket multipliers
        ind_learn_ticket_multiplier: 0,
        soc_learn_ticket_multiplier: 0,
        SLoption: 0, // 0 = Random of all options below

        // World params
        isolated: false, // false = neighborly
        worldSize: 5,
        worldType: 'spiral',
        
        // Gene 
        cellSize: 5,
        fillToLevel: 0,
        partitionSize: 1,
        mutationChance: 0.05,
        initialPartitions: 5,

        stepsPerSecond: 20,
        population: 20,
        isDebugging: true,
        debugEntities: {},

        defaultIP: "http://76.28.146.35:8888",
        // defaultIP: "localhost:8888",

        SLradios: 0,
    
        // Soft Cap
        softcap_modifier: 30,   // Take population you want and divide by this number. If the number is 5 or more,
                                // then the population growth will stop at that point.

        collector: {
            ticksPerGet: 800,
        },
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
        },
        spiralEnvironments: {
            ///////////
                spiral00: {
                    name : "spiral00",
                    color: "white",
                    reward: 1,
                    threshold: [5,5,5,5,5]
                },
                spiral01: {
                    name : "spiral01",
                    color: "lightblue",
                    reward: 1,
                    threshold: [0,0,0,5,5]
                },
                spiral02: {
                    name : "spiral02",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,1,5,5]
                },
                spiral03: {
                    name : "spiral03",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,2,5,5]
                },
                spiral04: {
                    name : "spiral04",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,3,5,5]
                },
            ////////////////////
                spiral10: {
                    name : "spiral10",
                    color: "white",
                    reward: 1,
                    threshold: [4,5,5,5,5]
                },
                spiral11: {
                    name : "spiral11",
                    color: "lightblue",
                    reward: 1,
                    threshold: [0,0,0,4,5]
                },
                spiral12: {
                    name : "spiral12",
                    color: "green",
                    reward: 1,
                    threshold: [0,0,0,0,2]
                },
                spiral13: {
                    name : "spiral13",
                    color: "green",
                    reward: 1,
                    threshold: [0,0,0,0,3]
                },
                spiral14: {
                    name : "spiral14",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,4,5,5]
                },
            /////////////
            spiral20: {
                name : "spiral20",
                color: "white",
                reward: 1,
                threshold: [3,5,5,5,5]
            },
            spiral21: {
                name : "spiral21",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,3,5]
            },
            spiral22: {
                name : "spiral22",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,0]
            },
            spiral23: {
                name : "spiral23",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,4]
            },
            spiral24: {
                name : "spiral24",
                color: "brown",
                reward: 1,
                threshold: [0,0,5,5,5]
            },
            //////////////
            spiral30: {
                name : "spiral30",
                color: "white",
                reward: 1,
                threshold: [2,5,5,5,5]
            },
            spiral31: {
                name : "spiral31",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,2,5]
            },
            spiral32: {
                name : "spiral32",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,1,5]
            },
            spiral33: {
                name : "spiral33",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,5]
            },
            spiral34: {
                name : "spiral34",
                color: "yellow",
                reward: 1,
                threshold: [0,1,5,5,5]
            },
            //////////////
            spiral40: {
                name : "spiral40",
                color: "white",
                reward: 1,
                threshold: [1,5,5,5,5]
            },
            spiral41: {
                name : "spiral41",
                color: "yellow",
                reward: 1,
                threshold: [0,5,5,5,5]
            },
            spiral42: {
                name : "spiral42",
                color: "yellow",
                reward: 1,
                threshold: [0,4,5,5,5]
            },
            spiral43: {
                name : "spiral43",
                color: "yellow",
                reward: 1,
                threshold: [0,3,5,5,5]
            },
            spiral44: {
                name : "spiral44",
                color: "yellow",
                reward: 1,
                threshold: [0,2,5,5,5]
            },
        },
        environments: {
            polarice: {
                name: "polarice",
                color: "white",
                reward: 1,          // want an array of task in each environment with different values
                threshold: [4,4,4,4,4]
            },
            desert: {
                name: "desert",
                color: "yellow",
                reward: 1,
                threshold: [3,3,3,3,3]
            },
            mountains: {
                name : "mountains",
                color: "brown",
                reward: 1,
                threshold: [2,2,2,2,2]
            },
            mediterranean: {
                name: "mediterranean",
                color: "lightblue",
                reward: 1,          // want an array of task in each environment with different values
                threshold: [1,1,1,1,1]
            },
            rainforest: {
                name : "rainforest",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,0]
            },
        }
    },

    "No Genetic Evolution": {
        // How to implement this?
        // params.gene.mutator = (gene) => libGene.mutators.currentLevel.template(gene, libGene.mutators.currentLevel.flip);
        // params.gene.recomboer = (gene, otherGene) => libGene.recomboers.perCell.template(gene, otherGene, libGene.recomboers.perCell.ORAND);

        // reproduction base
        reproduction_base: 1,
        // gene weights
        gene_weight: 1000,
        ind_weight: 0,
        soc_weight: 0,
        sexualReproThreshold: 0.5,
        migrationThreshold: 0.01,

        // ticket multipliers
        ind_learn_ticket_multiplier: 0.04,
        soc_learn_ticket_multiplier: 0.04,
        SLoption: 0, // 0 = Random of all options below

        // World params
        isolated: false, // false = neighborly
        worldSize: 5,
        worldType: 'spiral',
        
        // Gene 
        cellSize: 5,
        fillToLevel: 0,
        partitionSize: 1,
        mutationChance: 0.05,
        initialPartitions: 5,

        stepsPerSecond: 20,
        population: 20,
        isDebugging: true,
        debugEntities: {},

        defaultIP: "http://76.28.146.35:8888",
        // defaultIP: "localhost:8888",

        SLradios: 0,
    
        // Soft Cap
        softcap_modifier: 30,   // Take population you want and divide by this number. If the number is 5 or more,
                                // then the population growth will stop at that point.

        collector: {
            ticksPerGet: 800,
        },
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
        },
        spiralEnvironments: {
            ///////////
                spiral00: {
                    name : "spiral00",
                    color: "white",
                    reward: 1,
                    threshold: [5,5,5,5,5]
                },
                spiral01: {
                    name : "spiral01",
                    color: "lightblue",
                    reward: 1,
                    threshold: [0,0,0,5,5]
                },
                spiral02: {
                    name : "spiral02",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,1,5,5]
                },
                spiral03: {
                    name : "spiral03",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,2,5,5]
                },
                spiral04: {
                    name : "spiral04",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,3,5,5]
                },
            ////////////////////
                spiral10: {
                    name : "spiral10",
                    color: "white",
                    reward: 1,
                    threshold: [4,5,5,5,5]
                },
                spiral11: {
                    name : "spiral11",
                    color: "lightblue",
                    reward: 1,
                    threshold: [0,0,0,4,5]
                },
                spiral12: {
                    name : "spiral12",
                    color: "green",
                    reward: 1,
                    threshold: [0,0,0,0,2]
                },
                spiral13: {
                    name : "spiral13",
                    color: "green",
                    reward: 1,
                    threshold: [0,0,0,0,3]
                },
                spiral14: {
                    name : "spiral14",
                    color: "brown",
                    reward: 1,
                    threshold: [0,0,4,5,5]
                },
            /////////////
            spiral20: {
                name : "spiral20",
                color: "white",
                reward: 1,
                threshold: [3,5,5,5,5]
            },
            spiral21: {
                name : "spiral21",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,3,5]
            },
            spiral22: {
                name : "spiral22",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,0]
            },
            spiral23: {
                name : "spiral23",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,4]
            },
            spiral24: {
                name : "spiral24",
                color: "brown",
                reward: 1,
                threshold: [0,0,5,5,5]
            },
            //////////////
            spiral30: {
                name : "spiral30",
                color: "white",
                reward: 1,
                threshold: [2,5,5,5,5]
            },
            spiral31: {
                name : "spiral31",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,2,5]
            },
            spiral32: {
                name : "spiral32",
                color: "lightblue",
                reward: 1,
                threshold: [0,0,0,1,5]
            },
            spiral33: {
                name : "spiral33",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,5]
            },
            spiral34: {
                name : "spiral34",
                color: "yellow",
                reward: 1,
                threshold: [0,1,5,5,5]
            },
            //////////////
            spiral40: {
                name : "spiral40",
                color: "white",
                reward: 1,
                threshold: [1,5,5,5,5]
            },
            spiral41: {
                name : "spiral41",
                color: "yellow",
                reward: 1,
                threshold: [0,5,5,5,5]
            },
            spiral42: {
                name : "spiral42",
                color: "yellow",
                reward: 1,
                threshold: [0,4,5,5,5]
            },
            spiral43: {
                name : "spiral43",
                color: "yellow",
                reward: 1,
                threshold: [0,3,5,5,5]
            },
            spiral44: {
                name : "spiral44",
                color: "yellow",
                reward: 1,
                threshold: [0,2,5,5,5]
            },
        },
        environments: {
            polarice: {
                name: "polarice",
                color: "white",
                reward: 1,          // want an array of task in each environment with different values
                threshold: [4,4,4,4,4]
            },
            desert: {
                name: "desert",
                color: "yellow",
                reward: 1,
                threshold: [3,3,3,3,3]
            },
            mountains: {
                name : "mountains",
                color: "brown",
                reward: 1,
                threshold: [2,2,2,2,2]
            },
            mediterranean: {
                name: "mediterranean",
                color: "lightblue",
                reward: 1,          // want an array of task in each environment with different values
                threshold: [1,1,1,1,1]
            },
            rainforest: {
                name : "rainforest",
                color: "green",
                reward: 1,
                threshold: [0,0,0,0,0]
            },
        }
    },
}