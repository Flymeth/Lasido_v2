"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAlbumOrPlaylist = exports.toYoutubeIDList = void 0;
const play_dl_1 = __importStar(require("play-dl"));
const node_worker_threads_1 = require("node:worker_threads");
const node_path_1 = __importDefault(require("node:path"));
async function newWorker(track) {
    if (track instanceof play_dl_1.YouTubeVideo)
        return track;
    return new Promise(res => {
        const worker = new node_worker_threads_1.Worker(node_path_1.default.join(__dirname, "#playlistConvertor.js"), { env: process.env, workerData: { track } });
        worker.once("message", (ytb) => res(ytb));
        worker.once("messageerror", () => res(undefined));
        worker.once("exit", () => res(undefined));
    });
}
async function toYoutubeIDList(tracks) {
    const result = tracks.map(t => newWorker(t));
    const unPromisedResult = await Promise.all(result);
    if (unPromisedResult.includes(undefined))
        return null;
    return unPromisedResult;
}
exports.toYoutubeIDList = toYoutubeIDList;
async function toAlbumOrPlaylist(url) {
    if (typeof url !== "string")
        url = url.toString();
    const validator = await play_dl_1.default.validate(url);
    if (!(validator && (validator.endsWith("playlist") || validator.endsWith("album"))))
        return null;
    switch (validator.slice(0, 2)) {
        case "dz": {
            const infos = await play_dl_1.default.deezer(url);
            if ("tracks" in infos)
                return infos;
            else
                return null;
        }
        case "yt": {
            return await play_dl_1.default.playlist_info(url);
        }
        case "so": {
            const infos = await play_dl_1.default.soundcloud(url);
            if ("tracks" in infos)
                return infos;
            return null;
        }
        case "sp": {
            const infos = await play_dl_1.default.spotify(url);
            if ("all_tracks" in infos)
                return infos;
            return null;
        }
        default: return null;
    }
}
exports.toAlbumOrPlaylist = toAlbumOrPlaylist;
