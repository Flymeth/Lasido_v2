"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatines = exports.Platines = void 0;
const voice_1 = require("./voice");
const voice_2 = require("@discordjs/voice");
const settings_1 = require("../settings");
const tracks_1 = require("./tracks");
const node_events_1 = require("node:events");
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
        const { Idle } = voice_2.AudioPlayerStatus;
        if (!this.player.listeners(Idle).length) {
            this.player.on(Idle, () => this.next());
        }
        this.on("volumeChange", async (_, value) => {
            this.currentRessource?.volume?.setVolume(value);
        });
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
    play(ressource) {
        this.currentRessource = ressource;
        this.player.play(this.currentRessource);
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
        const infos = await (0, tracks_1.fromQueueType)(track).then(d => (0, tracks_1.convertToYoutube)(d));
        if (!infos) {
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
    stop(reason = "Error occured.") {
        this.player.removeAllListeners(voice_2.AudioPlayerStatus.Idle);
        const done = this.player.stop(true);
        this.broadcast(`${reason}. The player stopped.`);
        this.currentRessource = undefined;
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
        this.updateSettings((s) => s.music.active_track = track_index);
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
        let next_track_index = active_track + 1;
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
        let previous_track_index = active_track - 1;
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
        if (index === (await this.settings).music.active_track && this.status === "Playing")
            return this.next();
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
