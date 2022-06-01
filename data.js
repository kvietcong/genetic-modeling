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

const doSomething = () => {
    print("I DID SOMETHING");
    const visualizationDivs = document.getElementById("visualizations");
    dbFindAll(data => {
        data.forEach(runData => {
            console.log("On Run", runData);
            const { organismDataPoints } = runData;

            const rows = runData.villages.length;
            const cols = runData.villages[0].length;
            const villageIndices = range(0, rows-1).map(i =>
                range(0, cols-1).map(j => ({i,j})));
            const tickLabels = organismDataPoints.map(x => `Tick #${x.tick}`);
            const datasets = flatten(villageIndices).map(({i,j}) => {
                const villageEnvironment = runData.villages[i][j].environment;
                let color = villageEnvironment.includes("spiral")
                    ? params.spiralEnvironments[villageEnvironment].color
                    : null;
                if (color == "white") color = "black";
                else if (color == "yellow") color = "gold";
                return {
                    label: `Village ${i}, ${j}`,
                    data: organismDataPoints.map(x => x.organismData[i][j].population),
                    fill: false,
                    borderColor: color ?? getRandomColor(),
                    tension: 0.1,
                };
            });

            const chartData = {
                labels: tickLabels,
                datasets,
            };
            const config = {
                type: "line",
                data: chartData,
            };

            const newChart = document.createElement("canvas");
            visualizationDivs.appendChild(newChart);
            const populationsChart = new Chart(
                newChart,
                config,
            );
        });
    }, "runs");
};
