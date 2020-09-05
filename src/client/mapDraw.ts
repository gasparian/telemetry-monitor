import IGlobalState, {IChartsState, IMapsState} from "./IGlobalState"
import {IMeasurement} from "./IMeasurement"

export function drawPolyLine(
        state: IGlobalState, arr: number[][], 
        clon: number, clat: number): void {

    const polyline = new state.maps.Polyline({
        paths: [arr]
    })

    const lineSymbol = {
        type: "simple-line",
        color: [226, 119, 40, 1.0], // rgba orange
        width: 2
    }

    const polylineGraphic = new state.maps.Graphic({
        geometry: polyline,
        symbol: lineSymbol
    })

    // draw polyline
    state.maps.graphicsLayer.add(polylineGraphic)
    state.maps.sceneView.center = new state.maps.Point({
        latitude: clat, 
        longitude: clon
    })
    state.maps.sceneView.zoom = state.vars.mapZoom
}

export function drawPosPolyLine(
        state: IGlobalState, arr: number[][], acc: number): void {

    const polyline = new state.maps.Polyline({
        paths: [arr]
    })

    acc = Math.max(1, acc)
    const lineSymbol = {
        type: "simple-line",
        color: [150, 50, 50, 0.2], // rgba orange
        width: Math.max(2, Math.floor(state.vars.covarianceMult * acc))
    }

    const polylineGraphic = new state.maps.Graphic({
        geometry: polyline,
        symbol: lineSymbol
    })

    // draw polyline
    state.maps.graphicsLayer.add(polylineGraphic)
}

export function drawMapPolyline(
        state: IGlobalState, arr: IMeasurement, 
        start: number, end: number, 
        maxId: number, constructorName: string): void {

    end = Math.min(maxId, end)
    const len = end - start
    let newArr: number[][] = []
    let clon = 0
    let clat = 0

    if ( constructorName == "FileDataProcessor" ) {
        let counter = 0
        let posArr = []
        let thin = Math.max(2, state.vars.mapThin)
        for (let i=start; i < end; i++) {
            if ( !((len-i) % thin) || (i == (end-1)) || (i == start) ) {
                clon += arr.lon[i]
                clat += arr.lat[i]
                newArr.push([arr.lon[i], arr.lat[i]])
                posArr.push(arr.pos_accuracy[i])
                counter++
            }
        }
        clon /= counter
        clat /= counter
        for (let i=1; i < newArr.length; i++) {
            drawPosPolyLine(state, newArr.slice(i-1, i+1), posArr[i])
        }
    } else if ( constructorName == "StreamProcessor" ) {
        // make it simple: just draw line between first and last points
        newArr = [[arr.lon[start], arr.lat[start]], [arr.lon[end-1], arr.lat[end-1]]]
        clon = 0.5 * (arr.lon[start] + arr.lon[end-1])
        clat = 0.5 * (arr.lat[start] + arr.lat[end-1])
        drawPosPolyLine(state, newArr, arr.pos_accuracy[end-1])
    }

    drawPolyLine(state, newArr, clon, clat)
}

export function drawCone(
        maps: IMapsState, lon: number, 
        lat: number, finish=false): void {

    const point = new maps.Point({
        longitude: lon,
        latitude: lat
    })

    const pointSymbol = new maps.PointSymbol3D({
        // type: "point-3d", 
        symbolLayers: [{
          type: "object", 
          width: 10,   // diameter of the object from east to west in meters
          height: 20,  // height of object in meters
          depth: 10,   // diameter of the object from north to south in meters
          resource: {
              primitive: "inverted-cone"
          },
          material: { 
              color: finish ? [226, 40, 40, 1.0] : [226, 119, 40, 1.0]
          }
        }]
    })

    const pointGraphic = new maps.Graphic({
        geometry: point,
        symbol: pointSymbol
    })

    maps.graphicsLayer.add(pointGraphic)
}

export function drawPosAcc(
        maps: IMapsState, lon: number, 
        lat: number, acc: number, mult=2): void {

    acc *= mult

    const point = new maps.Point({
        longitude: lon,
        latitude: lat
    })

    const pointSymbol = new maps.PointSymbol3D({
        // type: "point-3d", 
        symbolLayers: [{
            type: "object", 
            width: acc,   // diameter of the object from east to west in meters
            height: 0.1,  // height of object in meters
            depth: acc,   // diameter of the object from north to south in meters
            resource: {
                primitive: "sphere"
            },
            material: { 
                color: [226, 119, 40, 0.5] 
            }
        }]
    })

    const pointGraphic = new maps.Graphic({
        geometry: point,
        symbol: pointSymbol
    })

    maps.graphicsLayer.add(pointGraphic)
}
