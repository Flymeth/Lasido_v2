import { Guild, GuildMember, MessageCreateOptions, MessagePayload, User } from "discord.js"
import { Voice, destroyVoice, getVoice } from "./voice"
import { AudioPlayerStatus, AudioResource, StreamType, createAudioResource, demuxProbe } from "@discordjs/voice"
import { Lasido } from "../../_main"
import { getSettings, updateSettings } from "../settings"
import { fromQueueType, getInfosEmbed, newAudioResource, toQueueType } from "./tracks"
import { DeezerTrack, SoundCloudTrack, SpotifyTrack, YouTubeVideo, yt_validate } from "play-dl"
import GuildSettingJsonFile, { queueItem } from "../../../database/schema/guildSettings"
import { EventEmitter } from "node:events";
import * as converter from "../../utils/music/converter";

const platines_cache = new Map<string, Platines>()

interface PlatinesEvents {
    trackChange: (video: YouTubeVideo, index: number) => any,
    resumed: () => any,
    paused: () => any,
    stop: () => any,
    nexted: () => any,
    previoused: () => any,
    shuffleChange: (before: boolean, now: boolean) => any,
    loopChange: () => any,
    queueChange: () => any,
    queueAdd: (item: queueItem) => any,
    queueRemove: (deleted: queueItem) => any,
    destroy: () => any,
    skipped: (to_track_index: number) => any,
    volumeChange: (from: number, to: number) => any,
    djChanged: () => any,
    broadcastChanged: () => any
}

export class Platines extends EventEmitter {
    connection: Voice["connection"]
    player: Voice["player"]
    lasido: Lasido
    guild: Guild
    currentRessource?: AudioResource

    constructor(lasido: Lasido, voice: Voice, guild: Guild) {
        super()

        this.connection= voice.connection
        this.player= voice.player
        this.lasido= lasido
        this.guild= guild

        const { Idle } = AudioPlayerStatus
        if(!this.player.listeners(Idle).length) {
            this.player.on(Idle, () => this.next())
        }
        this.on("volumeChange", async (_, value) => {
            this.currentRessource?.volume?.setVolume(value)
        })
    }

    destroy() {
        this.player.removeAllListeners(AudioPlayerStatus.Idle)

        platines_cache.delete(this.guild.id)
        destroyVoice(this.guild)
        this.emit("destroy")
        this.removeAllListeners()
    }

    get settings() {
        return getSettings(this.guild)
    }
    updateSettings = (updater: (settings: GuildSettingJsonFile) => void) => updateSettings(this.guild, updater)

    async broadcast(message: string | MessagePayload | MessageCreateOptions, force?: boolean) {
        const { broadcast } = (await this.settings).settings
        if(!((force || broadcast.active) && broadcast.channel)) return false
        const channel = await this.lasido.channels.fetch(broadcast.channel)
        if(!(channel && channel.isTextBased())) return false
        return channel.send(message).catch(() => undefined)
    }

    /**
     * Please avoid using this method (it does not update the track index)
     */
    async play(ressource: AudioResource) {
        this.currentRessource= ressource
        this.currentRessource?.volume?.setVolume((await this.settings).music.options.volume)
        this.player.play(this.currentRessource)
    }
    async playTrack(id: number) {
        const { music } = await this.settings

        if(id < 0) id = music.queue.length + id
        const track = music.queue[id]
        if(!track) {
            console.error(`Track with id <${id}> cannot be played.`)
            return false
        }

        this.updateSettings((s) => s.music.active_track= id)
        const infos = await fromQueueType(track).then(d => converter.convertToYoutubeVideos(d)).then(r => r[0])
        if(!(infos instanceof YouTubeVideo)) {
            console.error(`I did not found any youtube video for track with id <${track.src}:${track.id}>.`)
            return false
        }

        this.emit("trackChange", infos, id)
        const ressource = await newAudioResource(infos)
        if(!ressource) {
            this.broadcast({
                content: `Cannot create ressource from url "${infos.url.toString()}".`
            }, true)
            return false
        }
        getInfosEmbed(infos).then((embed) => this.broadcast({
            content: "Now playing:",
            embeds: [embed]
        }))
        this.play(ressource)

        return true
    }
    async resume() {
        if(this.player.state.status === AudioPlayerStatus.Playing) return;

        let done = false
        if((await this.settings).music.active_track < 0) done = await this.playTrack(0)
        else if(this.player.state.status === AudioPlayerStatus.Idle) done = await this.playTrack((await this.settings).music.active_track)
        else done = this.player.unpause()
        this.emit("resumed")

        return done
    }
    pause() {
        if(this.player.state.status === AudioPlayerStatus.Paused) return;
        const done = this.player.pause(true)
        this.emit("paused")

        return done
    }
    stop(reason = "Error occured.") {
        this.removeAllListeners()
        this.player.removeAllListeners()
        
        const done = this.player.stop(true)
        this.broadcast(`${reason}. The player stopped.`)
        this.currentRessource= undefined
        this.updateSettings(s => s.music.active_track = -1)
        this.emit("stop")
        
        return done
    }
    get status(): keyof typeof AudioPlayerStatus {
        const { status } = this.player.state
        for(const key in AudioPlayerStatus) {
            if(status === AudioPlayerStatus[key as keyof typeof AudioPlayerStatus]) return key as keyof typeof AudioPlayerStatus
        }
        throw new Error("Code error: this shouldn't supposed to append...")
    }
    async skipTo(track_index: number) {
        if(track_index >= (await this.settings).music.queue.length) return false
        this.updateSettings((s) => s.music.active_track= track_index)
        this.emit("skipped", track_index)

        return this.playTrack(track_index)
    }
    async randomSongIndex() {
        const { active_track, queue } = (await this.settings).music
        if(queue.length === 1) return 0
        let choosedIndex = active_track
        while(choosedIndex === active_track) {
            choosedIndex = Math.floor(Math.random() * queue.length)
        }

        return choosedIndex
    }
    async next() {
        const { active_track, queue, options: { loop, shuffle } } = (await this.settings).music
        
        if(loop.active && loop.loop_type === "song") {
            const done = await this.playTrack(active_track)
            this.emit("nexted")
            return done
        }
        if(shuffle) {
            const done = await this.playTrack(await this.randomSongIndex())
            this.emit("nexted")
            return done
        }

        let next_track_index = active_track + 1
        if(next_track_index >= queue.length) {
            next_track_index= 0

            if(!loop.active) return this.stop("Reached the queue's end")
        }

        const done = await this.playTrack(next_track_index)
        this.emit("nexted")
        return done
    }
    async previous() {
        const { active_track, queue, options: { loop, shuffle } } = (await this.settings).music
        if(loop.active && loop.loop_type === "song") {
            const done = await this.playTrack(active_track)
            this.emit("nexted")
            return done
        }
        if(shuffle) {
            const done = await this.playTrack(await this.randomSongIndex())
            this.emit("nexted")
            return done
        }

        let previous_track_index = active_track - 1
        if(previous_track_index < 0) {
            previous_track_index= queue.length -1

            if(!loop.active) return this.stop("Reached the queue's start")
        }
        const done = await this.playTrack(previous_track_index)
        this.emit("nexted")
        return done
    }

    async addToQueue(author: GuildMember | User, url: YouTubeVideo | SpotifyTrack | SoundCloudTrack | DeezerTrack | string | URL) {
        
        const data = await toQueueType(url)
        if(!data) return null
        const queueItem = { author: author.id, ...data }
        this.updateSettings((s) => s.music.queue.push(queueItem))

        this.emit("queueChange")
        this.emit("queueAdd", queueItem)
    }
    async getFromQueue(index: number) {
        const infos = (await this.settings).music.queue[index]
        return infos
    }
    async remFromQueue(index: number) {
        const item = (await this.settings).music.queue[index]

        this.updateSettings((s) => s.music.queue.splice(index, 1))
        this.emit("queueChange")
        this.emit("queueRemove", item)

        if(index === (await this.settings).music.active_track && this.status === "Playing") return this.next()
    }

    on<E extends keyof PlatinesEvents>(eventName: E, listener: PlatinesEvents[E]) {
        return super.on(eventName, listener)
    }
    emit<E extends keyof PlatinesEvents>(eventName: E, ...args: Parameters<PlatinesEvents[E]>) {
        return super.emit(eventName, ...args)
    }
}

export function getPlatines(lasido: Lasido, guild: Guild) {
    const cached = platines_cache.get(guild.id)
    if(cached) return cached

    const voice = getVoice(guild)
    if(voice) {
        const platines = new Platines(lasido, voice, guild)
        platines_cache.set(guild.id, platines)
        return platines
    }
}