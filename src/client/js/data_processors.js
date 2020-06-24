import parseCsv from "./csv_parser.js";
import { dataListener } from "./misc.js";
import { drawMapPolyline, drawCone } from "./map_draw.js";
import { drawPause } from "./animation.js";

export function sendFileWebSocket(file) {
    var reader = new FileReader();
    var rawData = new ArrayBuffer();

    reader.loadend = function() {

    }
    reader.onload = function(e) {
        rawData = e.target.result;
        window.myGlobs.io.ws.send(rawData);
    }
    reader.readAsArrayBuffer(file);
}

export function clearDrawing() {
    window.myGlobs.maps.graphicsLayer.removeAll();
    for ( const key in window.myGlobs.charts ) {
        window.myGlobs.charts[key].removeAll();
    }
    return true;
};

export class processDataFile {

    constructor() {
        this.parsedData = undefined;
        this.maxId = undefined;
        this.reader = new FileReader();
        this.initVars();
    }

    initVars() {
        this.batchSize = undefined;
        this.i = 0;
        this.wEnd = undefined;
        return true;
    };

    loadFile(file) {
        this.reader.onloadend = (e) => {
            if (e.target.readyState == FileReader.DONE) {
                this.parsedData = undefined;
                this.maxId = undefined;
                this.initVars();
                this.startdraw();
                this.iterDraw();
                this.drawLastCone();
            }
        };
        this.reader.readAsBinaryString(file);
    };

    // TO DO: change this function in order parse the `real` data <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    parseData() {
        let measurements = this.reader.result.split("\n");
        this.parsedData = parseCsv(measurements).result;
    }

    startdraw() {
        if (!this.parsedData) {
            this.parseData();
            window.myGlobs.charts.prChart.drawPr([this.parsedData.timestamp[0]], [this.parsedData.pitch[0]], [this.parsedData.roll[0]]);
        }

        this.maxId = this.parsedData.timestamp.length;
        this.batchSize = this.batchSize ? this.batchSize : this.maxId;
        this.wEnd = this.batchSize;
        drawCone(this.parsedData.lon[0], this.parsedData.lat[0], false);
        return true;
    };

    iterDraw() {
        this.batchSize = this.batchSize ? this.batchSize : this.maxId;
        this.wEnd = Math.min(this.i+this.batchSize, this.maxId);

        const tsSlice = this.parsedData.timestamp.slice(this.i, this.wEnd);
        for ( const chart in window.myGlobs.charts ) {
            if ( chart == "prChart" ) {
                continue;
            }
            window.myGlobs.charts[chart].addData(tsSlice, this.parsedData[chart].slice(this.i, this.wEnd));
        }

        window.myGlobs.charts.prChart.addData(tsSlice, this.parsedData.pitch.slice(this.i, this.wEnd), 0);
        window.myGlobs.charts.prChart.addData([], this.parsedData.roll.slice(this.i, this.wEnd), 1);
        drawMapPolyline(this.parsedData, this.i, this.wEnd, this.maxId);
        this.i = this.wEnd;
        if (this.i == this.maxId) {
            window.myGlobs.drawingFinished.value = true;
        }
    }

    drawLastCone() {
        drawCone(this.parsedData.lon[this.wEnd-1], 
                 this.parsedData.lat[this.wEnd-1], true);
    }
};

export class processStream {

    constructor() {
        this.initVars();
    }

    initVars(cols="") {
        this.columns = cols;
        this.parsedData = {};
        const parsedCols = this.columns.split(',');
        for ( const i in parsedCols ) {
            this.parsedData[parsedCols[i]] = [];
        }
        this.measurements = [this.columns];
        this.length = new dataListener(0);
        this.i = 0;
        this.firstIter = true;
        this.t0 = undefined;
        this.wEnd = 1;
        this.maxId = 1; // for compatibility with `drawPause` function

        this.length.registerListener(function(val) { // start drawing after the `length` has been increased
            drawPause("streamProcessor");
        });
    };

    // TO DO: change this function in order parse the `real` data <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    parseData() {
        const parsed = parseCsv(this.measurements, this.t0, false);
        if ( (!this.t0) && (parsed.t0) ) {
            this.t0 = parsed.t0;
        }
        for ( const col in this.parsedData ) {
            this.parsedData[col].push(...parsed.result[col]);
        }
        this.maxId = this.parsedData.timestamp.length;
        this.length.value = this.maxId;
        this.measurements = [this.columns];
    }

    updateArr(measurement) { 
        if ( measurement.length > 0 ) {
            this.measurements.push(measurement);
            if ( this.measurements.length == window.myGlobs.vars.batchSize * 2 + 1 ) {
                this.parseData();
            }
        }
    };

    iterDraw() {
        if ( this.length.value >= window.myGlobs.vars.batchSize ) {
            if ( this.firstIter ) {
                window.myGlobs.charts.prChart.drawPr([this.parsedData.timestamp[0]], [this.parsedData.pitch[0]], [this.parsedData.roll[0]]);
                drawCone(this.parsedData.lon[0], this.parsedData.lat[0], false);
                this.firstIter = false;
            }
            this.wEnd = Math.min(this.i+window.myGlobs.vars.batchSize, this.maxId); 
            if ( (this.i != this.maxId) ) {

                console.log(this.i, this.wEnd, this.wEnd - this.i, this.maxId);

                const tsSlice = this.parsedData.timestamp.slice(this.i, this.wEnd);
                for ( const chart in window.myGlobs.charts ) {
                    if ( chart == "prChart" ) {
                        continue;
                    }
                    window.myGlobs.charts[chart].addData(tsSlice, this.parsedData[chart].slice(this.i, this.wEnd));
                }

                window.myGlobs.charts.prChart.addData(tsSlice, this.parsedData.pitch.slice(this.i, this.wEnd), 0);
                window.myGlobs.charts.prChart.addData([], this.parsedData.roll.slice(this.i, this.wEnd), 1);
                // draw route on the map
                drawMapPolyline(this.parsedData, this.i, this.wEnd, this.maxId);
                this.i = this.wEnd;
            }

            // check if we need to redraw graphs w/o `old` values
            // just take any chart to see its' length since they're all equal
            if ( (!window.myGlobs.buttons.checkBox.box.checked) ) {
                let dropLen = window.myGlobs.charts.alt.chart.data.labels.length - window.myGlobs.vars.maxGraphLen;
                dropLen = (dropLen < 0) ? 0 : dropLen;
                if ( (dropLen > 0) ) {
                    for ( const chart in window.myGlobs.charts ) {
                        window.myGlobs.charts[chart].removeData(0, dropLen);
                    }
                }                
            }
        }
    }
};
