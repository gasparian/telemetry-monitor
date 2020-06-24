export function roundToPrecision(x, precision) {
    return Math.round((x + Number.EPSILON) * precision) / precision;
}

export function getCurrTime() {
    const t = new Date();
    return t.getTime();
}

export class Stopwatch {
    constructor() {
        this.reset();
    }

    start() {
        this.t0 = getCurrTime();
    };

    stop() {
        this.t1 = getCurrTime();
        this.dt += (this.t1 - this.t0) / 1000.0;
    };

    reset() {
        this.t0 = 0; 
        this.t1 = 0; 
        this.dt = 0;
    };

    get duration() {
        return this.dt;
    }
}

export class dataListener {
    constructor(initVal) {
       this.valInternal = initVal;
    }

    valListener(val) {};

    registerListener(listener) {
        this.valListener = listener;
    };

    set value(val) {
      this.valInternal = val;
      this.valListener(val);
    };

    get value() {
      return this.valInternal;
    };
};

export function getFormattedTime() {
    const today = new Date();
    const dateArr = [
        today.getFullYear(), today.getMonth() + 1, today.getDate(),
        today.getHours(), today.getMinutes(), today.getSeconds()
    ]
    return dateArr.join("-");
}

export function updateTextArea(text) {
    window.myGlobs.io.serverLogOutput.value += text + "\n";
    window.myGlobs.io.serverLogOutput.scrollTop = window.myGlobs.io.serverLogOutput.scrollHeight;
}

export function checkWsIsOpen() {
    const wsIsOpen = (window.myGlobs.io.ws.readyState) && (window.myGlobs.io.ws.readyState == window.myGlobs.io.ws.OPEN);
    return wsIsOpen;
}
