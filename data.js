window.addEventListener("load", () => {
    document.getElementById("server-ip").value = params.defaultIP;
});

const findAndOutput = () => {
    dbFindAll(data => {
        console.log("Received", data);
        console.log("Now putting it into the document");
        document.getElementById("data").innerHTML = JSON.stringify(data, null, document.getElementById("prettify").checked && 4);
    }, "runs");
};

const getDistinctRunTypes = () => {
    socket.emit("distinct", {
        "db": "genetic-modeling",
        "collection": "runs",
        "query": {},
        "key": "params.description"
    });
    socket.once("distinct", data => {
        const selector = document.getElementById("runTypes");
        data.forEach(description => {
            const option = document.createElement("option");
            option.textContent = description;
            option.value = description;
            selector.appendChild(option);
        });
    });
};

const doSomething = () => {
    print("I DID SOMETHING");
    const visualizationsElement = document.getElementById("visualizations");
    while (visualizationsElement.lastChild) {
        visualizationsElement.removeChild(visualizationsElement.lastChild);
    }
    const runType = document.getElementById("runTypes").value;
    dbFind(
        "genetic-modeling",
        "runs",
        {"params.description": runType},
        data => {
            data.forEach(runData => {
                console.log("On Run", runData);
                const { organismDataPoints } = runData;

                const graphReduction = 5;
                ;
                const rows = runData.villages.length;
                const cols = runData.villages[0].length;
                const villageIndices = range(0, rows-1).map(i =>
                    range(0, cols-1).map(j => ({i,j})));
                const tickLabels = organismDataPoints
                    .filter((_, i) => i % graphReduction === 0)
                    .map(x => `Tick #${x.tick}`)
                const datasets = flatten(villageIndices).map(({i,j}) => {
                    const villageEnvironment = runData.villages[i][j].environment;
                    let color = villageEnvironment.includes("spiral")
                        ? params.spiralEnvironments[villageEnvironment].color
                        : null;
                    if (color == "white") color = "black";
                    else if (color == "yellow") color = "gold";
                    return {
                        label: `Village ${i}, ${j}`,
                        data: organismDataPoints
                            .filter((_, i) => i % graphReduction === 0)
                            .map(x => x.organismData[i][j].population),
                        fill: false,
                        borderColor: color ?? getRandomColor(),
                        tension: 0.1,
                    };
                });

                const chartData = {
                    labels: tickLabels,
                    datasets,
                };

                // Animation is weird
                const delayBetweenPoints = 50;
                const previousY = (ctx) => ctx.index === 0
                    ? ctx.chart.scales.y.getPixelForValue(100)
                    : ctx.chart
                        .getDatasetMeta(ctx.datasetIndex)
                        .data[ctx.index - 1]
                        .getProps(["y"], true).y;
                const animation = {
                    x: {
                        type: "number",
                        easing: "linear",
                        duration: delayBetweenPoints,
                        from: NaN, // the point is initially skipped
                        delay(ctx) {
                            if (ctx.type !== "data" || ctx.xStarted) {
                                return 0;
                            }
                            ctx.xStarted = true;
                            return ctx.index * delayBetweenPoints;
                        }
                    },
                    y: {
                        type: "number",
                        easing: "linear",
                        duration: delayBetweenPoints,
                        from: previousY,
                        delay(ctx) {
                            if (ctx.type !== "data" || ctx.yStarted) {
                                return 0;
                            }
                            ctx.yStarted = true;
                            return ctx.index * delayBetweenPoints;
                        }
                    }
                };

                const config = {
                    type: "line",
                    data: chartData,
                    options: {
                        // animation,
                    }
                };

                const newChartElement = document.createElement("canvas");
                visualizationsElement.appendChild(newChartElement);

                const populationsChart = new Chart(
                    newChartElement,
                    config,
                );

            });
        });
};
