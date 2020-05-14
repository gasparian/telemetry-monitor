import { roundToPrecision } from "./misc.js";

export default function parseCsv(measurements, thin) {
    // long/latt
    let longLatArr = [];
    // pitch/roll/yaw arrays
    let pArr = [], rArr = [], yArr = [];
    // altitude array (m)
    let altArr = [], posAccArr = [], velAccArr = [];
    let numsatArr = [], ts = [], measurement_row = {};
    let count = 0, flag = false, i = 0, cols = [];
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
            });
            count++;
            return;
        }
        if ( !(measurement.length == 1) ) {
            measurement_row = {};
            i = 0;
            cols.forEach(col => {
                measurement_row[col] = measurement[i];
                i++;
            });
            if (!flag) {
                t0 = Date.parse(measurement_row["timestamp"]);
                flag = true;
            }
            dt = roundToPrecision((Date.parse(measurement_row["timestamp"]) - t0) / 1000.0, 100);
            ts.push(dt);
            pArr.push(parseFloat(measurement_row["pitch"]));
            rArr.push(parseFloat(measurement_row["roll"]));
            yArr.push(parseFloat(measurement_row["yaw"]));
            altArr.push(parseFloat(measurement_row["alt"]));
            posAccArr.push(parseFloat(measurement_row["pos_accuracy"]));
            velAccArr.push(parseFloat(measurement_row["vel_accuracy"]));
            numsatArr.push(parseFloat(measurement_row["numsats"]));
            longLatArr.push([parseFloat(measurement_row["lon"]), 
                             parseFloat(measurement_row["lat"])]);
        };
        count++;
    });
    return { ts, pArr, rArr, yArr, altArr, posAccArr, velAccArr, numsatArr, longLatArr };
};

