import getGlobalState from "./globalStateDef"
import {
    InpBtnOnClick,
    rangeOnInput,
    fileInputCallback,
} from "./callbacks/buttonsCallbacks"
import {
    registerDrawingFinishedCallback,
    playBtnCallback,
    stopBtnCallback,
    serverBtnCallback,
    downloadBtnCallback,
    configFileInputCallback,
} from "./callbacks/playerCallbacks"

/* --------------------------------------- Variables --------------------------------------- */

const globalState = getGlobalState()

/* --------------------------------------- Variables --------------------------------------- */

/* ---------------------------------------- ArcGis ----------------------------------------- */

import { loadModules } from 'esri-loader'
loadModules([
    "esri/Map", "esri/views/SceneView", "esri/Graphic", 
    "esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/Multipoint", 
    "esri/geometry/Polyline", "esri/symbols/PointSymbol3D"]).then(
    ([
        Map, SceneView, Graphic, GraphicsLayer, 
        Point, Multipoint, Polyline, PointSymbol3D]) => {
            globalState.maps.currentMap = new Map({basemap: "streets-night-vector"})
            globalState.maps.sceneView = new SceneView({
                container: "map-view",
                map: globalState.maps.currentMap,
                zoom: 12,
                center: [11.5820, 48.1351]
            })
            globalState.maps.graphicsLayer = new GraphicsLayer()
            globalState.maps.currentMap.add(globalState.maps.graphicsLayer)
        
            globalState.maps.Graphic = Graphic
            globalState.maps.Point = Point
            globalState.maps.multiPoint = Multipoint
            globalState.maps.Polyline = Polyline
            globalState.maps.PointSymbol3D = PointSymbol3D
    }
)

/* ---------------------------------------- ArcGis ----------------------------------------- */

/* ----------------------------------- Buttons callbacks ----------------------------------- */

globalState.dataProcessors.streamProcessor.registerLengthListener!(globalState)
globalState.buttons.fileInputBtn.addEventListener("click", InpBtnOnClick(globalState.io))
globalState.buttons.range.addEventListener("input", rangeOnInput(globalState))

/* ----------------------------------- Buttons callbacks ----------------------------------- */

/* ------------------------------------ Offline Player ------------------------------------- */

globalState.io.fileInput.addEventListener("change", fileInputCallback(globalState))

// adds listener to the drawingFinished object
globalState.vars.drawingFinished.registerListener( registerDrawingFinishedCallback(globalState) )

globalState.buttons.playBtn.addEventListener("click", playBtnCallback(globalState))
globalState.buttons.stopBtn.addEventListener("click", stopBtnCallback(globalState))

/* ------------------------------------ Offline Player ------------------------------------ */

/* ------------------------ Server Communication / Online player -------------------------- */

globalState.buttons.serverBtn.addEventListener("click", serverBtnCallback(globalState))
globalState.buttons.downloadBtn.addEventListener("click", downloadBtnCallback(globalState.dataProcessors))

// upload and send *.yaml config file to the embedded server
globalState.buttons.uploadConfigBtn.onclick = function(e) {
    globalState.io.configFileInput.click()
}

globalState.io.configFileInput.addEventListener("change", configFileInputCallback(globalState.io))

/* ------------------------ Server Communication / Online player -------------------------- */
