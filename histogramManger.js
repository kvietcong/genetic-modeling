class HistogramManager {
    types = ["learn", "gene", "individual", "social"];

    constructor(histograms, type = "learn") {
        this.histogramSelectorElement =
            document.getElementById("histogramType");
        if (this.histogramSelectorElement)
        this.histogramSelectorElement.addEventListener("change",
            event => this.histogramType = event.target.value);

        this.histogramCollectionRateElement =
            document.getElementById("histogramCollectionRate");
        if (this.histogramCollectionRateElement)
        this.histogramCollectionRateElement.addEventListener("change",
            event => this.collectionRate = event.target.value);

        this.histogramDrawLastElement =
            document.getElementById("histogramDrawLast");
        if (this.histogramDrawLastElement)
        this.histogramDrawLastElement.addEventListener("change",
            event => this.drawLast = Number(event.target.value));

        this.histogramDownloadCurrentElement = document.getElementById("histogramDownloadCurrent");
        if (this.histogramDownloadCurrentElement)
        this.histogramDownloadCurrentElement.addEventListener("click", _ => this.downloadCSVForType());

        this.histogramDownloadAllElement = document.getElementById("histogramDownloadAll");
        if (this.histogramDownloadAllElement)
        this.histogramDownloadAllElement.addEventListener("click", _ => this.downloadCSVForAllTypes());

        this.histogramUploadCurrentElement = document.getElementById("histogramUploadCurrent");
        if (this.histogramUploadCurrentElement)
        this.histogramUploadCurrentElement.addEventListener("click", _ => this.uploadForType());

        this.histogramUploadAllElement = document.getElementById("histogramUploadAll");
        if (this.histogramUploadAllElement)
        this.histogramUploadAllElement.addEventListener("click", _ => this.uploadForAllTypes());

        this.histograms = histograms;
        this.drawLast = histograms[0][0][type].drawLast;
        this.collectionRate = histograms[0][0][type].unitTimePerUpdate;
        this.histogramType = type;
    }

    get collectionRate() { return this._collectionRate; }
    set collectionRate(collectionRate) {
        this._collectionRate = collectionRate;
        for (const row of this.histograms) {
            for (const histogramInfo of row) {
                this.types.forEach(type =>
                    histogramInfo[type].unitTimePerUpdate = collectionRate);
            }
        }
        this.histogramCollectionRateElement.value = this.collectionRate;
    }

    get drawLast() { return this._drawLast; }
    set drawLast(drawLast) {
        this._drawLast = drawLast;
        for (const row of this.histograms) {
            for (const histogramInfo of row) {
                this.types.forEach(type =>
                    histogramInfo[type].drawLast = drawLast);
            }
        }
        this.histogramDrawLastElement.value = this.drawLast;
    }

    get histogramType() { return this._histogramType; }
    set histogramType(type) {
        this._histogramType = type;
        this.histograms.forEach(row =>
            row.forEach(histogramInfo =>
                Object.keys(histogramInfo).forEach(key =>
                    histogramInfo[key].isDrawing = key === type)));

        if (this.histogramSelectorElement)
        this.histogramSelectorElement.value = this.histogramType;
    }

    toCSVTextArray(type) {
        type = type ?? this.histogramType;
        const csvTextArray = [];
        for (const [i, row] of this.histograms.entries()) {
            csvTextArray[i] = [];
            for (const [j, histogramInfo] of row.entries()) {
                csvTextArray[i][j] = histogramInfo[type].toCSVText();
            }
        }
        return csvTextArray;
    }

    downloadZip(zip) {
        console.log("Beginning to Zip");
        let lastProgress = -1;
        zip.generateAsync(
            {
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9,
                },
            },
            metadata => {
                let newProgress = floor(metadata.percent.toFixed(0) / 5) * 5;
                if (lastProgress === newProgress) return;
                lastProgress = newProgress;
                console.log(`Zipping Progress: ${metadata.percent.toFixed(0)}%`)
            },
        ).then(content => {
                const currentDate = new Date();
                const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}-${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
                const allCSVData = new Blob([content]);
                const url = URL.createObjectURL(allCSVData);
                const link = document.createElement("a");
                link.href = url;
                link.target = "_blank";
                link.download = `${dateString}.zip`;
                link.click();
            });
    }

    downloadCSVForType(type) {
        const zip = new JSZip();
        for (const [i, row] of this.toCSVTextArray(type).entries()) {
            for (const [j, csvData] of row.entries()) {
                zip.file(`${i}.${j}.csv`, csvData);
            }
        }
        this.downloadZip(zip);
    }

    downloadCSVForAllTypes() {
        const zip = new JSZip();
        for (const type of this.types) {
            for (const [i, row] of this.toCSVTextArray(type).entries()) {
                for (const [j, csvData] of row.entries()) {
                    zip.folder(type).file(`${i}.${j}.csv`, csvData);
                }
            }
        }
        this.downloadZip(zip);
    }

    uploadForType(type) {
        type = type ?? this.histogramType;
        let ticks = 0;
        const data = this.histograms.reduce((acc, row, i) => {
            acc.push([]);
            row.forEach((histogramInfo, j) => {
                acc[i][j] = histogramInfo[type].allCounts.slice();
                ticks = ticks || acc[i][j].length;
            });
            return acc;
        }, []);

        const payload = {
            db: "genetic-modeling",
            collection: "histogramData",
            data: {
                data,
                type,
                ticks,
                date: new Date(),
            },
        };

        console.log("Sending: ", payload)
        if (connection.isConnected) socket.emit("insert", payload);
        else alert("NOT CONNECTED");
    }

    uploadForAllTypes() { this.types.forEach(type => this.uploadForType(type)); }
}

