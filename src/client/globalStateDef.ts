import IGlobalState from "./IGlobalState"
import myChart from "./chartsDraw";
import { FileDataProcessor, StreamProcessor } from "./dataProcessors";
import { dataListener } from "./misc";

export default function getGlobalState(): IGlobalState {
    return {
        vars: {
            covarianceMult: 10, // GNSS uncertainty multiplier for map visualization
            mapZoom: 18,
            mapThin: 10, // take every Nth point to draw on the map
            globThin: 10, // thinning for uploaded ride parsing
            batchSize: 100, // initial animation batch size
            globTimeoutMs: 100, // animation timeout
            minDtMs: 500, // time to accumulate data from web-socket, ms
            maxGraphBuffLen: 500, // n ticks to keep on graphs
            stopFlag: false,
            rangeChanged: false,
            lastBatchFlag: false,
            requestid: null,
            drawingFinished: new dataListener(false),
            command: null,
            playClicked: false,
            serverBtnState: false,
            startStreamFlag: false,
            rangeDefaultVal: 100,
            freqValues: [10,20,50,100,200]
        },

        buttons: {
            playBtn: <HTMLButtonElement> document.getElementById("play"),
            stopBtn: <HTMLButtonElement> document.getElementById("stop"),
            serverBtn: <HTMLButtonElement> document.getElementById("server-start-button"),
            slider: <HTMLInputElement> document.querySelector('input[name=range-input]'),
            range: <HTMLInputElement> document.getElementById("range-freq"),
            fileInputBtn: <HTMLButtonElement> document.getElementById("inp-file-button"),
            downloadBtn: <HTMLButtonElement> document.getElementById("download"),
            uploadConfigBtn: <HTMLButtonElement> document.getElementById("upload-config"),
            checkBox: {
                text: <HTMLLabelElement> document.getElementById("checkbox-container"),
                box: <HTMLInputElement> document.getElementById("checkbox-accumulate"),
                checkmark: <HTMLSpanElement> document.getElementById("checkbox-checkmark")
            }
        },

        io: {
            rangeVal: <HTMLDivElement> document.getElementById("range-output"),
            fileInput: <HTMLInputElement> document.getElementById("inp-file"),
            configFileInput: <HTMLInputElement> document.getElementById("inp-config-file"),
            serverAdressInput: <HTMLInputElement> document.getElementById("server-address-inp"),
            ws: null
        },

        charts: {
            alt: new myChart("Alt, m", 'alt-chart', "Altitude"),
            prChart: new myChart("Angle, rad.", 'pr-chart', "Pitch/Roll"),
            yaw: new myChart("Angle, rad.", 'yaw-chart', "Yaw"),
            pos_accuracy: new myChart("Pos., m", 'pos-chart', "pos_accuracy"),
            vel_accuracy: new myChart("V, m/s", 'vel-chart', "vel_accuracy"),
            numsats: new myChart("#", 'numsat-chart', "num_satelites")
        },

        maps: {},

        dataProcessors: {
            fileProcessor: new FileDataProcessor(),
            streamProcessor: new StreamProcessor()
        }
    }
}