export function roundToPrecision(x, precision) {
    return Math.round((x + Number.EPSILON) * precision) / precision;
}

export class Stopwatch {
    constructor() {
        this.reset();
    }

    start() {
        let t = new Date();
        this.t0 = t.getTime();
    };

    stop() {
        let t = new Date();
        this.t1 = t.getTime();
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
