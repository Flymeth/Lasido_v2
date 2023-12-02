"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTokens = void 0;
const play_dl_1 = __importDefault(require("play-dl"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function setTokens() {
    await play_dl_1.default.setToken({
        soundcloud: {
            client_id: await play_dl_1.default.getFreeClientID()
        },
        spotify: {
            client_id: process.env.SPOTIFY_CLIENT || "",
            client_secret: process.env.SPOTIFY_SECRET || "",
            refresh_token: process.env.SPOTIFY_REFRESH || "",
            market: "FR"
        }
    });
}
exports.setTokens = setTokens;
