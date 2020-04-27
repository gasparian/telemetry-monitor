// col names
let cols = [    
    "timestamp","lat","lon",
    "alt","roll","pitch","yaw",
    "vn","ve","vf","vl","vu","ax",
    "ay","az","af","al","au","wx",
    "wy","wz","wf","wl","wu",
    "pos_accuracy","vel_accuracy",
    "navstat","numsats",
    "posmode","velmode","orimode"
]

// csv parser
function processData(file, altchart, prchart, yawchart, thin=1) {
    thin = Math.max(1, thin);
    let reader = new FileReader();
    reader.onloadend = function(e) {
        if (e.target.readyState == FileReader.DONE) {
            let measurements = reader.result.split("\n");
            let parsedCsv = parseCsv(measurements, thin);
            altchart.drawAlt(parsedCsv);
            prchart.drawPr(parsedCsv);
            yawchart.drawYaw(parsedCsv);
        }
    };
    reader.readAsBinaryString(file);
  };

function roundToPrecision(x, precision) {
    return Math.round((x + Number.EPSILON) * precision) / precision;
}

function parseCsv(measurements, thin=100) {
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
    measurements.forEach(measurement => {
        if (count % thin) {
            count++;
            return;
        } 
        measurement = measurement.split(',');
        if ( !((measurement[0] == "timestamp") || measurement.length == 1) ) {
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
        };
        count++;
    });
    return { ts, pArr, rArr, yArr, altArr };
};

class myChart {
    constructor(ylabel="Y", chartName='alt_chart', title="Altitude") {
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

