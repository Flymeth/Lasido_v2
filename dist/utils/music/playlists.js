"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylist = void 0;
const play_dl_1 = __importDefault(require("play-dl"));
async function getPlaylist(url) {
    if (typeof url !== "string")
        url = url.toString();
    const type = await play_dl_1.default.validate(url);
    switch (type) {
        case "dz_album":
        case "dz_playlist": {
            return play_dl_1.default.deezer(url);
        }
        case "sp_album":
        case "sp_playlist": {
            return play_dl_1.default.spotify(url);
        }
        case "so_playlist": {
            return play_dl_1.default.soundcloud(url);
        }
        case "yt_playlist": {
            return play_dl_1.default.playlist_info(url);
        }
        default:
            return null;
    }
}
exports.getPlaylist = getPlaylist;
