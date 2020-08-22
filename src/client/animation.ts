import IGlobalState, {
    IVariablesState,
    IButtonsState,
} from "./IGlobalState"

export function drawPause(state: IGlobalState, processorName: string): number {
    let t0: number | null = null;
    let progress: number | null = null;
    let drawFrameFlag: boolean = false;
    let timeoutMs: number = state.vars.globTimeoutMs;

    function makeFrame(frameTime: number) {
        if ( (state.dataProcessors[processorName].measurementId < state.dataProcessors[processorName].maxMeasurementId) ) {
            if (!t0) {
                t0 = frameTime;
            }
            progress = frameTime - t0;
            if (!drawFrameFlag) {
                state.dataProcessors[processorName].iterDraw(state);
                drawFrameFlag = true;
            }
            if (progress >= timeoutMs) {
                t0 = null;
                drawFrameFlag = false;
            } 
            state.vars.requestid = window.requestAnimationFrame(makeFrame);
        }
    }

    return window.requestAnimationFrame(makeFrame);
}

export function stopAnimation(vars: IVariablesState): void {
    if (vars.requestid) {
        window.cancelAnimationFrame(vars.requestid);
        vars.requestid = null;
    }
}

export function switchCoverSpin(visible: boolean): void {
    document.getElementById("cover-spin").style.display = visible ? "block" : "none";
}

export function changeBtnStatus(btn: HTMLButtonElement | HTMLLabelElement | HTMLSpanElement, name: string, disabled=true, colors=[`#888`, `#888`]): void {
    name = "--" + name;
    btn.style.setProperty(name, colors[0]);
    btn.style.setProperty(name + "Hover", colors[1]);
    if (btn instanceof HTMLButtonElement) {
        btn.disabled = disabled;
    }
}

export function switchPlayerBtns(buttons: IButtonsState, status=true): void {
    let sliderColors: string[] = [`#888`, `#888`];
    let sliderTrackColors: string[] = [`#888`, `#888`];
    let serverBtnColors: string[] = [`#888`, `#888`];
    let fileInputBtnsColors: string[] = [`#888`, `#888`];
    if (!status) {
        sliderColors = [`#f1f1f1`, `#f1f1f1`];
        sliderTrackColors = [`#639fff`, `#639fff`]
        serverBtnColors = [`#009578`, `#00b28f`];
        fileInputBtnsColors = [`#009578`, `#00b28f`]; 
    }
    changeBtnStatus(buttons.slider, "sliderColor", status, sliderColors);
    changeBtnStatus(buttons.slider, "trackColor", status, sliderTrackColors);
    // changeBtnStatus(buttons.serverBtn, "sendColor", status, serverBtnColors);
    changeBtnStatus(buttons.fileInputBtn, "inpBtnColor", status, fileInputBtnsColors);
    buttons.range.disabled = status;
}

export function switchInputBtnStatus(state: IGlobalState, status=true): void {
    let fileInputBtnColors: string[] = [`#888`, `#888`];
    let sliderColors: string[] = [`#888`, `#888`];
    let sliderTrackColors: string[] = [`#888`, `#888`];
    let serverBtnColors: string[] = [`#fc3503`, `#fc3503`];
    if (!status) {
        fileInputBtnColors = [`#009578`, `#00b28f`];
        sliderColors = [`#f1f1f1`, `#f1f1f1`];
        sliderTrackColors = [`#639fff`, `#639fff`];
        serverBtnColors = [`#009578`, `#00b28f`];
    }
    changeBtnStatus(state.buttons.fileInputBtn, "inpBtnColor", status, fileInputBtnColors);
    changeBtnStatus(state.buttons.slider, "sliderColor", status, sliderColors);
    changeBtnStatus(state.buttons.slider, "trackColor", status, sliderTrackColors);
    changeBtnStatus(state.buttons.serverBtn, "sendColor", false, serverBtnColors);
    // buttons.playBtn.disabled = status;
    state.buttons.stopBtn.disabled = status;
    state.buttons.range.disabled = status;
    state.buttons.serverBtn.innerHTML = status ? "Close" : "Socket";
    state.io.serverAdressInput.disabled = status;
}

export function swapImageBtn(elementId: string, newImgPath: string): void {
    const playButtonImage = <HTMLImageElement> document.getElementById(elementId);
    playButtonImage.src = newImgPath;
}