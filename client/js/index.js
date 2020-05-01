/*---------------------------------------------------------------------------------------------------*/
// position accuracy multiplier
let globPosMult = 2;
let globThin = 10;

const fileInput = document.getElementById("inp-file");
const fileInputBtn = document.getElementById("inp-file-button");
const fileInputText = document.getElementById("inp-file-text");
fileInputBtn.onclick = function(e) {
    fileInput.click();
};

// Init graphs
let altChart = new myChart(ylabel="Alt, m", chartName='alt-chart', title="Altitude");
let prChart = new myChart(ylabel="Angle, rad.", chartName='pr-chart', title="Pitch/Roll");
let yawChart = new myChart(ylabel="Angle, rad.", chartName='yaw-chart', title="Yaw");
let posChart = new myChart(ylabel="Pos., m", chartName='pos-chart', title="pos_accuracy");
let velChart = new myChart(ylabel="V, m/s", chartName='vel-chart', title="vel_accuracy");
let numsatChart = new myChart(ylabel="#", chartName='numsat-chart', title="num_satelites");

const resetZoom = document.getElementById("zoom-reset");
resetZoom.onclick = function(e) {
    altChart.chart.resetZoom();
    prChart.chart.resetZoom();
    yawChart.chart.resetZoom();
    posChart.chart.resetZoom();
    velChart.chart.resetZoom();
    numsatChart.chart.resetZoom();
};

/*---------------------------------------------------------------------------------------------------*/

/*-------------------------------------------- ArcGIS -----------------------------------------------*/
// maps globals
let currentMap;
let mapView;
let sceneView;
let Graphic;
let graphicsLayer;
let Point;
let multiPoint;

// initialize ArcGIS map
require(["esri/Map", "esri/views/MapView", "esri/views/SceneView", "esri/Graphic", 
         "esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/Multipoint"], 
        function(Map, MapView, SceneView, GraphicClass, GraphicsLayer, PointClass, MultipointClass) {
    currentMap = new Map({basemap: "streets-night-vector"});
    sceneView = new SceneView({
        container: "map-view",
        map: currentMap,
        zoom: 12,
        center: [11.5820, 48.1351]
    });
    graphicsLayer = new GraphicsLayer();
    currentMap.add(graphicsLayer);

    Graphic = GraphicClass;
    Point = PointClass;
    multiPoint = MultipointClass;
});

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

/*-------------------------------------------- Graphs -----------------------------------------------*/

// read file callback
const sw = new Stopwatch();
fileInput.onchange = function(e) {
    if (fileInput.value) {
        fileInputText.innerHTML = fileInput.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];

        switchCoverSpin(true);
        sw.start();
        processData(fileInput.files[0], 
                    altChart, prChart, yawChart,
                    posChart, velChart, numsatChart);
        sw.start();

        setTimeout(() => switchCoverSpin(false), 
                   sw.duration <= 1.0 ? 1000 : 10);
        sw.reset();
    } 
};

/*-------------------------------------------- Graphs -----------------------------------------------*/
