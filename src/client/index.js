import myChart from "./charts_draw.js";
import { drawCone } from "./map_draw.js";
import { formCsv } from "./csv_parser.js";
import { clearDrawing, processDataFile, processStream, sendFileWebSocket } from "./data_processors.js";
import { Stopwatch, dataListener, getFormattedTime, updateTextArea, checkWsIsOpen } from "./misc.js";
import { drawPause, switchCoverSpin, changeBtnStatus, 
         stopAnimation, switchPlayerBtns, switchInputBtnStatus} from "./animation.js";

/*---------------------------------------------------------------------------------------------------*/
// DIRTY: create globals into window object
window.myGlobs = {
        // position accuracy multiplier
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
            requestid: undefined
        },

        buttons: {
            playBtn: document.getElementById("play"),
            stopBtn: document.getElementById("stop"),
            serverBtn: document.getElementById("server-start-button"),
            slider: document.querySelector('input[name=range-input]'),
            range: document.getElementById("range-freq"),
            resetZoom: document.getElementById("zoom-reset"),
            fileInputBtn: document.getElementById("inp-file-button"),
            downloadBtn: document.getElementById("download"),
            uploadConfigBtn: document.getElementById("upload-config"),
            checkBox: {
                text: document.getElementById("checkbox-container"),
                box: document.getElementById("checkbox-accumulate"),
                checkmark: document.getElementById("checkbox-checkmark")
            }
        },

        io: {
            rangeVal: document.getElementById("range-output"),
            fileInput: document.getElementById("inp-file"), // file upload
            configFileInput: document.getElementById("inp-config-file"),
            serverAdressInput: document.getElementById("server-address-inp"),
            serverLogOutput: document.getElementById("log"),
            ws: {},
        },

        charts: {
            alt: new myChart("Alt, m", 'alt-chart', "Altitude"),
            prChart: new myChart("Angle, rad.", 'pr-chart', "Pitch/Roll"),
            yaw: new myChart("Angle, rad.", 'yaw-chart', "Yaw"),
            pos_accuracy: new myChart("Pos., m", 'pos-chart', "pos_accuracy"),
            vel_accuracy: new myChart("V, m/s", 'vel-chart', "vel_accuracy"),
            numsats: new myChart("#", 'numsat-chart', "num_satelites")
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

        drawingFinished: new dataListener(false),
        command: undefined
    };

// declare data processors
window.myGlobs.fileProcessor = new processDataFile();
window.myGlobs.streamProcessor = new processStream();
// split on interfaces?

/*---------------------------------------------------------------------------------------------------*/

window.myGlobs.buttons.fileInputBtn.onclick = function(e) {
    window.myGlobs.io.fileInput.click();
};

// freq. input
let freqValues = [10,20,50,100,200];
window.myGlobs.buttons.range.oninput = function(e) {
    window.myGlobs.io.rangeVal.innerHTML = `${freqValues[window.myGlobs.buttons.range.value]} ticks`;
    window.myGlobs.vars.batchSize = freqValues[window.myGlobs.buttons.range.value];
    window.myGlobs.vars.maxGraphBuffLen = window.myGlobs.vars.batchSize * 5;
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
        switchCoverSpin(true);
        readSw.start();
        clearDrawing();
        window.myGlobs.fileProcessor.loadFile(window.myGlobs.io.fileInput.files[0]);
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
        window.myGlobs.fileProcessor.drawLastCone();
        window.myGlobs.fileProcessor.batchSize = undefined;
        window.myGlobs.stopFlag = false;
        playClicked = false;
        switchPlayerBtns(false);
        changeBtnStatus(window.myGlobs.buttons.playBtn, "playColor", false, [`#aaaaaa`, `#bbbbbb`]);
        document.getElementById("play-button-img").src = "./img/play-bold.png";
    }
});

let playClicked = false;
window.myGlobs.buttons.playBtn.onclick = async function(e) {
    const wsIsOpen = checkWsIsOpen();
    if ( window.myGlobs.fileProcessor.parsedData || window.myGlobs.io.ws.OPEN ) {
        changeBtnStatus(window.myGlobs.buttons.playBtn, "playColor", false, [`#bbbbbb`, `#bbbbbb`]);
        if (!playClicked) {
            if ( !wsIsOpen && window.myGlobs.fileProcessor.parsedData ) {
                playClicked = true;
                document.getElementById("play-button-img").src = "./img/pause-bold.png";
                switchPlayerBtns(true);
                window.myGlobs.fileProcessor.batchSize = window.myGlobs.batchSize;
                if (!window.myGlobs.vars.stopFlag) {
                    clearDrawing();
                    window.myGlobs.fileProcessor.initVars();
                    window.myGlobs.fileProcessor.startdraw();
                    window.myGlobs.drawingFinished.value = false;
                }
                drawPause("fileProcessor");
            } else if (wsIsOpen) {
                // some demo code; this should be changed with real server
                playClicked = true;
                window.myGlobs.buttons.playBtn.disable = true;
                window.myGlobs.command = "start stream";
                window.myGlobs.io.ws.send(window.myGlobs.command);
            }
        } else {
            playClicked = false;
            document.getElementById("play-button-img").src = "./img/play-bold.png";
            if ( !window.myGlobs.drawingFinished.value ) {
                window.myGlobs.vars.stopFlag = true;
                stopAnimation();
            }
        }
    }
};

const stopSw = new Stopwatch();
window.myGlobs.buttons.stopBtn.onclick = function(e) {
    if (window.myGlobs.fileProcessor.parsedData) {
        switchPlayerBtns(false);
        if (!window.myGlobs.drawingFinished.value) {
            switchCoverSpin(true);
            stopSw.start();
            stopAnimation();
            window.myGlobs.fileProcessor.batchSize = undefined;
            window.myGlobs.fileProcessor.iterDraw();
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

/*------------------------------- Server Communication / `Online` player -----------------------------*/

function onStreamClosed() {
    if ( window.myGlobs.streamProcessor.maxId > 1 ) { 
        // draw final points and cone if the data was sent
        window.myGlobs.streamProcessor.parseData(); // initiates drawPause function
        drawCone(window.myGlobs.streamProcessor.parsedData.lon[window.myGlobs.streamProcessor.maxId-1], 
                 window.myGlobs.streamProcessor.parsedData.lat[window.myGlobs.streamProcessor.maxId-1], true);
        if ( window.myGlobs.buttons.checkBox.box.checked ) {
            // copy collected data to the fileprocessor so it "can be played"
            window.myGlobs.fileProcessor.parsedData = window.myGlobs.streamProcessor.parsedData;
        }
        // hack: free the streamProcess object after a second (give a time to animation)
        setTimeout(() => window.myGlobs.streamProcessor.initVars(), 1000);
    }
    changeBtnStatus(window.myGlobs.buttons.playBtn, "playColor", false, [`#aaaaaa`, `#bbbbbb`]); // change play button color back
    if ( playClicked ) {
        playClicked = false;
        document.getElementById("play-button-img").src = "./img/play-bold.png";
    }
    window.myGlobs.vars.stopFlag = false;
}

let serverBtnState = false;
let startStreamFlag = false;
window.myGlobs.buttons.serverBtn.onclick = function(e) {
    let addressVal = window.myGlobs.io.serverAdressInput.value;
    if (addressVal) {
        serverBtnState = serverBtnState ? false : true;
        if (serverBtnState) {
            if ( (!window.myGlobs.io.ws.OPEN) || (window.myGlobs.io.ws.readyState == window.myGlobs.io.ws.CLOSED) ) {
                window.myGlobs.io.ws = new WebSocket(`ws://${addressVal}`);

                window.myGlobs.io.ws.onerror = function(event) {
                    alert("WebSocket error observed: ", event);
                };

                window.myGlobs.io.ws.addEventListener("open", function(e) {
                    playClicked = false;
                    // change the buttons state
                    changeBtnStatus(window.myGlobs.buttons.uploadConfigBtn, "uploadColor", false, [`#aaaaaa`, `#bbbbbb`]);
                    changeBtnStatus(window.myGlobs.buttons.downloadBtn, "downloadColor", true, [`#888`, `#888`]);
                    changeBtnStatus(window.myGlobs.buttons.playBtn, "playColor", false, [`#009578`, `#00b28f`]);
                    window.myGlobs.buttons.checkBox.box.disabled = false;
                    changeBtnStatus(window.myGlobs.buttons.checkBox.text, "checkColor", false, [`#f1f1f1`, `#f1f1f1`]);
                    changeBtnStatus(window.myGlobs.buttons.checkBox.checkmark, "checkColor", false, [`#f1f1f1`, `#f1f1f1`]);
                    document.getElementById("play-button-img").src = "./img/play-bold.png";
                    stopAnimation();
                });
                
                window.myGlobs.io.ws.addEventListener("message", function(e) {
                    const inMessage = e.data.toString();
                    if ( window.myGlobs.command == "start stream" ) { 
                        if ( !startStreamFlag ) {
                            clearDrawing();
                            window.myGlobs.streamProcessor.initVars(inMessage);
                            window.myGlobs.streamProcessor.startTimer();
                        }
                        startStreamFlag = true;
                        window.myGlobs.streamProcessor.updateArr(inMessage);
                    } else if ( window.myGlobs.command == "stop stream" ) {
                        onStreamClosed();
                        startStreamFlag = false;
                    } else {
                        updateTextArea(inMessage);
                    }
                });
            }
            switchInputBtnStatus(true);
        } else {
            if (window.myGlobs.io.ws.OPEN) {
                window.myGlobs.io.ws.close(); // async closing
                window.myGlobs.io.ws = {};

                onStreamClosed();
                switchInputBtnStatus(false);
                serverBtnState = false;
                startStreamFlag = false;
                changeBtnStatus(window.myGlobs.buttons.uploadConfigBtn, "uploadColor", true, [`#888`, `#888`]);
                changeBtnStatus(window.myGlobs.buttons.downloadBtn, "downloadColor", false, [`#aaaaaa`, `#bbbbbb`]);
                changeBtnStatus(window.myGlobs.buttons.checkBox.text, "checkColor", false, [`#888`, `#888`]);
                changeBtnStatus(window.myGlobs.buttons.checkBox.checkmark, "checkColor", false, [`#888`, `#888`]);
                window.myGlobs.buttons.checkBox.box.disabled = true;
            }
            switchInputBtnStatus(false);
            startStreamFlag = false;
        }
    }
}

window.myGlobs.buttons.downloadBtn.onclick = function(e) {
    const filename = "ride-" + getFormattedTime();
    let data = undefined;
    if ( window.myGlobs.streamProcessor.maxId > 1) {
        data = formCsv(window.myGlobs.streamProcessor.parsedData);
    } else if ( window.myGlobs.fileProcessor.parsedData ) {
        data = formCsv(window.myGlobs.fileProcessor.parsedData);
    }
    if ( data ) {
        const blob = new Blob([data], {type: 'text/csv'});

        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else {
            let elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename; 
            document.body.appendChild(elem);
            elem.click();        
            document.body.removeChild(elem);
        }
    }
}

// upload and send *.yaml config file to the embedded server
window.myGlobs.buttons.uploadConfigBtn.onclick = function(e) {
    window.myGlobs.io.configFileInput.click();
}
window.myGlobs.io.configFileInput.onchange = function(e) {
    const fname = window.myGlobs.io.configFileInput.value;
    const wsIsOpen = checkWsIsOpen();
    if (fname && wsIsOpen) {
        const fileExtension = fname.split('.').pop();
        if ( (fileExtension === "yaml") || (fileExtension === "yml") ) {
            sendFileWebSocket(window.myGlobs.io.configFileInput.files[0]);
        } else {
            alert("Config file must has a yaml/yml extension!");
        }
    }
    window.myGlobs.io.configFileInput.value = ""; // back to empty fname --> open file browser every time
};

/*-------------------------------------- Server Communication ----------------------------------------*/
