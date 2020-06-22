import { roundToPrecision } from "./misc.js";

// "timestamp,pitch,roll,yaw,alt,pos_accuracy,vel_accuracy,numsats,lon,lat"
export default function parseCsv(measurements, t0=undefined, useThin=true) {
    let thin = 1;
    if ( useThin ) {
        thin = window.myGlobs.vars.globThin;
    }
    let result = {}
    let count = 0;
    let flag = false;
    let cols = [];
    let dt;
    measurements.forEach(measurement => {
        if (count % thin) {
            count++;
            return;
        } 
        measurement = measurement.split(',');
        if (measurement[0] == "timestamp") {
            measurement.forEach(col => {
                cols.push(col);
                result[col] = [];
            });
            count++;
            return;
        }
        if ( measurement.length != 1 ) {
            if ( (!flag) & (!t0) ) {
                t0 = Date.parse(measurement[0]);
                flag = true;
            }
            dt = roundToPrecision((Date.parse(measurement[0]) - t0) / 1000.0, 100); // timestamp
            result.timestamp.push(dt);
            for ( let i=1; i < measurement.length; i++ ) {
                result[cols[i]].push(parseFloat(measurement[i]));
            }
        };
        count++;
    });
    return {result, t0}
};

export function formCsv(data) {
    let result = [Object.keys(data).join(",")];
    const n_rows = data.timestamp.length;
    for ( let i=0; i < n_rows; i++ ) {
        let row = [];
        for ( const col in data ) {
            row.push(data[col][i]);
        }
        result.push(row.join(","));
    }
    return result.join("\n");
}

