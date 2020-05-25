import { roundToPrecision } from "./misc.js";

// "timestamp,pitch,roll,yaw,alt,pos_accuracy,vel_accuracy,numsats,lon,lat"
export default function parseCsv(measurements) {
    let thin = window.myGlobs.vars.globThin;
    let result = {}
    let count = 0;
    let flag = false;
    let cols = [];
    let t0, dt;
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
            if (!flag) {
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
    return result
};
