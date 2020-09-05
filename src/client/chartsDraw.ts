import Chart from "chart.js"

export default class myChart {
    chart: Chart
    
    constructor(ylabel="Y", chartName='alt-chart', title="Altitude") {
        const canvas = <HTMLCanvasElement> document.getElementById(chartName)
        const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')
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
                // maintainAspectRatio: true,
                animation: {
                    duration: 0,
                    // lazy: false
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
                hover: {
                    mode: "nearest",
                    intersect: false,
                    animationDuration: 250
                }
            }
        })
    }

    removeAll(): void {
        this.chart.data.labels = []
        if (!!this.chart.data.datasets) {
            this.chart.data.datasets[0].data = []
            if ( this.chart.data.datasets?.length === 2 ) {
                this.chart.data.datasets[1].data = []
            }
            this.chart.update()
        }
    }

    removeData(start: number, len: number): void {
        if (!!this.chart.data.labels) {
            this.chart.data.labels.splice(start, len)
        }
        if (!!this.chart.data.datasets) {
            this.chart.data.datasets.forEach((dataset) => {
                dataset.data?.splice(start, len)
            })
        }
        this.chart.update()
    }

    addData(labels: number[], data: number[], num=0): void {
        if (!!this.chart.data.datasets && !!this.chart.data.labels) {
            labels.forEach((label) => {
                this.chart.data.labels?.push(label)
            })
            if (this.chart.data.datasets?.length) {
                for (const d of data) {
                    this.chart.data.datasets[num].data?.push(d)
                }
            }
            this.chart.update()
        }
    }

    drawPr(ts: number[], pArr: number[], rArr: number[]): void {
        this.chart.data.labels = ts
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
        ]
        this.chart.update()
    }

    drawSingle(ts: number[], arr: number[]): void {
        if (!!this.chart.data.labels && !!this.chart.data.datasets) {
            this.chart.data.labels = ts
            this.chart.data.datasets[0].data = arr
            this.chart.update()
        }
    }
}