function processData(file, altchart, prchart, yawchart) {
    let reader = new FileReader();
    reader.onloadend = function(e) {
        if (e.target.readyState == FileReader.DONE) {
            let measurements = reader.result.split("\n");
            let parsedCsv = parseCsv(measurements);
            altchart.drawAlt(parsedCsv);
            prchart.drawPr(parsedCsv);
            yawchart.drawYaw(parsedCsv);
            drawMapPolyline(parsedCsv.longLatArr, thin=1);
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
            longLatArr.push([parseFloat(measurement_row["lon"]), 
                             parseFloat(measurement_row["lat"])]);
        };
        count++;
    });
    return { ts, pArr, rArr, yArr, altArr, longLatArr };
};

function getMeanCoords(arr) {
    let lon = 0;
    let lat = 0;
    let len = arr.length;
    arr.forEach( a => {
        lon += a[0] / len;
        lat += a[1] / len;
    });
    return { lon, lat };
}

function drawMapPolyline(arr, thin=10) {
    let centerCoords = getMeanCoords(arr);

    let newArr = arr.filter(function(value, index, Arr) {
        return index % thin == 0;
    });

    let lineSymbol = {
        type: "simple-line",
        color: [226, 119, 40], // orange
        width: 2
    };

    let polyline = {
        type: "polyline",
        paths: newArr
    };

    let polylineGraphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol
    });
    
    graphicsLayer.add(polylineGraphic);

    sceneView.center = [centerCoords.lon,  centerCoords.lat];
    sceneView.zoom = 16;

    console.log(arr);
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
    };

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

    drawAlt(data) {
        this.chart.data.labels = data.ts;
        this.chart.data.datasets[0].data = data.altArr;
        this.chart.update();
    };

    drawPr(data) {
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

    drawYaw(data) {
        this.chart.data.labels = data.ts;
        this.chart.data.datasets[0].data = data.yArr;
        this.chart.update();
    };
};

