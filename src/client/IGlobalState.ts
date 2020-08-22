import {dataListener} from "./misc"
import myChart from "./chartsDraw";
import IDataProcessor from "./IDataProcessor"

export interface IVariablesState {
    covarianceMult: number
    mapZoom: number
    mapThin: number
    globThin: number
    batchSize: number
    globTimeoutMs: number
    minDtMs: number
    maxGraphBuffLen: number
    stopFlag: boolean
    rangeChanged: boolean
    lastBatchFlag: boolean
    requestid: number | null
    rangeDefaultVal: number
    drawingFinished: dataListener
    command: string | null
    playClicked: boolean
    serverBtnState: boolean
    startStreamFlag: boolean
    freqValues: number[]
}

export interface IButtonsState {
    playBtn: HTMLButtonElement
    stopBtn: HTMLButtonElement
    serverBtn: HTMLButtonElement
    slider: HTMLInputElement
    range: HTMLInputElement
    fileInputBtn: HTMLButtonElement
    downloadBtn: HTMLButtonElement
    uploadConfigBtn: HTMLButtonElement
    checkBox: {
        text: HTMLLabelElement
        box: HTMLInputElement
        checkmark: HTMLSpanElement
    }
}

export interface IIoState {
    rangeVal: HTMLDivElement
    fileInput: HTMLInputElement
    configFileInput: HTMLInputElement
    serverAdressInput: HTMLInputElement
    ws: null | WebSocket
}

// I end up with `any` type since smth 
// goes wrong with `chartjs` and `argis` libs in typescript ;(
export interface IChartsState { [key: string]: myChart }
export interface IMapsState { [key: string]: any }

export interface IDataProcessorsState { [key: string]: IDataProcessor }

export default interface IGlobalState {
    vars: IVariablesState
    buttons: IButtonsState
    io: IIoState
    charts: IChartsState
    maps: IMapsState
    dataProcessors: IDataProcessorsState
}
