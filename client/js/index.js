let currentMap;
let mapView;

require(["esri/Map", "esri/views/MapView"], function(Map, MapView) {
    currentMap = new Map({basemap: "streets-night-vector"});
    mapView = new MapView({
        container: "mapView",
        map: currentMap,
        zoom: 5,
        center: [50, 50]
    });
});
