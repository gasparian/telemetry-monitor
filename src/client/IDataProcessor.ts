import IGlobalState, {IVariablesState, IChartsState, IMapsState} from "./IGlobalState"
import { IMeasurement } from "./IMeasurement"
import { dataListener } from "./misc"

export default interface IDataProcessor {
    parsedData: null | IMeasurement
    maxMeasurementId: null | number
    reader?: FileReader
    batchSize: null | number
    measurementId: number
    windowEndMeasurementId: null | number    
    columns?: string
    measurements?: string[]
    length?: dataListener
    firstIter?: boolean
    firstMeasurementTime?: null | number
    timerInitTime?: number
    dt?: number

    initVars(cols?: string): void
    loadFile?(state: IGlobalState): void
    startDrawPause?(state: IGlobalState): void
    parseData(vars: IVariablesState): void
    startdraw?(state: IGlobalState): void
    iterDraw(state: IGlobalState): void
    drawLastCone?(maps: IMapsState): void
    registerLengthListener?(state: IGlobalState): void
    updateArr?(vars: IVariablesState, measurement: string): void
    startTimer?(): void
} 