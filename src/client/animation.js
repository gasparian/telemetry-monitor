export function drawPause(classInstance) { // make an explicit arguments?
    let t0 = null;
    let progress = null;
    let drawFrameFlag = false;
    let batchSize = window.myGlobs.vars.batchSize;
    let timeoutMs = window.myGlobs.vars.globTimeoutMs;
    let processor = window.myGlobs[classInstance];

    function makeFrame(frameTime) {
        if ( (processor.i < processor.maxId) ) {
            if (!t0) {
                t0 = frameTime;
            }
            progress = frameTime - t0;
            if (!drawFrameFlag) {
                processor.batchSize = batchSize;
                processor.iterDraw();
                drawFrameFlag = true;
            }
            if (progress >= timeoutMs) {
                t0 = null;
                drawFrameFlag = false;
            } 
            window.myGlobs.requestid = window.requestAnimationFrame(makeFrame);
        }
    }

    return window.requestAnimationFrame(makeFrame);
}

export function stopAnimation() {
    if (window.myGlobs.requestid) {
        window.cancelAnimationFrame(window.myGlobs.requestid);
        window.myGlobs.requestid = undefined;
    }
}

export function switchCoverSpin(visible) {
    document.getElementById("cover-spin").style.display = visible ? "block" : "none";
}

export function changeBtnStatus(btn, name, disabled=true, colors=[`#888`, `#888`]) {
    name = "--" + name;
    btn.style.setProperty(name, colors[0]);
    btn.style.setProperty(name + "Hover", colors[1]);
    btn.disabled = disabled;
}

export function switchPlayerBtns(status=true) {
    let sliderColors = [`#888`, `#888`];
    let sliderTrackColors = [`#888`, `#888`];
    let serverBtnColors = [`#888`, `#888`];
    let fileInputBtnsColors = [`#888`, `#888`];
    if (!status) {
        sliderColors = [`#f1f1f1`, `#f1f1f1`];
        sliderTrackColors = [`#639fff`, `#639fff`]
        serverBtnColors = [`#009578`, `#00b28f`];
        fileInputBtnsColors = [`#009578`, `#00b28f`]; 
    }
    changeBtnStatus(window.myGlobs.buttons.slider, "sliderColor", status, sliderColors);
    changeBtnStatus(window.myGlobs.buttons.slider, "trackColor", status, sliderTrackColors);
    // changeBtnStatus(window.myGlobs.buttons.serverBtn, "sendColor", status, serverBtnColors);
    changeBtnStatus(window.myGlobs.buttons.fileInputBtn, "inpBtnColor", status, fileInputBtnsColors);
    window.myGlobs.buttons.range.disabled = status;
}

export function switchInputBtnStatus(status=true) {
    let fileInputBtnColors = [`#888`, `#888`];
    let sliderColors = [`#888`, `#888`];
    let sliderTrackColors = [`#888`, `#888`];
    let serverBtnColors = [`#fc3503`, `#fc3503`];
    if (!status) {
        fileInputBtnColors = [`#009578`, `#00b28f`];
        sliderColors = [`#f1f1f1`, `#f1f1f1`];
        sliderTrackColors = [`#639fff`, `#639fff`];
        serverBtnColors = [`#009578`, `#00b28f`];
    }
    changeBtnStatus(window.myGlobs.buttons.fileInputBtn, "inpBtnColor", status, fileInputBtnColors);
    changeBtnStatus(window.myGlobs.buttons.slider, "sliderColor", status, sliderColors);
    changeBtnStatus(window.myGlobs.buttons.slider, "trackColor", status, sliderTrackColors);
    changeBtnStatus(window.myGlobs.buttons.serverBtn, "sendColor", false, serverBtnColors);
    // window.myGlobs.buttons.playBtn.disabled = status;
    window.myGlobs.buttons.stopBtn.disabled = status;
    window.myGlobs.buttons.range.disabled = status;
    window.myGlobs.buttons.serverBtn.innerHTML = status ? "Close" : "Socket";
    window.myGlobs.io.serverAdressInput.disabled = status;
}