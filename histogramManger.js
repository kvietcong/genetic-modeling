class HistogramManager {
    types = ["learn", "gene", "individual", "social"];

    constructor(histograms, type = "learn") {
        this.histogramSelectorElement =
            document.getElementById("histogramType");
        this.histogramSelectorCallback = event => this.histogramType = event.target.value;
        this.histogramSelectorElement
            ?.addEventListener("change", this.histogramSelectorCallback);

        this.histogramCollectionRateElement =
            document.getElementById("histogramCollectionRate");
        this.histogramCollectionCallback = event => this.collectionRate = event.target.value;
        this.histogramCollectionRateElement
            ?.addEventListener("change", this.histogramCollectionCallback);

        this.histogramDrawLastElement =
            document.getElementById("histogramDrawLast");
        this.histogramDrawLastCallback = event => this.drawLast = Number(event.target.value);
        this.histogramDrawLastElement
            ?.addEventListener("change", this.histogramDrawLastCallback);

        this.histogramDownloadCurrentElement = document.getElementById("histogramDownloadCurrent");
        this.histogramDownloadCurrentCallback = _ => this.downloadCSVForType();
        this.histogramDownloadCurrentElement
            ?.addEventListener("click", this.histogramDownloadCurrentCallback);

        this.histogramDownloadAllElement = document.getElementById("histogramDownloadAll");
        this.histogramDownloadAllCallback = _ => this.downloadCSVForAllTypes();
        this.histogramDownloadAllElement
            ?.addEventListener("click", this.histogramDownloadAllCallback);

        this.histogramUploadCurrentElement = document.getElementById("histogramUploadCurrent");
        this.histogramUploadCurrentCallback = _ => this.uploadForType();
        this.histogramUploadCurrentElement
            ?.addEventListener("click", this.histogramUploadCurrentCallback);

        this.histogramUploadAllElement = document.getElementById("histogramUploadAll");
        this.histogramUploadAllCallback = _ => this.uploadForAllTypes();
        this.histogramUploadAllElement
            ?.addEventListener("click", this.histogramUploadAllCallback);

        this.histogramDrawingElement = document.getElementById("histogramDrawing");
        this.histogramDrawingElementCallback = _ => this.histogramType = this.histogramType;
        this.histogramDrawingElement
            ?.addEventListener("click", this.histogramDrawingElementCallback);

        this.histograms = histograms;
        this.drawLast = histograms[0][0][type].drawLast;
        this.collectionRate = histograms[0][0][type].unitTimePerUpdate;
        this.histogramType = type;
    }

    drop() {
        // I hate this. Big mistake :(
        this.histogramSelectorElement
            ?.removeEventListener("change", this.histogramSelectorCallback);
        this.histogramCollectionRateElement
            ?.removeEventListener("change", this.histogramCollectionCallback);
        this.histogramDrawLastElement
            ?.removeEventListener("change", this.histogramDrawLastCallback);
        this.histogramDownloadCurrentElement
            ?.removeEventListener("click", this.histogramDownloadCurrentCallback);
        this.histogramDownloadAllElement
            ?.removeEventListener("click", this.histogramDownloadAllCallback);
        this.histogramUploadCurrentElement
            ?.removeEventListener("click", this.histogramUploadCurrentCallback);
        this.histogramUploadAllElement
            ?.removeEventListener("click", this.histogramUploadAllCallback);
        this.histogramDrawingElement
            ?.removeEventListener("click", this.histogramDrawingElementCallback);
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
        if (type) this._histogramType = type;
        this.histograms.forEach(row =>
            row.forEach(histogramInfo =>
                Object.keys(histogramInfo).forEach(key =>
                    histogramInfo[key].isDrawing =
                        this.histogramDrawingElement.checked && (key === type))));

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
        else alert("Could not upload. Server is not connected.");
    }

    uploadForAllTypes() { this.types.forEach(type => this.uploadForType(type)); }
}

