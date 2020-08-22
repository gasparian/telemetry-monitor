import { roundToPrecision } from "./misc";
import { IMeasurement, IParserResult } from "./IMeasurement"
import {IVariablesState} from "./IGlobalState"

// "timestamp,pitch,roll,yaw,alt,pos_accuracy,vel_accuracy,numsats,lon,lat"
export default function parseCsv(vars: IVariablesState, measurements: string[], t0: null | number =null, useThin: boolean =true): IParserResult {
    let thin: number = 1
    if ( useThin ) {
        thin = vars.globThin
    }
    let result: IMeasurement = {}
    let count: number = 0
    let flag: boolean = false
    let cols: string[] = []
    let dt: number
    let splittedMeasurement: string[]
    measurements.forEach((measurement: string) => {
        if (count % thin) {
            count++
            return
        } 
        splittedMeasurement = measurement.split(',');
        if (splittedMeasurement[0] == "timestamp") {
            splittedMeasurement.forEach(col => {
                cols.push(col)
                result[col] = []
            })
            count++
            return
        }
        if ( splittedMeasurement.length != 1 ) {
            if ( (!flag) && (!t0) ) {
                t0 = Date.parse(splittedMeasurement[0])
                flag = true
            }
            dt = roundToPrecision((Date.parse(splittedMeasurement[0]) - t0) / 1000.0, 100) // timestamp
            result.timestamp.push(dt)
            for ( let i=1; i < splittedMeasurement.length; i++ ) {
                result[cols[i]].push(parseFloat(splittedMeasurement[i]))
            }
        }
        count++
    })
    return {result, t0}
}

export function formCsv(data: IMeasurement): string {
    let result: string[] = [Object.keys(data).join(",")]
    const n_rows: number = data.timestamp.length
    for ( let i=0; i < n_rows; i++ ) {
        let row = []
        for ( const col in data ) {
            row.push(data[col][i])
        }
        result.push(row.join(","))
    }
    return result.join("\n")
}

