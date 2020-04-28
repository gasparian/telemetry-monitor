function processData(file, altchart, prchart, yawchart, poschart, velchart, numsatchart) {
    let reader = new FileReader();
    reader.onloadend = function(e) {
        if (e.target.readyState == FileReader.DONE) {
            let measurements = reader.result.split("\n");
            let parsedCsv = parseCsv(measurements);
            altchart.drawSingle(parsedCsv.ts, parsedCsv.altArr);
            yawchart.drawSingle(parsedCsv.ts, parsedCsv.yArr);
            poschart.drawSingle(parsedCsv.ts, parsedCsv.posAccArr);
            velchart.drawSingle(parsedCsv.ts, parsedCsv.velAccArr);
            numsatchart.drawSingle(parsedCsv.ts, parsedCsv.numsatArr);

            prchart.drawPr(parsedCsv);
            drawMapPolyline(parsedCsv, thin=globThin);
        }
    };
    reader.readAsBinaryString(file);
  };

function roundToPrecision(x, precision) {
    return Math.round((x + Number.EPSILON) * precision) / precision;
}

function parseCsv(measurements) {
    let thin = 1;
    if (measurements.length >= 5000) {
        thin = 20;
    }
    // long/latt
    let longLatArr = [];
    // pitch/roll/yaw arrays
    let pArr = [];
    let rArr = [];
    let yArr = [];
    // altitude array (m)
    let altArr = [];
    let posAccArr = [];
    let velAccArr = [];
    let numsatArr = [];
    let ts = [];
    let measurement_row = {};
    let count = 0;
    let flag = false;
    let i = 0;
    let t0, dt;
    let cols = [];
    measurements.forEach(measurement => {
        if (count % thin) {
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

function drawMapPolyline(arr, thin=10) {

    let clon = 0;
    let clat = 0;
    let i = 0;
    let newArr = [];
    let len = Math.floor(arr.posAccArr.length / thin);
    // calculate new scene center and 
    // draw pos_accuracy
    arr.longLatArr.forEach( a => {
        if ( !(i % thin) & (i > 0) ) {
            clon += a[0] / len;
            clat += a[1] / len;
            newArr.push(a);
            drawPosAcc(a[0], a[1], 
                       arr.posAccArr[i], mult=globPosMult);
        };
        i++;
    });

    console.log(len, clon, clat);

    let polyline = {
        type: "polyline",
        paths: newArr
    };

    let lineSymbol = {
        type: "simple-line",
        color: [226, 119, 40, 1.0], // rgba; orange
        width: 2
    };

    let polylineGraphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol
    });

    // draw polyline
    graphicsLayer.add(polylineGraphic);
    sceneView.center = [clon, clat];
    sceneView.zoom = 16;
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

    let pointGraphic = new Graphic({
        geometry: point,
        symbol: pointSymbol
    });

    graphicsLayer.add(pointGraphic);
}

function myChart(ylabel="Y", chartName='alt-chart', title="Altitude") {
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
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 0
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
                        color: 'rgba(200, 200, 200, 1)',
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
                        color: 'rgba(200, 200, 200, 1)',
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
                        speed: 5,
                        // Minimal pan distance required before actually applying pan
                        threshold: 10
                    },
                    zoom: {
                        enabled: true,
                        // drag: {animationDuration: 500},
                        drag: false,
                        mode: 'xy',
                        speed: 0.025,
                        sensitivity: 2
                    }
                }
            }
        }
    });

    removeData = function() {
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

    addData = function(labels, data, num=0) {
        labels.forEach((label) => {
            this.chart.data.labels.push(label);
        });
        data.forEach((d) => {
            this.chart.data.datasets[num].data.push(d);
        });
        this.chart.update();
    };

    this.drawPr = function(data) {
        this.chart.data.labels = data.ts;
        this.chart.data.datasets = [
            {
                label: "pitch",
                data: data.pArr,
                fill: false,
                borderColor: 'rgba(99, 159, 255, 1)',
                borderWidth: 1
            },
            {
                label: "roll",
                data: data.rArr,
                fill: false,
                borderColor: 'rgba(255, 99, 159, 1)',
                borderWidth: 1
            }
        ];
        this.chart.update();
    };

    this.drawSingle = function(ts, arr) {
        this.chart.data.labels = ts;
        this.chart.data.datasets[0].data = arr;
        this.chart.update();
    };
};

function switchCoverSpin(visible) {
    document.getElementById("cover-spin").style.display = visible ? "block" : "none";
}

function Stopwatch() {
    let t0 = 0, t1 = 0, duration = 0;

    this.start = function() {
        let t = new Date();
        t0 = t.getTime();
    };

    this.stop = function() {
        let t = new Date();
        t1 = t.getTime();
        duration += (t1 - t0) / 1000.0;
    };

    this.reset = function() {
        t0 = 0;
        t1 = 0;
        duration = 0;
    };

    Object.defineProperty(this, "duration", {
        get: function() {
            return duration;
        }
    });
}
