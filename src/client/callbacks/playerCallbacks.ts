import {
    onStreamClosed,
} from "../IoProcessors"
import { formCsv } from "../csvParser"
import { clearDrawing, sendFileWebSocket } from "../dataProcessors"
import { 
    Stopwatch, getFormattedTime, checkWsIsOpen 
} from "../misc"
import { 
    switchCoverSpin, changeBtnStatus, swapImageBtn,
    stopAnimation, switchPlayerBtns, switchInputBtnStatus,
} from "../animation";
import EventCallback, {RegisterListenerCallback} from "./ICallbacks"
import IGlobalState, {IDataProcessorsState, IIoState} from "../IGlobalState"

export function registerDrawingFinishedCallback(state: IGlobalState): RegisterListenerCallback {
    return (val) => {
        if (val) {
            state.dataProcessors.fileProcessor.drawLastCone(state.maps)
            state.dataProcessors.fileProcessor.batchSize = null
            state.vars.stopFlag = false
            state.vars.playClicked = false
            switchPlayerBtns(state.buttons, false)
            changeBtnStatus(state.buttons.playBtn, "playColor", false, [`#aaaaaa`, `#bbbbbb`])
            swapImageBtn("play-button-img", "./img/play-bold.png")
        }
    }
}

export function playBtnCallback(state: IGlobalState): EventCallback {
    return (e: Event) => {
        const wsIsOpen = checkWsIsOpen(state.io)
        if ( state.dataProcessors.fileProcessor.parsedData || (state.io.ws instanceof WebSocket) ) {
            changeBtnStatus(state.buttons.playBtn, "playColor", false, [`#bbbbbb`, `#bbbbbb`])
            if (!state.vars.playClicked) {
                if ( !wsIsOpen && state.dataProcessors.fileProcessor.parsedData ) {
                    state.vars.playClicked = true
                    swapImageBtn("play-button-img", "./img/pause-bold.png")
                    switchPlayerBtns(state.buttons, true)
                    state.dataProcessors.fileProcessor.batchSize = state.vars.batchSize
                    if (!state.vars.stopFlag) {
                        clearDrawing(state)
                        state.dataProcessors.fileProcessor.initVars()
                        state.dataProcessors.fileProcessor.startdraw(state)
                        state.vars.drawingFinished.value = false
                    }
                    state.dataProcessors.fileProcessor.startDrawPause(state)
                } else if (wsIsOpen) {
                    // some demo code; this should be changed with real server
                    state.vars.playClicked = true
                    state.buttons.playBtn.disabled = true
                    state.vars.command = "start stream"
                    if ( state.io.ws instanceof WebSocket) {
                        state.io.ws.send(state.vars.command)
                    }
                }
            } else {
                state.vars.playClicked = false
                swapImageBtn("play-button-img", "./img/play-bold.png")
                if ( !state.vars.drawingFinished.value ) {
                    state.vars.stopFlag = true
                    stopAnimation(state.vars)
                }
            }
        }
    }
}

export function stopBtnCallback(state: IGlobalState): EventCallback {
    return (e: Event) => {
        if (state.dataProcessors.fileProcessor.parsedData) {
            const sw = new Stopwatch()
            switchPlayerBtns(state.buttons, false)
            if (!state.vars.drawingFinished.value) {
                switchCoverSpin(true)
                sw.start()
                stopAnimation(state.vars)
                state.dataProcessors.fileProcessor.batchSize = null
                state.dataProcessors.fileProcessor.iterDraw(state)
                sw.stop()
                setTimeout(() => switchCoverSpin(false), 
                        sw.duration <= 1.0 ? 1000 : 10)
                sw.reset()
            }
            state.vars.stopFlag = false
            state.vars.playClicked = false
            swapImageBtn("play-button-img", "./img/play-bold.png")
        }
    }
}

export function serverBtnCallback(state: IGlobalState): EventCallback {
    return (e: Event) => {
        let addressVal = state.io.serverAdressInput.value
        if (addressVal) {
            state.vars.serverBtnState = state.vars.serverBtnState ? false : true
            if (state.vars.serverBtnState) {
                if ( !(state.io.ws instanceof WebSocket) || (state.io.ws.readyState == state.io.ws.CLOSED) ) {
                    state.io.ws = new WebSocket(`ws://${addressVal}`)

                    state.io.ws.onerror = function(event) {
                        alert("WebSocket error observed: " + event)
                        onStreamClosed(state)
                    };

                    state.io.ws.addEventListener("open", function(e) {
                        state.vars.lastBatchFlag = false
                        state.vars.playClicked = false
                        // change the buttons state
                        changeBtnStatus(state.buttons.uploadConfigBtn, "uploadColor", false, [`#aaaaaa`, `#bbbbbb`])
                        changeBtnStatus(state.buttons.downloadBtn, "downloadColor", true, [`#888`, `#888`])
                        changeBtnStatus(state.buttons.playBtn, "playColor", false, [`#009578`, `#00b28f`])
                        state.buttons.checkBox.box.disabled = false
                        changeBtnStatus(state.buttons.checkBox.text, "checkColor", false, [`#f1f1f1`, `#f1f1f1`])
                        changeBtnStatus(state.buttons.checkBox.checkmark, "checkColor", false, [`#f1f1f1`, `#f1f1f1`])
                        swapImageBtn("play-button-img", "./img/play-bold.png")
                        stopAnimation(state.vars)
                    })
                    
                    state.io.ws.addEventListener("close", function(e) {
                        // empty for now
                    })
                    
                    state.io.ws.addEventListener("message", function(e) {
                        const inMessage = e.data.toString()
                        if ( state.vars.command == "start stream" ) { 
                            if ( !state.vars.startStreamFlag ) {
                                clearDrawing(state)
                                state.dataProcessors.streamProcessor.initVars(inMessage)
                                state.dataProcessors.streamProcessor.registerLengthListener(state)
                                state.dataProcessors.streamProcessor.startTimer()
                            }
                            state.vars.startStreamFlag = true
                            state.dataProcessors.streamProcessor.updateArr(state.vars, inMessage)
                        } else if ( state.vars.command == "stop stream" ) {
                            onStreamClosed(state)
                            state.vars.startStreamFlag = false
                        }
                    })
                }
                switchInputBtnStatus(state, true)
            } else {
                if (state.io.ws instanceof WebSocket) {
                    state.io.ws.close()
                    state.io.ws = null

                    onStreamClosed(state)
                }
                switchInputBtnStatus(state, false)
                state.vars.startStreamFlag = false
            }
        }
    }
}

export function downloadBtnCallback(dataProcessors: IDataProcessorsState): EventCallback {
    return (e: Event) => {
        const filename = "ride-" + getFormattedTime()
        let data = null
        if ( dataProcessors.streamProcessor.maxMeasurementId > 1) {
            data = formCsv(dataProcessors.streamProcessor.parsedData)
        } else if ( dataProcessors.fileProcessor.parsedData ) {
            data = formCsv(dataProcessors.fileProcessor.parsedData)
        }
        if ( data ) {
            const blob = new Blob([data], {type: 'text/csv'})
    
            if(window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveBlob(blob, filename)
            }
            else {
                let elem = window.document.createElement('a')
                elem.href = window.URL.createObjectURL(blob)
                elem.download = filename
                document.body.appendChild(elem)
                elem.click()
                document.body.removeChild(elem)
            }
        }
    }
}

export function configFileInputCallback(io: IIoState): EventCallback {
    return (e: Event) => {
        const fname = io.configFileInput.value
        const wsIsOpen = checkWsIsOpen(io)
        if (fname && wsIsOpen) {
            const fileExtension = fname.split('.').pop()
            if ( (fileExtension === "yaml") || (fileExtension === "yml") ) {
                sendFileWebSocket(io)
            } else {
                alert("Config file must has a yaml/yml extension!")
            }
        }
        io.configFileInput.value = "" // back to empty fname --> open files browser every time
    }
}