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
exports.getInfosEmbed = exports.getVideoInfos = exports.newAudioResource = exports.convertToYoutube = exports.fromQueueType = exports.toQueueType = exports.soid = exports.dzid = exports.spid = exports.ytid = exports.sourl = exports.dzurl = exports.spurl = exports.yturl = void 0;
const play_dl_1 = __importStar(require("play-dl"));
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const fast_average_color_node_1 = require("fast-average-color-node");
const colors_1 = require("../colors");
const youtube_converted_cache = new Map();
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
function ytid(url) {
    if (typeof url === "string")
        url = new URL(url);
    return url.searchParams.get("v");
}
exports.ytid = ytid;
function spid(url) {
    if (typeof url === "string")
        url = new URL(url);
    return /\/([^/]+)$/.exec(url.pathname)?.[1] || null;
}
exports.spid = spid;
exports.dzid = spid;
exports.soid = exports.dzid;
async function toQueueType(track) {
    if (track instanceof play_dl_1.YouTubeVideo) {
        const id = ytid(track.url);
        if (!id)
            return null;
        return { id, src: "yt" };
    }
    else if (track instanceof play_dl_1.DeezerTrack) {
        const id = (0, exports.dzid)(track.url);
        if (!id)
            return null;
        return { id, src: "dz" };
    }
    else if (track instanceof play_dl_1.SpotifyTrack) {
        const id = spid(track.url);
        if (!id)
            return null;
        return { id, src: "sp" };
    }
    else if (track instanceof play_dl_1.SoundCloudTrack) {
        const id = (0, exports.soid)(track.url);
        if (!id)
            return null;
        return { id, src: "so" };
    }
    else {
        if (typeof track !== "string")
            track = track.toString();
        const validator = await play_dl_1.default.validate(track);
        if (!validator
            || validator === "search"
            || validator.endsWith("album")
            || validator.endsWith("playlist"))
            return null;
        const type = validator.slice(0, 2);
        switch (type) {
            case "yt": {
                const id = ytid(track);
                if (!id)
                    return null;
                return { id, src: "yt" };
            }
            case "so": {
                const id = (0, exports.soid)(track);
                if (!id)
                    return null;
                return { id, src: "so" };
            }
            case "dz": {
                const id = (0, exports.dzid)(track);
                if (!id)
                    return null;
                return { id, src: "dz" };
            }
            case "sp": {
                const id = spid(track);
                if (!id)
                    return null;
                return { id, src: "sp" };
            }
        }
    }
    return null;
}
exports.toQueueType = toQueueType;
async function fromQueueType(infos) {
    const { id, src } = infos;
    switch (src) {
        case "dz": {
            return play_dl_1.default.deezer(dzurl(id));
        }
        case "sp": {
            return play_dl_1.default.spotify(spurl(id));
        }
        case "so": {
            return play_dl_1.default.soundcloud(sourl(id));
        }
        case "yt": {
            return getVideoInfos(yturl(id));
        }
    }
}
exports.fromQueueType = fromQueueType;
async function convertToYoutube(track) {
    if (track instanceof play_dl_1.YouTubeVideo)
        return track;
    const cached = youtube_converted_cache.get(track.url);
    if (cached)
        return cached;
    const title = "title" in track ? track.title : track.name;
    const artist = ("artist" in track ? track.artist.name :
        "artists" in track ? track.artists[0].name : track.user.name);
    const found = await play_dl_1.default.search(`music ${title} by ${artist}`, { source: { youtube: "video" }, limit: 1 });
    if (found.length) {
        youtube_converted_cache.set(track.url, found[0]);
        return found[0];
    }
}
exports.convertToYoutube = convertToYoutube;
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
        const yt_track = await convertToYoutube(track);
        if (!yt_track)
            return;
        src = yt_track.url;
    }
    if (!src)
        return;
    const stream = await play_dl_1.default.stream(src, { discordPlayerCompatibility: true });
    return (0, voice_1.createAudioResource)(stream.stream, {
        inputType: stream.type,
        silencePaddingFrames: 0
    });
}
exports.newAudioResource = newAudioResource;
async function getVideoInfos(url) {
    if (typeof url !== "string")
        url = url.toString();
    const cached = youtube_converted_cache.get(url);
    if (cached)
        return cached;
    if ((0, play_dl_1.yt_validate)(url) !== "video")
        throw new Error("Invalid video URL");
    const { video_details } = await (0, play_dl_1.video_basic_info)(url);
    youtube_converted_cache.set(url, video_details);
    return video_details;
}
exports.getVideoInfos = getVideoInfos;
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
