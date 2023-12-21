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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfosEmbed = exports.newAudioResource = exports.fromQueueType = exports.toQueueType = exports.sourl = exports.dzurl = exports.spurl = exports.yturl = void 0;
const play_dl_1 = __importStar(require("play-dl"));
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const fast_average_color_node_1 = require("fast-average-color-node");
const colors_1 = require("../colors");
const converter = __importStar(require("./converter"));
function yturl(id) {
    return `https://youtu.be/${id}`;
}
exports.yturl = yturl;
function spurl(id) {
    return `https://open.spotify.com/track/${id}`;
}
exports.spurl = spurl;
function dzurl(id) {
    return `https://deezer.com/track/${id}`;
}
exports.dzurl = dzurl;
function sourl(id) {
    return `https://api.soundcloud.com/tracks/${id}`;
}
exports.sourl = sourl;
async function toQueueType(track) {
    if (track instanceof URL || typeof track === "string") {
        if (typeof track !== "string")
            track = track.toString();
        const validator = await play_dl_1.default.validate(track);
        if (!validator
            || validator === "search"
            || validator.endsWith("album")
            || validator.endsWith("playlist"))
            return null;
        const id = converter.getID(track);
        if (!id)
            return null;
        const src = validator.slice(0, 2);
        return { id, src };
    }
    const { id, service } = converter.getBDDKey(track);
    if (!id)
        return null;
    return { id, src: service };
}
exports.toQueueType = toQueueType;
async function fromQueueType(infos, convert) {
    const { id, src } = infos;
    switch (src) {
        case "dz": {
            if (convert)
                return converter.convertToYoutubeVideos(dzurl(id)).then(r => r[0]);
            else
                return play_dl_1.default.deezer(dzurl(id));
        }
        case "sp": {
            if (convert)
                return converter.convertToYoutubeVideos(spurl(id)).then(r => r[0]);
            return play_dl_1.default.spotify(spurl(id));
        }
        case "so": {
            if (convert)
                return converter.convertToYoutubeVideos(sourl(id)).then(r => r[0]);
            return play_dl_1.default.soundcloud(sourl(id));
        }
        case "yt": {
            return (converter.convertToYoutubeVideos(yturl(id)).then(r => r[0]));
        }
    }
}
exports.fromQueueType = fromQueueType;
async function newAudioResource(track) {
    let src;
    if (track instanceof play_dl_1.YouTubeVideo) {
        src = track.url;
    }
    else if (track instanceof play_dl_1.SoundCloudTrack) {
        src = track.url;
    }
    else if (track instanceof URL || typeof track === "string") {
        src = track.toString();
    }
    else {
        const yt_track = await converter.convertToYoutubeVideos(track).then(r => r[0]);
        if (!(yt_track instanceof play_dl_1.YouTubeVideo))
            return;
        src = yt_track.url;
    }
    if (!src)
        return;
    const stream = await play_dl_1.default.stream(src, { discordPlayerCompatibility: true });
    return (0, voice_1.createAudioResource)(stream.stream, {
        inputType: stream.type,
        silencePaddingFrames: 0,
        inlineVolume: true
    });
}
exports.newAudioResource = newAudioResource;
async function getInfosEmbed(video) {
    const imageUrl = video.thumbnails.at(-1)?.url || null;
    const color = imageUrl ? (0, colors_1.hex_to_int)((await (0, fast_average_color_node_1.getAverageColor)(imageUrl)).hex) : null;
    return new discord_js_1.EmbedBuilder()
        .setTitle(video.title || null)
        .setImage(imageUrl)
        .setAuthor({
        name: video.channel?.name || "unknown channel",
        iconURL: video.channel?.icons?.at(-1)?.url,
        url: video.channel?.url
    })
        .setColor(color)
        .setURL(video.url);
}
exports.getInfosEmbed = getInfosEmbed;
