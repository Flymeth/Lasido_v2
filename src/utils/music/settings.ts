import { BaseGuild } from "discord.js";
import { getSettings, updateSettings } from "../settings";
import { Platines } from "./platines";

/**
 * 
 * @param volume Must be included between 0 and 1
 */
export function setVolume(guild: BaseGuild | string, volume: number, platines?: Platines) {
    if(volume < 0 || volume > 2) return
    platines?.currentRessource?.volume?.setVolume(volume)
    updateSettings(guild, s => {
        platines?.emit("volumeChange", s.music.options.volume, volume)
        s.music.options.volume = volume
    })
}

export function setShuffle(guild: BaseGuild | string, type: "activate" | "desactivate" | "one-time", saveCurrentTrackIndex?: boolean, platines?: Platines) {
    if(type === "one-time") {

        updateSettings(guild, ({ music }) => {
            const active = music.queue[music.active_track]
            music.queue = music.queue
                .map(v => ({v, k: Math.random()}))
                .sort(({k: k1}, {k: k2}) => k2 - k1)
                .map(({v}) => v)
            if(active && saveCurrentTrackIndex) {
                const index = music.queue.findIndex(item => (
                    item.src === active.src 
                    && item.id === active.id
                    && item.author === active.author
                ))
                music.active_track= index
            }
        })

        platines?.emit("queueChange")
    }else {
        getSettings(guild).then(({music: {options}}) => {
            const value = type === "activate"
            if(options.shuffle === value) return
    
            updateSettings(guild, s => {
                s.music.options.shuffle = value
            })
            
            platines?.emit("shuffleChange", options.shuffle, value)
        })
    }
}

export function setLoop(guild: BaseGuild, option: {activate: true, type: "queue" | "song"} | {activate: false}, platines?: Platines) {
    updateSettings(guild, s => {
        if(!option.activate) s.music.options.loop.active = false
        else s.music.options.loop = {
            active: true,
            loop_type: option.type
        }
    })
    platines?.emit("loopChange")
}

export function setDJ(guild: BaseGuild, option: {active: false} | {active: true, role: string}, platines?: Platines) {
    updateSettings(guild, s => {
        s.settings.dj = option
    })

    platines?.emit("djChanged")
}

export function setBroadcast(guild: BaseGuild, option: {active: false} | {active: true, channel: string}, platines?: Platines) {
    updateSettings(guild, s => {
        s.settings.broadcast = option
    })

    platines?.emit("broadcastChanged")
}