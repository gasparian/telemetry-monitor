import myChart from "./charts_draw.js";
import processDataFile from "./file_processor.js";
import { Stopwatch } from "./misc.js";
import { drawPause, switchCoverSpin, changeBtnStatus, 
         stopAnimation, switchPlayerBtns, switchInputBtnStatus} from "./animation.js";

/*---------------------------------------------------------------------------------------------------*/
// DIRTY: assign all window.myGlobs to window object
window.myGlobs = {
        // position accuracy multiplier
        vars: {
            covarianceMult: 10, // GNSS uncertainty multiplier
            mapZoom: 18, 
            maxPointsDraw: 1000, // map threshold
            globThin: 10,
            newGlobThin: 10,
            batchT: 1, // in sec.
            batchSize: 10, // initial animation batch size
            newBatchSize: 10,
            globTimeoutMs: 250,
            stopFlag: false,
            rangeChanged: false,
        },

        buttons: {
            playBtn: document.getElementById("play"),
            stopBtn: document.getElementById("stop"),
            serverBtn: document.getElementById("server-start-button"),
            slider: document.querySelector('input[name=range-input]'),
            range: document.getElementById("range-freq"),
            resetZoom: document.getElementById("zoom-reset"),
            fileInputBtn: document.getElementById("inp-file-button")
        },

        io: {
            rangeVal: document.getElementById("range-output"),
            fileInput: document.getElementById("inp-file"), // file upload
            serverAdressInput: document.getElementById("server-address-inp"),
            serverMessageInput: document.getElementById("server-command-inp"),
            serverLogOutput: document.getElementById("log"),
            ws: {},
        },

        charts: {
            altChart: new myChart("Alt, m", 'alt-chart', "Altitude"),
            prChart: new myChart("Angle, rad.", 'pr-chart', "Pitch/Roll"),
            yawChart: new myChart("Angle, rad.", 'yaw-chart', "Yaw"),
            posChart: new myChart("Pos., m", 'pos-chart', "pos_accuracy"),
            velChart: new myChart("V, m/s", 'vel-chart', "vel_accuracy"),
            numsatChart: new myChart("#", 'numsat-chart', "num_satelites")
        },

        maps: {
            currentMap: undefined,
            mapView: undefined,
            sceneView: undefined,
            Graphic: undefined,
            graphicsLayer: undefined,
            Point: undefined,
            multiPoint: undefined,
        },

        drawingFinished: {
            valInternal: false,
            valListener: function(val) {},
            set flag(val) {
              this.valInternal = val;
              this.valListener(val);
            },
            get flag() {
              return this.valInternal;
            },
            registerListener: function(listener) {
              this.valListener = listener;
            }
          }
    };

const fileProcessor = new processDataFile();

window.myGlobs.buttons.fileInputBtn.onclick = function(e) {
    window.myGlobs.io.fileInput.click();
};

// freq. input
let freqValues = [1,2,5,10,20,50,100];
let maxFreq = 100;
window.myGlobs.buttons.range.oninput = function(e) {
    window.myGlobs.io.rangeVal.innerHTML = `${freqValues[window.myGlobs.buttons.range.value]} Hz`;
    window.myGlobs.vars.newGlobThin = Math.floor(maxFreq / freqValues[window.myGlobs.buttons.range.value]);
    window.myGlobs.vars.newBatchSize = Math.max(2, Math.floor(window.myGlobs.vars.batchT / (1/freqValues[window.myGlobs.buttons.range.value])));
    window.myGlobs.io.fileInput.value = ""; // to be able to reopen the file
};

window.myGlobs.buttons.resetZoom.onclick = function(e) {
    for ( const key in window.myGlobs.charts ) {
        window.myGlobs.charts[key].chart.resetZoom();
    }
};

/*---------------------------------------------------------------------------------------------------*/

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

// initialize ArcGIS map
require(["esri/Map", "esri/views/MapView", "esri/views/SceneView", "esri/Graphic", 
         "esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/Multipoint"], 
        function(Map, MapView, SceneView, GraphicClass, GraphicsLayer, PointClass, MultipointClass) {
    window.myGlobs.maps.currentMap = new Map({basemap: "streets-night-vector"});
    window.myGlobs.maps.sceneView = new SceneView({
        container: "map-view",
        map: window.myGlobs.maps.currentMap,
        zoom: 12,
        center: [11.5820, 48.1351]
    });
    window.myGlobs.maps.graphicsLayer = new GraphicsLayer();
    window.myGlobs.maps.currentMap.add(window.myGlobs.maps.graphicsLayer);

    window.myGlobs.maps.Graphic = GraphicClass;
    window.myGlobs.maps.Point = PointClass;
    window.myGlobs.maps.multiPoint = MultipointClass;
});

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

/*-------------------------------------------- Graphs -----------------------------------------------*/

const readSw = new Stopwatch();
window.myGlobs.io.fileInput.onchange = function(e) {
    if (window.myGlobs.io.fileInput.value) {
        // Rename button or text later ?
        // fileInputText.innerHTML = fileInput.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
        window.myGlobs.vars.globThin = window.myGlobs.vars.newGlobThin;
        window.myGlobs.vars.batchSize = window.myGlobs.vars.newBatchSize;
        switchCoverSpin(true);
        readSw.start();
        fileProcessor.clearDrawing();
        fileProcessor.loadFile(window.myGlobs.io.fileInput.files[0]);
        readSw.stop();
    
        setTimeout(() => switchCoverSpin(false), 
                readSw.duration <= 1.0 ? 1000 : 10);
        readSw.reset();
    } 
};

/*-------------------------------------------- Graphs -----------------------------------------------*/

/*----------------------------------------- Offline Player -------------------------------------------*/

// add listener to window.myGlobs.drawingFinished object
window.myGlobs.drawingFinished.registerListener(function(val) {
    if (val) {
        fileProcessor.drawLastCone();
        fileProcessor.batchSize = null;
        window.myGlobs.stopFlag = false;
        playClicked = false;
        switchPlayerBtns(false);
        changeBtnStatus(window.myGlobs.buttons.playBtn, "playColor", false, [`#aaaaaa`, `#bbbbbb`]);
        document.getElementById("play-button-img").src = "./img/play-bold.png";
    }
});

let playClicked = false;
window.myGlobs.buttons.playBtn.onclick = async function(e) {
    if (fileProcessor.parsedCsv) {
        changeBtnStatus(window.myGlobs.buttons.playBtn, "playColor", false, [`#bbbbbb`, `#bbbbbb`]);
        if (!playClicked) {
            playClicked = true;
            document.getElementById("play-button-img").src = "./img/pause-bold.png";
            switchPlayerBtns(true);
            fileProcessor.batchSize = window.myGlobs.batchSize;
            if (!window.myGlobs.vars.stopFlag) {
                fileProcessor.clearDrawing();
                fileProcessor.initVars(false);
                fileProcessor.startdraw();
                window.myGlobs.drawingFinished.flag = false;
            }
            drawPause(fileProcessor, window.myGlobs.vars);
        } else {
            playClicked = false;
            document.getElementById("play-button-img").src = "./img/play-bold.png";
            if (!window.myGlobs.drawingFinished.flag) {
                window.myGlobs.vars.stopFlag = true;
                stopAnimation();
            }
        }
    }
};

const stopSw = new Stopwatch();
window.myGlobs.buttons.stopBtn.onclick = function(e) {
    if (fileProcessor.parsedCsv) {
        switchPlayerBtns(false);
        if (!window.myGlobs.drawingFinished.flag) {
            switchCoverSpin(true);
            stopSw.start();
            stopAnimation();
            fileProcessor.batchSize = null;
            fileProcessor.iterDraw();
            stopSw.stop();
            setTimeout(() => switchCoverSpin(false), 
                    stopSw.duration <= 1.0 ? 1000 : 10);
            stopSw.reset();
        }
        window.myGlobs.vars.stopFlag = false;
        playClicked = false;
        document.getElementById("play-button-img").src = "./img/play-bold.png";
    }
};

/*----------------------------------------- Offline Player -------------------------------------------*/

/*-------------------------------------- Server Communication ----------------------------------------*/

let serverBtnState = false;
window.myGlobs.buttons.serverBtn.onclick = function(e) {
    let addressVal = window.myGlobs.io.serverAdressInput.value;
    if (addressVal) {
        serverBtnState = serverBtnState ? false : true;
        if (serverBtnState) {
            if (!window.myGlobs.io.ws.OPEN) {
                window.myGlobs.io.ws = new WebSocket(`ws://${addressVal}`);

                window.myGlobs.io.ws.addEventListener("open", function(e) {
                    window.myGlobs.io.serverLogOutput.value += "Connection opened!\n";
                    window.myGlobs.io.serverLogOutput.scrollTop = window.myGlobs.io.serverLogOutput.scrollHeight;
                });
                
                window.myGlobs.io.ws.addEventListener("close", function(e) {
                    window.myGlobs.io.serverLogOutput.value += "Connection closed!";
                    window.myGlobs.io.serverLogOutput.scrollTop = window.myGlobs.io.serverLogOutput.scrollHeight;
                });
                
                window.myGlobs.io.ws.addEventListener("message", function(e) {
                    const inMessage = e.data.toString();
                    window.myGlobs.io.serverLogOutput.value += inMessage + "\n";
                    window.myGlobs.io.serverLogOutput.scrollTop = window.myGlobs.io.serverLogOutput.scrollHeight;
                });
            }
            switchInputBtnStatus(true);
        } else {
            if (window.myGlobs.io.ws.OPEN) {
                window.myGlobs.io.ws.close();
                window.myGlobs.io.ws = {};
            }
            switchInputBtnStatus(false);
        }
    }
}

window.myGlobs.io.serverMessageInput.addEventListener("click", () => {
    window.myGlobs.io.serverMessageInput.value = "";
});

window.myGlobs.io.serverMessageInput.addEventListener("keyup", function(event) {
    event.preventDefault();
    if ((event.keyCode === 13) & window.myGlobs.io.ws.OPEN) {
        let command = window.myGlobs.io.serverMessageInput.value;
        if ((command.length > 0) & (window.myGlobs.io.ws.readyState == window.myGlobs.io.ws.OPEN)) {
            window.myGlobs.io.ws.send(command);
        }
    }
});

/*-------------------------------------- Server Communication ----------------------------------------*/
