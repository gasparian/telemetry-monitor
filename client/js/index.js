const fileInput = document.getElementById("inpFile");
const fileInputBtn = document.getElementById("inpFileButton");
const fileInputText = document.getElementById("inpFileText");
fileInputBtn.onclick = function(e) {
    fileInput.click();
};

/*-------------------------------------------- ArcGIS -----------------------------------------------*/
// maps globals
let currentMap;
let mapView;
let sceneView;

// initialize ArcGIS map
require(["esri/Map", "esri/views/MapView", "esri/views/SceneView"], function(Map, MapView, SceneView) {
    currentMap = new Map({basemap: "streets-night-vector"});
    sceneView = new SceneView({
        container: "mapView",
        map: currentMap,
        zoom: 12,
        center: [11.5820, 48.1351]
    });
});

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

/*-------------------------------------------- Graphs -----------------------------------------------*/
// Init graphs
let thin = 1;
let altChart = new myChart(ylabel="Alt, m", chartName='alt_chart', title="Altitude");
let pryChart = new myChart(ylabel="Angle, rad.", chartName='pr_chart', title="Pitch/Roll");
let yawChart = new myChart(ylabel="Angle, rad.", chartName='yaw_chart', title="Yaw");

// read file callback
fileInput.onchange = function(e) {
    if (fileInput.value) {
        fileInputText.innerHTML = fileInput.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
        processData(fileInput.files[0], 
                    altChart, pryChart, yawChart,
                    thin);
    } 
};

/*-------------------------------------------- Graphs -----------------------------------------------*/
