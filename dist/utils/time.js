"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getTime(ms) {
    const toSeconds = ms / 1000;
    const s = Math.floor(toSeconds % 3600 % 60);
    const m = Math.floor(toSeconds % 3600 / 60);
    const h = Math.floor(toSeconds / 3600);
    return { h, m, s, ms, toString: () => ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2) };
}
exports.default = getTime;
