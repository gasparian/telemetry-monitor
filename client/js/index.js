/*---------------------------------------------------------------------------------------------------*/
function getGlobs() {
    return {
        // position accuracy multiplier
        "globPosMult": 2,
        "globThin": 10,
        "batchSize": 10,
        "globTimeoutMs": 500,

        // buttons 
        "playBtn": document.getElementById("play"),
        "pauseBtn": document.getElementById("pause"),
        "stopBtn": document.getElementById("stop"),
        "serverBtn": document.getElementById("server-start-button"),
        "slider": document.querySelector('input[name=range-input]'),

        // file upload
        "fileInput": document.getElementById("inp-file"),
        "fileInputBtn": document.getElementById("inp-file-button"),

        "fileProcessor": new processDataFile(),

        "rangeVal": document.getElementById("range-output"),
        "range": document.getElementById("range-freq"),

        // Init graphs
        "altChart": new myChart(ylabel="Alt, m", chartName='alt-chart', title="Altitude"),
        "prChart": new myChart(ylabel="Angle, rad.", chartName='pr-chart', title="Pitch/Roll"),
        "yawChart": new myChart(ylabel="Angle, rad.", chartName='yaw-chart', title="Yaw"),
        "posChart": new myChart(ylabel="Pos., m", chartName='pos-chart', title="pos_accuracy"),
        "velChart": new myChart(ylabel="V, m/s", chartName='vel-chart', title="vel_accuracy"),
        "numsatChart": new myChart(ylabel="#", chartName='numsat-chart', title="num_satelites"),

        "resetZoom": document.getElementById("zoom-reset"),

        // maps globals
        "currentMap": undefined,
        "mapView": undefined,
        "sceneView": undefined,
        "Graphic": undefined,
        "graphicsLayer": undefined,
        "Point": undefined,
        "multiPoint": undefined
    }
}

let GLOBS = getGlobs();

GLOBS.fileInputBtn.onclick = function(e) {
    GLOBS.fileInput.click();
};

// freq. input
let freqValues = [1,2,5,10,20,50,100];
let maxFreq = 100;
GLOBS.range.oninput = function(e) {
    GLOBS.rangeVal.innerHTML = `${freqValues[GLOBS.range.value]} Hz`;
    GLOBS.globThin = Math.floor(maxFreq / freqValues[GLOBS.range.value]);
    GLOBS.fileInput.value = "";
};

GLOBS.resetZoom.onclick = function(e) {
    GLOBS.altChart.chart.resetZoom();
    GLOBS.prChart.chart.resetZoom();
    GLOBS.yawChart.chart.resetZoom();
    GLOBS.posChart.chart.resetZoom();
    GLOBS.velChart.chart.resetZoom();
    GLOBS.numsatChart.chart.resetZoom();
};

/*---------------------------------------------------------------------------------------------------*/

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

// initialize ArcGIS map
require(["esri/Map", "esri/views/MapView", "esri/views/SceneView", "esri/Graphic", 
         "esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/Multipoint"], 
        function(Map, MapView, SceneView, GraphicClass, GraphicsLayer, PointClass, MultipointClass) {
    GLOBS.currentMap = new Map({basemap: "streets-night-vector"});
    GLOBS.sceneView = new SceneView({
        container: "map-view",
        map: GLOBS.currentMap,
        zoom: 12,
        center: [11.5820, 48.1351]
    });
    GLOBS.graphicsLayer = new GraphicsLayer();
    GLOBS.currentMap.add(GLOBS.graphicsLayer);

    GLOBS.Graphic = GraphicClass;
    GLOBS.Point = PointClass;
    GLOBS.multiPoint = MultipointClass;
});

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

/*-------------------------------------------- Graphs -----------------------------------------------*/

// read file callback
const readSw = new Stopwatch();
GLOBS.fileInput.onchange = function(e) {
    if (GLOBS.fileInput.value) {
        // Rename button or text later ?
        // fileInputText.innerHTML = fileInput.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];

        switchCoverSpin(true);
        readSw.start();
        GLOBS.fileProcessor.loadFile();
        readSw.stop();

        setTimeout(() => switchCoverSpin(false), 
                   readSw.duration <= 1.0 ? 1000 : 10);
        readSw.reset();
    } 
};

/*-------------------------------------------- Graphs -----------------------------------------------*/

/*----------------------------------------- Offline Player -------------------------------------------*/

let playClicked = false;
GLOBS.playBtn.onclick = async function(e) {
    playClicked = true;
    changeBtnStatus(GLOBS.slider, "sliderColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(GLOBS.slider, "trackColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(GLOBS.serverBtn, "sendColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(GLOBS.fileInputBtn, "inpBtnColor", disabled=true, color=`#888`, hoverColor=`#888`);
    GLOBS.range.disabled = true;

    GLOBS.fileProcessor.batchSize = GLOBS.batchSize;
    if (!GLOBS.fileProcessor.stop) {
        GLOBS.fileProcessor.clearDrawing();
        GLOBS.fileProcessor.initVars(false);
        GLOBS.fileProcessor.draw();
    } else {
        GLOBS.fileProcessor.batchDraw();
    }
    GLOBS.fileProcessor.batchSize = null;
    GLOBS.fileProcessor.stop = false;
};

const stopSw = new Stopwatch();
GLOBS.stopBtn.onclick = function(e) {
    changeBtnStatus(GLOBS.slider, "sliderColor", disabled=false, color=`#f1f1f1`, hoverColor=`#f1f1f1`);
    changeBtnStatus(GLOBS.slider, "trackColor", disabled=false, color=`#639fff`, hoverColor=`#639fff`);
    changeBtnStatus(GLOBS.serverBtn, "sendColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
    changeBtnStatus(GLOBS.fileInputBtn, "inpBtnColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
    GLOBS.range.disabled = false;

    if (playClicked) {
        switchCoverSpin(true);
        stopSw.start();
        GLOBS.fileProcessor.stop = true;
        GLOBS.fileProcessor.batchDraw();
        stopSw.stop();
        GLOBS.fileProcessor.stop = false;
        GLOBS.fileProcessor.batchSize = null;
        setTimeout(() => switchCoverSpin(false), 
                stopSw.duration <= 1.0 ? 1000 : 10);
        stopSw.reset();
        playClicked = false;
    }
};

GLOBS.pauseBtn.onclick = function(e) {
    if (playClicked) {
        GLOBS.fileProcessor.stop = true;
    }
}

/*----------------------------------------- Offline Player -------------------------------------------*/

/*-------------------------------------- Server Communication ----------------------------------------*/

let serverBtnState = false;
GLOBS.serverBtn.onclick = function(e) {
    serverBtnState = serverBtnState ? false : true;

    if (serverBtnState) {
        changeBtnStatus(GLOBS.fileInputBtn, "inpBtnColor", disabled=true, color=`#888`, hoverColor=`#888`);
        changeBtnStatus(GLOBS.slider, "sliderColor", disabled=true, color=`#888`, hoverColor=`#888`);
        changeBtnStatus(GLOBS.slider, "trackColor", disabled=true, color=`#888`, hoverColor=`#888`);
        GLOBS.playBtn.disabled = true;
        GLOBS.pauseBtn.disabled = true;
        GLOBS.stopBtn.disabled = true;
        GLOBS.range.disabled = true;
        changeBtnStatus(GLOBS.serverBtn, "sendColor", disabled=false, color=`#fc3503`, hoverColor=`#fc3503`);
        GLOBS.serverBtn.innerHTML = "Close";
    } else {
        changeBtnStatus(GLOBS.fileInputBtn, "inpBtnColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
        changeBtnStatus(GLOBS.slider, "sliderColor", disabled=false, color=`#f1f1f1`, hoverColor=`#f1f1f1`);
        changeBtnStatus(GLOBS.slider, "trackColor", disabled=false, color=`#639fff`, hoverColor=`#639fff`);
        GLOBS.playBtn.disabled = false;
        GLOBS.pauseBtn.disabled = false;
        GLOBS.stopBtn.disabled = false;
        GLOBS.range.disabled = false;
        changeBtnStatus(GLOBS.serverBtn, "sendColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
        GLOBS.serverBtn.innerHTML = "Open";
    }
}

// Use later as an example of input forms 
// rangeVal.addEventListener("click", () => {
//     rangeVal.value = "";
// });
// rangeVal.addEventListener("keyup", function(event) {
//     event.preventDefault();
//     if (event.keyCode === 13) {
//         range.value = rangeVal.value;
//         rangeVal.value = `${rangeVal.value} Hz`;
//         updateThinFromRange();
//     }
// });

/*-------------------------------------- Server Communication ----------------------------------------*/
