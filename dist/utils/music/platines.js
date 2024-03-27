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
exports.getPlatines = exports.Platines = void 0;
const voice_1 = require("./voice");
const voice_2 = require("@discordjs/voice");
const settings_1 = require("../settings");
const tracks_1 = require("./tracks");
const play_dl_1 = require("play-dl");
const node_events_1 = require("node:events");
const converter = __importStar(require("../../utils/music/converter"));
const platines_cache = new Map();
class Platines extends node_events_1.EventEmitter {
    connection;
    player;
    lasido;
    guild;
    currentRessource;
    constructor(lasido, voice, guild) {
        super();
        this.connection = voice.connection;
        this.player = voice.player;
        this.lasido = lasido;
        this.guild = guild;
    }
    destroy() {
        this.player.removeAllListeners(voice_2.AudioPlayerStatus.Idle);
        platines_cache.delete(this.guild.id);
        (0, voice_1.destroyVoice)(this.guild);
        this.emit("destroy");
        this.removeAllListeners();
    }
    get settings() {
        return (0, settings_1.getSettings)(this.guild);
    }
    updateSettings = (updater) => (0, settings_1.updateSettings)(this.guild, updater);
    async broadcast(message, force) {
        const { broadcast } = (await this.settings).settings;
        if (!((force || broadcast.active) && broadcast.channel))
            return false;
        const channel = await this.lasido.channels.fetch(broadcast.channel);
        if (!(channel && channel.isTextBased()))
            return false;
        return channel.send(message).catch(() => undefined);
    }
    async play(ressource, source = "streaming_provider") {
        const { Idle } = voice_2.AudioPlayerStatus;
        if (!this.player.listenerCount(Idle)) {
            this.player.on(Idle, () => this.next());
        }
        if (!this.listenerCount("volumeChange")) {
            this.on("volumeChange", async (_, value) => {
                this.currentRessource?.ressource.volume?.setVolume(value);
            });
        }
        if (!this.player.listenerCount("error")) {
            const { stop } = this;
            this.player.on("error", err => {
                console.error(`An error with the current ressource:`);
                console.log(err);
                stop("Player just had a problem...");
            });
        }
        this.currentRessource = {
            ressource, source
        };
        this.currentRessource.ressource.volume?.setVolume((await this.settings).music.options.volume);
        this.player.play(this.currentRessource.ressource);
    }
    async playTrack(id) {
        const { music } = await this.settings;
        if (id < 0)
            id = music.queue.length + id;
        const track = music.queue[id];
        if (!track) {
            console.error(`Track with id <${id}> cannot be played.`);
            return false;
        }
        this.updateSettings((s) => s.music.active_track = id);
        const infos = await (0, tracks_1.fromQueueType)(track).then(d => converter.convertToYoutubeVideos(d)).then(r => r[0]);
        if (!(infos instanceof play_dl_1.YouTubeVideo)) {
            console.error(`I did not found any youtube video for track with id <${track.src}:${track.id}>.`);
            return false;
        }
        this.emit("trackChange", infos, id);
        const ressource = await (0, tracks_1.newAudioResource)(infos);
        if (!ressource) {
            this.broadcast({
                content: `Cannot create ressource from url "${infos.url.toString()}".`
            }, true);
            return false;
        }
        (0, tracks_1.getInfosEmbed)(infos).then((embed) => this.broadcast({
            content: "Now playing:",
            embeds: [embed]
        }));
        this.play(ressource);
        return true;
    }
    async resume() {
        if (this.player.state.status === voice_2.AudioPlayerStatus.Playing)
            return;
        let done = false;
        if ((await this.settings).music.active_track < 0)
            done = await this.playTrack(0);
        else if (this.player.state.status === voice_2.AudioPlayerStatus.Idle)
            done = await this.playTrack((await this.settings).music.active_track);
        else
            done = this.player.unpause();
        this.emit("resumed");
        return done;
    }
    pause() {
        if (this.player.state.status === voice_2.AudioPlayerStatus.Paused)
            return;
        const done = this.player.pause(true);
        this.emit("paused");
        return done;
    }
    stop(reason = "Error occured.", reset_active_track = true) {
        this.removeAllListeners();
        this.player.removeAllListeners();
        const done = this.player.stop(true);
        this.broadcast(`${reason} - The player stopped.`, true);
        this.currentRessource = undefined;
        if (reset_active_track)
            this.updateSettings(s => s.music.active_track = -1);
        this.emit("stop");
        return done;
    }
    get status() {
        const { status } = this.player.state;
        for (const key in voice_2.AudioPlayerStatus) {
            if (status === voice_2.AudioPlayerStatus[key])
                return key;
        }
        throw new Error("Code error: this shouldn't supposed to append...");
    }
    async skipTo(track_index) {
        if (track_index >= (await this.settings).music.queue.length)
            return false;
        this.emit("skipped", track_index);
        return this.playTrack(track_index);
    }
    async randomSongIndex() {
        const { active_track, queue } = (await this.settings).music;
        if (queue.length === 1)
            return 0;
        let choosedIndex = active_track;
        while (choosedIndex === active_track) {
            choosedIndex = Math.floor(Math.random() * queue.length);
        }
        return choosedIndex;
    }
    async next() {
        const { active_track, queue, options: { loop, shuffle } } = (await this.settings).music;
        if (loop.active && loop.loop_type === "song") {
            const done = await this.playTrack(active_track);
            this.emit("nexted");
            return done;
        }
        if (shuffle) {
            const done = await this.playTrack(await this.randomSongIndex());
            this.emit("nexted");
            return done;
        }
        let next_track_index = active_track;
        if (!loop.active)
            this.remFromQueue(active_track);
        else
            next_track_index++;
        if (next_track_index >= queue.length) {
            next_track_index = 0;
            if (!loop.active)
                return this.stop("Reached the queue's end");
        }
        const done = await this.playTrack(next_track_index);
        this.emit("nexted");
        return done;
    }
    async previous() {
        const { active_track, queue, options: { loop, shuffle } } = (await this.settings).music;
        if (loop.active && loop.loop_type === "song") {
            const done = await this.playTrack(active_track);
            this.emit("nexted");
            return done;
        }
        if (shuffle) {
            const done = await this.playTrack(await this.randomSongIndex());
            this.emit("nexted");
            return done;
        }
        let previous_track_index = active_track;
        if (!loop.active)
            this.remFromQueue(active_track);
        else
            previous_track_index--;
        if (previous_track_index < 0) {
            previous_track_index = queue.length - 1;
            if (!loop.active)
                return this.stop("Reached the queue's start");
        }
        const done = await this.playTrack(previous_track_index);
        this.emit("nexted");
        return done;
    }
    async addToQueue(author, url) {
        const data = await (0, tracks_1.toQueueType)(url);
        if (!data)
            return null;
        const queueItem = { author: author.id, ...data };
        this.updateSettings((s) => s.music.queue.push(queueItem));
        this.emit("queueChange");
        this.emit("queueAdd", queueItem);
    }
    async getFromQueue(index) {
        const infos = (await this.settings).music.queue[index];
        return infos;
    }
    async remFromQueue(index) {
        const item = (await this.settings).music.queue[index];
        this.updateSettings((s) => s.music.queue.splice(index, 1));
        this.emit("queueChange");
        this.emit("queueRemove", item);
    }
    on(eventName, listener) {
        return super.on(eventName, listener);
    }
    emit(eventName, ...args) {
        return super.emit(eventName, ...args);
    }
}
exports.Platines = Platines;
function getPlatines(lasido, guild) {
    const cached = platines_cache.get(guild.id);
    if (cached)
        return cached;
    const voice = (0, voice_1.getVoice)(guild);
    if (voice) {
        const platines = new Platines(lasido, voice, guild);
        platines_cache.set(guild.id, platines);
        return platines;
    }
}
exports.getPlatines = getPlatines;
