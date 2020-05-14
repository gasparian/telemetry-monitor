import parseCsv from "./csv_parser.js";
import { drawMapPolyline, drawCone } from "./map_draw.js";

export default class processDataFile {

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

    loadFile(file) {
        this.reader.onloadend = (e) => {
            if (e.target.readyState == FileReader.DONE) {
                this.initVars(true);
                this.startdraw();
                this.iterDraw();
                this.drawLastCone();
            }
        };
        this.reader.readAsBinaryString(file);
    };

    clearDrawing() {
        window.myGlobs.maps.graphicsLayer.removeAll();
        for ( const key in window.myGlobs.charts ) {
            window.myGlobs.charts[key].removeData();
        }
        return true;
    };

    startdraw() {
        if (!this.parsedCsv) {
            let measurements = this.reader.result.split("\n");
            this.parsedCsv = parseCsv(measurements, window.myGlobs.vars.globThin);
            window.myGlobs.charts.prChart.drawPr([this.parsedCsv.ts[0]], [this.parsedCsv.pArr[0]], [this.parsedCsv.rArr[0]]);
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
        window.myGlobs.charts.altChart.addData(tsSlice, this.parsedCsv.altArr.slice(this.i, this.wEnd));
        window.myGlobs.charts.yawChart.addData(tsSlice, this.parsedCsv.yArr.slice(this.i, this.wEnd));
        window.myGlobs.charts.posChart.addData(tsSlice, this.parsedCsv.posAccArr.slice(this.i, this.wEnd));
        window.myGlobs.charts.velChart.addData(tsSlice, this.parsedCsv.velAccArr.slice(this.i, this.wEnd));
        window.myGlobs.charts.numsatChart.addData(tsSlice, this.parsedCsv.numsatArr.slice(this.i, this.wEnd));
        window.myGlobs.charts.prChart.addData(tsSlice, this.parsedCsv.pArr.slice(this.i, this.wEnd), 0);
        window.myGlobs.charts.prChart.addData([], this.parsedCsv.rArr.slice(this.i, this.wEnd), 1);
        drawMapPolyline(this.parsedCsv, this.i, this.wEnd, this.maxId);
        this.i = this.wEnd;
        if (this.i == this.maxId) {
            window.myGlobs.drawingFinished.flag = true;
        }
    }

    drawLastCone() {
        drawCone(this.parsedCsv.longLatArr[this.wEnd-1][0], 
                 this.parsedCsv.longLatArr[this.wEnd-1][1], true);
    }
};
