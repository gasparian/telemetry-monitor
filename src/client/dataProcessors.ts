import parseCsv from "./csvParser"
import { DataListener, getCurrTime } from "./misc"
import { drawMapPolyline, drawCone } from "./mapDraw"
import { drawPause } from "./animation"
import IGlobalState, {IVariablesState, IIoState, IChartsState, IMapsState} from "./IGlobalState"
import { IMeasurement } from "./IMeasurement"
import IDataProcessor from "./IDataProcessor"

export function sendFileWebSocket(io: IIoState) {
    let reader = new FileReader()
    reader.onloadend = function() {
    }

    reader.onload = function(e) {
        if (!!io.ws && !!e.target) {
            io.ws.send(e.target.result!)
        }
    }
    reader.readAsArrayBuffer(io.configFileInput.files![0])
}

export function clearDrawing(state: IGlobalState) {
    state.maps.graphicsLayer.removeAll()
    for ( const key in state.charts ) {
        state.charts[key].removeAll()
    }
    return true
}

export class FileDataProcessor implements IDataProcessor {
    parsedData: null | IMeasurement
    maxMeasurementId: null | number
    reader: FileReader
    batchSize: null | number
    measurementId: number
    windowEndMeasurementId: null | number

    constructor() {
        this.parsedData = null
        this.batchSize = null
        this.maxMeasurementId = null
        this.reader = new FileReader()
        this.measurementId = 0
        this.windowEndMeasurementId = null
    }

    initVars() {
        this.measurementId = 0
        this.windowEndMeasurementId = null
        return true
    }

    loadFile(state: IGlobalState) {
        this.reader.onloadend = (e) => {
            if (!!e.target && e.target.readyState == FileReader.DONE) {
                this.parsedData = null
                this.batchSize = null
                this.maxMeasurementId = null
                this.initVars()
                this.startdraw(state)
                this.iterDraw(state)
                this.drawLastCone(state.maps)
            }
        }
        this.reader.readAsBinaryString(state.io.fileInput.files![0])
    }

    startDrawPause(state: IGlobalState) {
        drawPause(state, "fileProcessor")
    }

    // TO DO: change this function in order parse the `real` data <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    parseData(vars: IVariablesState) {
        const stringResult = <string>this.reader.result
        const measurements: string[] = stringResult.split("\n")
        this.parsedData = parseCsv(vars, measurements).result
    }

    startdraw(state: IGlobalState) {
        if (!this.parsedData) {
            this.parseData(state.vars)
            if (!!this.parsedData) {
                state.charts.prChart.drawPr(
                    [this.parsedData!.timestamp[0]], [this.parsedData!.pitch[0]], [this.parsedData!.roll[0]]
                )
            }
        }

        if (!!this.parsedData) {
            this.maxMeasurementId = this.parsedData.timestamp.length
            drawCone(state.maps, this.parsedData.lon[0], this.parsedData.lat[0], false)
        }
    }

    iterDraw(state: IGlobalState) {
        this.batchSize = this.batchSize ? state.vars.batchSize : this.maxMeasurementId
        if (!!this.maxMeasurementId && !!this.batchSize && !!this.parsedData) {
            this.windowEndMeasurementId = Math.min(this.measurementId+this.batchSize, this.maxMeasurementId)

            const tsSlice = this.parsedData.timestamp.slice(this.measurementId, this.windowEndMeasurementId)
            for ( const chart in state.charts ) {
                if ( chart == "prChart" ) {
                    continue
                }
                state.charts[chart].addData(tsSlice, this.parsedData[chart].slice(this.measurementId, this.windowEndMeasurementId))
            }

            state.charts.prChart.addData(tsSlice, this.parsedData.pitch.slice(this.measurementId, this.windowEndMeasurementId), 0)
            state.charts.prChart.addData([], this.parsedData.roll.slice(this.measurementId, this.windowEndMeasurementId), 1)
            drawMapPolyline(state, this.parsedData, this.measurementId, this.windowEndMeasurementId, this.maxMeasurementId, this.constructor.name)
            this.measurementId = this.windowEndMeasurementId
            if (this.measurementId == this.maxMeasurementId) {
                state.vars.drawingFinished.value = true
            }
        }
    }

    drawLastCone(maps: IMapsState) {
        if (!!this.parsedData && !!this.windowEndMeasurementId) {
            drawCone(maps, this.parsedData.lon[this.windowEndMeasurementId-1], 
                    this.parsedData.lat[this.windowEndMeasurementId-1], true)
        }
    }
}

export class StreamProcessor implements IDataProcessor {
    columns: string
    parsedData: null | IMeasurement
    measurements: string[]
    length: DataListener<number>
    measurementId: number
    firstIter: boolean
    firstMeasurementTime: null | number
    windowEndMeasurementId: number
    maxMeasurementId: number
    timerInitTime: number
    dt: number
    batchSize: number

    constructor() {
        this.columns = ""
        this.timerInitTime = 0
        this.dt = 0
        this.batchSize = 0
        this.parsedData = {}
        const parsedCols = this.columns.split(',')
        for ( const measurementId in parsedCols ) {
            this.parsedData[parsedCols[measurementId]] = []
        }
        this.measurements = [this.columns]
        this.length = new DataListener(0)
        this.measurementId = 0
        this.firstIter = true
        this.firstMeasurementTime = null
        this.windowEndMeasurementId = 1
        this.maxMeasurementId = 1 // for compatibility with `drawPause` function
    }

    initVars(cols="") {
        this.columns = cols
        this.parsedData = {}
        const parsedCols = this.columns.split(',')
        for ( const measurementId in parsedCols ) {
            this.parsedData[parsedCols[measurementId]] = []
        }
        this.measurements = [this.columns]
        this.length = new DataListener(0)
        this.measurementId = 0
        this.firstIter = true
        this.firstMeasurementTime = null
        this.windowEndMeasurementId = 1
        this.maxMeasurementId = 1 // for compatibility with `drawPause` function
    }

    registerLengthListener(state: IGlobalState) {
        // start drawing after the `length` has been increased
        this.length.registerListener(() => {
            drawPause(state, "streamProcessor")
        })
    }

    // TO DO: change this function in order parse the `real` data <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    parseData(vars: IVariablesState) {
        const parsed = parseCsv(vars, this.measurements, this.firstMeasurementTime, false)
        if ( (!this.firstMeasurementTime) && (parsed.t0) ) {
            this.firstMeasurementTime = parsed.t0
        }
        for ( const col in this.parsedData ) {
            this.parsedData[col].push(...parsed.result[col])
        }
        if (!!this.parsedData) {
            this.maxMeasurementId = this.parsedData.timestamp.length
            this.length.value = this.maxMeasurementId
            this.measurements = [this.columns]
        }
    }

    startTimer() {
        this.timerInitTime = getCurrTime()
        this.dt = 0
    }

    updateArr(vars: IVariablesState, measurement: string) { 
        if ( measurement.length > 0 ) {
            this.measurements.push(measurement)
            this.dt += getCurrTime() - this.timerInitTime
            if ( this.dt >= vars.minDtMs ) {
                this.parseData(vars)
                this.startTimer()
            }
        }
    }

    iterDraw(state: IGlobalState) {
        this.batchSize = state.vars.batchSize
        if ( this.length.value >= state.vars.batchSize ) {
            if ( this.firstIter && !!this.parsedData ) {
                state.charts.prChart.drawPr(
                    [this.parsedData.timestamp[0]], [this.parsedData.pitch[0]], [this.parsedData.roll[0]]
                )
                drawCone(state.maps, this.parsedData.lon[0], this.parsedData.lat[0], false)
                this.firstIter = false
            }
            this.windowEndMeasurementId = Math.min(this.measurementId+state.vars.batchSize, this.maxMeasurementId) 
            if ( (this.measurementId != this.maxMeasurementId) && !!this.parsedData ) {
                const tsSlice = this.parsedData.timestamp.slice(this.measurementId, this.windowEndMeasurementId)
                for ( const chart in state.charts ) {
                    if ( chart == "prChart" ) {
                        continue
                    }
                    state.charts[chart].addData(tsSlice, this.parsedData[chart].slice(this.measurementId, this.windowEndMeasurementId))
                }

                state.charts.prChart.addData(tsSlice, this.parsedData.pitch.slice(this.measurementId, this.windowEndMeasurementId), 0)
                state.charts.prChart.addData([], this.parsedData.roll.slice(this.measurementId, this.windowEndMeasurementId), 1)
                // draw route on the map
                drawMapPolyline(state, this.parsedData, this.measurementId, this.windowEndMeasurementId, this.maxMeasurementId, this.constructor.name)
                this.measurementId = this.windowEndMeasurementId
            }

            // check if we need to redraw graphs w/o `old` values
            // just take any chart to see its' length since they're all equal
            if (!!state.charts.alt.chart.data.labels) {
                let dropLen = state.charts.alt.chart.data.labels.length - state.vars.maxGraphBuffLen
                dropLen = (dropLen < 0) ? 0 : dropLen
                if ( (dropLen > 0) ) {
                    for ( const chart in state.charts ) {
                        state.charts[chart].removeData(0, dropLen)
                    }
                }
            }
        }
    }
}
