class processDataFile {

    constructor() {
        this.batchSize = null;
        this.reader = new FileReader();
        this.initVars(true);
    }

    initVars(deep=true) {
        if (deep) {
            this.parsedCsv = undefined;
            this.maxId = null;
        }
        this.batchSize = null;
        this.i = 0;
        this.wEnd = null;
        return true;
    };

    loadFile() {
        this.reader.onloadend = (e) => {
            if (e.target.readyState == FileReader.DONE) {
                this.clearDrawing();
                this.initVars(true);
                this.startdraw();
                this.iterDraw();
                this.drawLastCone();
            }
        };
        this.reader.readAsBinaryString(GLOBS.fileInput.files[0]);
    };

    clearDrawing() {
        GLOBS.graphicsLayer.removeAll();
        GLOBS.altChart.removeData();
        GLOBS.yawChart.removeData();
        GLOBS.posChart.removeData();
        GLOBS.velChart.removeData();
        GLOBS.numsatChart.removeData();
        GLOBS.prChart.removeData();
        return true;
    };

    startdraw() {
        if (!this.parsedCsv) {
            let measurements = this.reader.result.split("\n");
            this.parsedCsv = parseCsv(measurements);
            GLOBS.prChart.drawPr([this.parsedCsv.ts[0]], [this.parsedCsv.pArr[0]], [this.parsedCsv.rArr[0]]);
        }

        this.maxId = this.parsedCsv.ts.length;
        this.batchSize = this.batchSize ? this.batchSize : this.maxId;
        this.wEnd = this.batchSize;
        drawCone(this.parsedCsv.longLatArr[0][0], this.parsedCsv.longLatArr[0][1], false);
        return true;
    };

    iterDraw() {
        this.batchSize = this.batchSize ? this.batchSize : this.maxId;
        this.wEnd = Math.min(this.i+this.batchSize, this.maxId);
        let tsSlice = this.parsedCsv.ts.slice(this.i, this.wEnd);
        GLOBS.altChart.addData(tsSlice, this.parsedCsv.altArr.slice(this.i, this.wEnd));
        GLOBS.yawChart.addData(tsSlice, this.parsedCsv.yArr.slice(this.i, this.wEnd));
        GLOBS.posChart.addData(tsSlice, this.parsedCsv.posAccArr.slice(this.i, this.wEnd));
        GLOBS.velChart.addData(tsSlice, this.parsedCsv.velAccArr.slice(this.i, this.wEnd));
        GLOBS.numsatChart.addData(tsSlice, this.parsedCsv.numsatArr.slice(this.i, this.wEnd));
        GLOBS.prChart.addData(tsSlice, this.parsedCsv.pArr.slice(this.i, this.wEnd), 0);
        GLOBS.prChart.addData([], this.parsedCsv.rArr.slice(this.i, this.wEnd), 1);
        drawMapPolyline(this.parsedCsv, this.i, this.wEnd, this.maxId);
        this.i = this.wEnd;
        if (this.i == this.maxId) {
            GLOBS.drawingFinished.flag = true;
        }
    }

    batchDraw() {
        while (this.i < this.maxId) {
            if (GLOBS.stopFlag) {
                throw "ExceptionStopped";
            }
            this.iterDraw();
        }
        drawCone(this.parsedCsv.longLatArr[this.wEnd-1][0], 
                 this.parsedCsv.longLatArr[this.wEnd-1][1], true);
        return true;
    };

    drawLastCone() {
        drawCone(this.parsedCsv.longLatArr[this.wEnd-1][0], 
                 this.parsedCsv.longLatArr[this.wEnd-1][1], true);
    }
};

function drawPause(classInstance) {
    let t0 = null;
    let progress = null;
    let drawFrameFlag = false;

    function makeFrame() {
        if (classInstance.i < classInstance.maxId) {
            if (!t0) {
                t0 = new Date();
            }
            progress = (new Date()) - t0;
            if (!drawFrameFlag) {
                classInstance.batchSize = GLOBS.batchSize;
                classInstance.iterDraw();
                drawFrameFlag = true;
            }
            if (progress >= GLOBS.globTimeoutMs) {
                t0 = null;
                drawFrameFlag = false;
            } 
            GLOBS.requestid = window.requestAnimationFrame(makeFrame);
        }
    }
    return window.requestAnimationFrame(makeFrame);
}

function roundToPrecision(x, precision) {
    return Math.round((x + Number.EPSILON) * precision) / precision;
}

function parseCsv(measurements) {
    // long/latt
    let longLatArr = [];
    // pitch/roll/yaw arrays
    let pArr = [], rArr = [], yArr = [];
    // altitude array (m)
    let altArr = [], posAccArr = [], velAccArr = [];
    let numsatArr = [], ts = [], measurement_row = {};
    let count = 0, flag = false, i = 0, cols = [];
    let t0, dt;
    measurements.forEach(measurement => {
        if (count % GLOBS.globThin) {
            count++;
            return;
        } 
        measurement = measurement.split(',');
        if (measurement[0] == "timestamp") {
            measurement.forEach(col => {
                cols.push(col);
            });
            count++;
            return;
        }
        if ( !(measurement.length == 1) ) {
            measurement_row = {};
            i = 0;
            cols.forEach(col => {
                measurement_row[col] = measurement[i];
                i++;
            });
            if (!flag) {
                t0 = Date.parse(measurement_row["timestamp"]);
                flag = true;
            }
            dt = roundToPrecision((Date.parse(measurement_row["timestamp"]) - t0) / 1000.0, 100);
            ts.push(dt);
            pArr.push(parseFloat(measurement_row["pitch"]));
            rArr.push(parseFloat(measurement_row["roll"]));
            yArr.push(parseFloat(measurement_row["yaw"]));
            altArr.push(parseFloat(measurement_row["alt"]));
            posAccArr.push(parseFloat(measurement_row["pos_accuracy"]));
            velAccArr.push(parseFloat(measurement_row["vel_accuracy"]));
            numsatArr.push(parseFloat(measurement_row["numsats"]));
            longLatArr.push([parseFloat(measurement_row["lon"]), 
                             parseFloat(measurement_row["lat"])]);
        };
        count++;
    });
    return { ts, pArr, rArr, yArr, altArr, posAccArr, velAccArr, numsatArr, longLatArr };
};

function drawPolyLine(arr, clon, clat) {
    let polyline = {
        type: "polyline",
        paths: arr
    };

    let lineSymbol = {
        type: "simple-line",
        color: [226, 119, 40, 1.0], // rgba; orange
        width: 2
    };

    let polylineGraphic = new GLOBS.Graphic({
        geometry: polyline,
        symbol: lineSymbol
    });

    // draw polyline
    GLOBS.graphicsLayer.add(polylineGraphic);
    GLOBS.sceneView.center = [clon, clat];
    GLOBS.sceneView.zoom = GLOBS.mapZoom;
}

function drawPosPolyLine(arr, acc) {
    let polyline = {
        type: "polyline",
        paths: arr
    };

    acc = Math.max(1, acc);
    let lineSymbol = {
        type: "simple-line",
        color: [150, 50, 50, 0.2], // rgba; orange
        width: Math.max(2, Math.floor(GLOBS.covarianceMult * acc))
    };

    let polylineGraphic = new GLOBS.Graphic({
        geometry: polyline,
        symbol: lineSymbol
    });

    // draw polyline
    GLOBS.graphicsLayer.add(polylineGraphic);
}

function drawMapPolyline(arr, start, end, maxId) {
    end = Math.min(maxId, end);
    if (start == end) {start -= 1;}
    let maxPointsDraw = GLOBS.maxPointsDraw;
    if (end < maxId) {
        maxPointsDraw = 10;
    }
    let counter = 0;
    let clon = 0;
    let clat = 0;
    let len = end - start;
    let newArr = [], posArr = [];
    let thin = 0;
    if ( len > maxPointsDraw )
        thin = Math.ceil(len / maxPointsDraw);
    for (let i=start; i < end; i++) {
        if ( !((len-i) % thin) | (i == (end-1)) | (i == start) ) {
            clon += arr.longLatArr[i][0];
            clat += arr.longLatArr[i][1];
            newArr.push(arr.longLatArr[i]);
            posArr.push(arr.posAccArr[i]);
            counter++;
        }
    }
    clon /= counter;
    clat /= counter;

    for (let i=1; i < newArr.length; i++) {
        drawPosPolyLine(newArr.slice(i-1, i+1), posArr[i]);
    }

    drawPolyLine(newArr, clon, clat);
}

function drawCone(lon, lat, finish=false) {
    let point = {
        type: "point",
        longitude: lon,
        latitude: lat
    };

    let pointSymbol = {
        type: "point-3d", 
        symbolLayers: [{
          type: "object", 
          width: 10,   // diameter of the object from east to west in meters
          height: 20,  // height of object in meters
          depth: 10,   // diameter of the object from north to south in meters
          resource: {
              primitive: "inverted-cone"
          },
          material: { 
              color: finish ? [226, 40, 40, 1.0] : [226, 119, 40, 1.0]
          }
        }]
    };

    let pointGraphic = new GLOBS.Graphic({
        geometry: point,
        symbol: pointSymbol
    });

    GLOBS.graphicsLayer.add(pointGraphic);
}

function drawPosAcc(lon, lat, acc, mult=2) {
    acc *= mult;

    let point = {
        type: "point",
        longitude: lon,
        latitude: lat
    };

    let pointSymbol = {
        type: "point-3d", 
        symbolLayers: [{
          type: "object", 
          width: acc,   // diameter of the object from east to west in meters
          height: 0.1,  // height of object in meters
          depth: acc,   // diameter of the object from north to south in meters
          resource: {
              primitive: "sphere"
          },
          material: { 
              color: [226, 119, 40, 0.5] 
          }
        }]
    };

    let pointGraphic = new GLOBS.Graphic({
        geometry: point,
        symbol: pointSymbol
    });

    GLOBS.graphicsLayer.add(pointGraphic);
}

class myChart {
    constructor(ylabel="Y", chartName='alt-chart', title="Altitude") {
        let ctx = document.getElementById(chartName).getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: title,
                    fill: false,
                    data: [],
                    borderColor: 'rgba(99, 159, 255, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 0,
                    lazy: false
                },
                legend: {
                    display: true,
                    labels: {
                        fontColor: 'rgba(200, 200, 200, 1)',
                        fontSize: 14
                    }
                },
                scales: { 
                    yAxes: [{
                        ticks: {
                            fontColor: 'rgba(200, 200, 200, 1)',
                            padding: 5,
                        },
                        gridLines: {
                            color: 'rgba(200, 200, 200, 0.6)',
                            zeroLineColor: 'rgba(200, 200, 200, 1)',
                            tickMarkLength: 0,
                            drawBorder: true,
                        },
                        scaleLabel: {
                            display: true,
                            labelString: ylabel,
                            fontColor: 'rgba(200, 200, 200, 1)',
                            fontSize: 12
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            fontColor: 'rgba(200, 200, 200, 1)',
                            padding: 5,
                        },
                        gridLines: {
                            color: 'rgba(200, 200, 200, 0.6)',
                            zeroLineColor: 'rgba(200, 200, 200, 1)',
                            tickMarkLength: 0,
                            drawBorder: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: "time, sec.",
                            fontColor: 'rgba(200, 200, 200, 1)',
                            fontSize: 12
                        }
                    }]
                },
                title: {
                    display: false,
                    text: "",
                    fontColor: 'rgba(200, 200, 200, 1)'
                },
                elements: {
                    line: {
                        tension: 0
                    },
                    point: {
                        radius: 0
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            // Boolean to enable panning
                            enabled: true,
                            mode: 'xy',
                            rangeMin: {
                                // Format of min pan range depends on scale type
                                x: null,
                                y: null
                            },
                            rangeMax: {
                                // Format of max pan range depends on scale type
                                x: null,
                                y: null
                            },
                            // On category scale, factor of pan velocity
                            speed: 1000,
                            // Minimal pan distance required before actually applying pan
                            threshold: 5
                        },
                        zoom: {
                            enabled: true,
                            // drag: {animationDuration: 500},
                            drag: false,
                            mode: 'x',
                            speed: 1000,
                            sensitivity: 0.00001
                        }
                    }
                }
            }
        });
    }

    removeData() {
        let end = this.chart.data.labels.length;
        for (let i=0; i<end; i++) {
            this.chart.data.labels.pop();
        }
        this.chart.data.datasets.forEach((dataset) => {
            for (let i=0; i<end; i++) {
                dataset.data.pop();
            }
        });
        this.chart.update();
    };

    addData(labels, data, num=0) {
        labels.forEach((label) => {
            this.chart.data.labels.push(label);
        });
        data.forEach((d) => {
            this.chart.data.datasets[num].data.push(d);
        });
        this.chart.update();
    };

    drawPr(ts, pArr, rArr) {
        this.chart.data.labels = ts;
        this.chart.data.datasets = [
            {
                label: "pitch",
                data: pArr,
                fill: false,
                borderColor: 'rgba(99, 159, 255, 1)',
                borderWidth: 1
            },
            {
                label: "roll",
                data: rArr,
                fill: false,
                borderColor: 'rgba(255, 99, 159, 1)',
                borderWidth: 1
            }
        ];
        this.chart.update();
    };

    drawSingle(ts, arr) {
        this.chart.data.labels = ts;
        this.chart.data.datasets[0].data = arr;
        this.chart.update();
    };
};

function switchCoverSpin(visible) {
    document.getElementById("cover-spin").style.display = visible ? "block" : "none";
}

class Stopwatch {
    constructor() {
        this.reset();
    }

    start() {
        let t = new Date();
        this.t0 = t.getTime();
    };

    stop() {
        let t = new Date();
        this.t1 = t.getTime();
        this.dt += (this.t1 - this.t0) / 1000.0;
    };

    reset() {
        this.t0 = 0; 
        this.t1 = 0; 
        this.dt = 0;
    };

    get duration() {
        return this.dt;
    }
}

function changeBtnStatus(btn, name, disabled=true, color=`#888`, hoverColor=`#888`) {
    name = "--" + name;
    btn.style.setProperty(name, color);
    btn.style.setProperty(name + "Hover", hoverColor);
    btn.disabled = disabled;
}

function stopAnimation() {
    if (GLOBS.requestid) {
        window.cancelAnimationFrame(GLOBS.requestid);
    }
}

function playerDisableBtns() {
    changeBtnStatus(GLOBS.slider, "sliderColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(GLOBS.slider, "trackColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(GLOBS.serverBtn, "sendColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(GLOBS.fileInputBtn, "inpBtnColor", disabled=true, color=`#888`, hoverColor=`#888`);
    GLOBS.range.disabled = true;
}

function playerEnableBtns() {
    changeBtnStatus(GLOBS.slider, "sliderColor", disabled=false, color=`#f1f1f1`, hoverColor=`#f1f1f1`);
    changeBtnStatus(GLOBS.slider, "trackColor", disabled=false, color=`#639fff`, hoverColor=`#639fff`);
    changeBtnStatus(GLOBS.serverBtn, "sendColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
    changeBtnStatus(GLOBS.fileInputBtn, "inpBtnColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
    GLOBS.range.disabled = false;
}

function loadDataFile() {
    const readSw = new Stopwatch();
    switchCoverSpin(true);
    readSw.start();
    GLOBS.fileProcessor.loadFile();
    readSw.stop();

    setTimeout(() => switchCoverSpin(false), 
            readSw.duration <= 1.0 ? 1000 : 10);
    readSw.reset();
}
