/*---------------------------------------------------------------------------------------------------*/

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

const resetZoom = document.getElementById("zoom-reset");
resetZoom.onclick = function(e) {
    altChart.chart.resetZoom();
    prChart.chart.resetZoom();
    yawChart.chart.resetZoom();
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

// initialize ArcGIS map
require(["esri/Map", "esri/views/MapView", "esri/views/SceneView", "esri/Graphic", 
         "esri/layers/GraphicsLayer", "esri/geometry/Point"], 
        function(Map, MapView, SceneView, GraphicClass, GraphicsLayer, PointClass) {
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
});

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

/*-------------------------------------------- Graphs -----------------------------------------------*/

// read file callback
fileInput.onchange = function(e) {
    if (fileInput.value) {
        fileInputText.innerHTML = fileInput.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
        processData(fileInput.files[0], 
                    altChart, prChart, yawChart);
    } 
};

/*-------------------------------------------- Graphs -----------------------------------------------*/
