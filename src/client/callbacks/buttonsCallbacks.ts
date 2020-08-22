import { Stopwatch } from "../misc";
import IGlobalState, {IIoState, IChartsState, IMapsState} from "../IGlobalState"
import EventCallback from "./ICallbacks"
import {switchCoverSpin} from "../animation"
import {clearDrawing} from "../dataProcessors"

export function InpBtnOnClick(io: IIoState): EventCallback {
    return (e: Event) => {
        io.fileInput.click()
    }
}

export function rangeOnInput(state: IGlobalState): EventCallback {
    return (e: Event) => {
        const nTicks = Number(state.buttons.range.value)
        state.io.rangeVal.innerHTML = `${state.vars.freqValues[nTicks]} ticks`
        state.vars.batchSize = state.vars.freqValues[nTicks]
        state.vars.maxGraphBuffLen = state.vars.batchSize * 5
        state.io.fileInput.value = "" // to be able to reopen the file
    }
}

export function fileInputCallback(state: IGlobalState): EventCallback {
    return (e: Event) => {
        if (state.io.fileInput.value) {
            const sw = new Stopwatch()
            switchCoverSpin(true)
            sw.start()
            clearDrawing(state)
            state.dataProcessors.fileProcessor.loadFile(state)
            sw.stop()
        
            setTimeout(() => switchCoverSpin(false), 
                    sw.duration <= 1.0 ? 1000 : 10)
            sw.reset()
        } 
    }
}
