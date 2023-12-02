"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_worker_threads_1 = require("node:worker_threads");
const tracks_1 = require("./tracks");
const setPlayDLTokens_1 = require("../setPlayDLTokens");
if (!node_worker_threads_1.isMainThread) {
    const { track } = node_worker_threads_1.workerData;
    console.log(`Starting track at ${track.url}`);
    ;
    (async () => {
        await (0, setPlayDLTokens_1.setTokens)();
        const ytb = await (0, tracks_1.convertToYoutube)(track);
        if (ytb)
            node_worker_threads_1.parentPort?.postMessage(ytb);
        else
            node_worker_threads_1.parentPort?.emit("messageerror");
    })();
}
