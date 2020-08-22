import { drawCone } from "./mapDraw";
import { 
    changeBtnStatus, switchInputBtnStatus, swapImageBtn
} from "./animation";
import IGlobalState from "./IGlobalState";
import { StreamProcessor } from "./dataProcessors";

export function onStreamClosed(state: IGlobalState) {
    if ( state.dataProcessors.streamProcessor.maxMeasurementId > 1 ) { 
        state.vars.lastBatchFlag = true;
        // draw final points and cone if the data was sent
        state.dataProcessors.streamProcessor.parseData(state.vars); // initiates drawPause function
        drawCone(
            state.maps, 
            state.dataProcessors.streamProcessor.parsedData.lon[
                state.dataProcessors.streamProcessor.maxMeasurementId-1
            ], 
            state.dataProcessors.streamProcessor.parsedData.lat[
                state.dataProcessors.streamProcessor.maxMeasurementId-1
            ], true
        );
        if ( state.buttons.checkBox.box.checked ) {
            // copy collected data to the fileprocessor so it "can be played"
            state.dataProcessors.fileProcessor.parsedData = state.dataProcessors.streamProcessor.parsedData;
        } else {
            state.dataProcessors.fileProcessor.parsedData = null
        }
        // hack: free the streamProcess object after a second (give a time to animation)
        // setTimeout(() => state.dataProcessors.streamProcessor.initVars(), 1000);
        setTimeout(() => {
            state.dataProcessors.streamProcessor = new StreamProcessor();
        }, 1000);
    }
    changeBtnStatus(state.buttons.playBtn, "playColor", false, [`#aaaaaa`, `#bbbbbb`]); // change play button color back
    if ( state.vars.playClicked ) {
        state.vars.playClicked = false;
        swapImageBtn("play-button-img", "./img/play-bold.png")
    }
    state.vars.stopFlag = false;

    switchInputBtnStatus(state, false);
    state.vars.serverBtnState = false;
    state.vars.startStreamFlag = false;
    changeBtnStatus(state.buttons.uploadConfigBtn, "uploadColor", true, [`#888`, `#888`]);
    changeBtnStatus(state.buttons.downloadBtn, "downloadColor", false, [`#aaaaaa`, `#bbbbbb`]);
    changeBtnStatus(state.buttons.checkBox.text, "checkColor", false, [`#888`, `#888`]);
    changeBtnStatus(state.buttons.checkBox.checkmark, "checkColor", false, [`#888`, `#888`]);
    state.buttons.checkBox.box.disabled = true;
}