export default class myChart {
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
                            speed: 1000, // ??
                            // Minimal pan distance required before actually applying pan
                            threshold: 5 // ??
                        },
                        zoom: {
                            enabled: true,
                            // drag: {animationDuration: 500},
                            drag: false,
                            mode: 'x',
                            speed: 1000, // ??
                            sensitivity: 0.00001 // ??
                        }
                    }
                }
            }
        });
    }

    removeAll() {
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        if ( this.chart.data.datasets.length == 2 ) {
            this.chart.data.datasets[1].data = [];
        }
        this.chart.update();
    };

    removeData(start, len) {
        this.chart.data.labels.splice(start, len);
        this.chart.data.datasets.forEach((dataset) => {
            dataset.data.splice(start, len)
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