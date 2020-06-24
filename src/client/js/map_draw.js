export function drawPolyLine(arr, clon, clat) {
    let polyline = {
        type: "polyline",
        paths: arr
    };

    let lineSymbol = {
        type: "simple-line",
        color: [226, 119, 40, 1.0], // rgba; orange
        width: 2
    };

    let polylineGraphic = new window.myGlobs.maps.Graphic({
        geometry: polyline,
        symbol: lineSymbol
    });

    // draw polyline
    window.myGlobs.maps.graphicsLayer.add(polylineGraphic);
    window.myGlobs.maps.sceneView.center = [clon, clat];
    window.myGlobs.maps.sceneView.zoom = window.myGlobs.vars.mapZoom;
}

export function drawPosPolyLine(arr, acc) {
    let polyline = {
        type: "polyline",
        paths: arr
    };

    acc = Math.max(1, acc);
    let lineSymbol = {
        type: "simple-line",
        color: [150, 50, 50, 0.2], // rgba; orange
        width: Math.max(2, Math.floor(window.myGlobs.vars.covarianceMult * acc))
    };

    let polylineGraphic = new window.myGlobs.maps.Graphic({
        geometry: polyline,
        symbol: lineSymbol
    });

    // draw polyline
    window.myGlobs.maps.graphicsLayer.add(polylineGraphic);
}

export function drawMapPolyline(arr, start, end, maxId) {
    end = Math.min(maxId, end);
    let counter = 0;
    let clon = 0;
    let clat = 0;
    let len = end - start;
    let newArr = [], posArr = [];
    let thin = Math.max(2, Math.ceil(len / window.myGlobs.vars.thinDivisor));
    for (let i=start; i < end; i++) {
        if ( !((len-i) % thin) || (i == (end-1)) || (i == start) ) {
            clon += arr.lon[i];
            clat += arr.lat[i];
            newArr.push([arr.lon[i], arr.lat[i]]);
            posArr.push(arr.pos_accuracy[i]);
            counter++;
        }
    }
    clon /= counter;
    clat /= counter;

    console.log(thin, counter);

    for (let i=1; i < newArr.length; i++) {
        drawPosPolyLine(newArr.slice(i-1, i+1), posArr[i]);
    }

    drawPolyLine(newArr, clon, clat);
}

export function drawCone(lon, lat, finish=false) {
    let point = {
        type: "point",
        longitude: lon,
        latitude: lat
    };

    let pointSymbol = {
        type: "point-3d", 
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
    };

    let pointGraphic = new window.myGlobs.maps.Graphic({
        geometry: point,
        symbol: pointSymbol
    });

    window.myGlobs.maps.graphicsLayer.add(pointGraphic);
}

export function drawPosAcc(lon, lat, acc, mult=2) {
    acc *= mult;

    let point = {
        type: "point",
        longitude: lon,
        latitude: lat
    };

    let pointSymbol = {
        type: "point-3d", 
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
    };

    let pointGraphic = new window.myGlobs.maps.Graphic({
        geometry: point,
        symbol: pointSymbol
    });

    window.myGlobs.maps.graphicsLayer.add(pointGraphic);
}
