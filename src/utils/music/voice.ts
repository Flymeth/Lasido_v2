import { joinVoiceChannel, VoiceConnection, createAudioPlayer, AudioPlayer, PlayerSubscription, NoSubscriberBehavior } from "@discordjs/voice"
import { BaseGuildVoiceChannel, Guild, GuildMember, VoiceBasedChannel } from "discord.js"

export type Voice = {
    connection: VoiceConnection,
    player: AudioPlayer,
    subscription?: PlayerSubscription
}
const cache = new Map<Guild, Voice>()

export function getMemberVoiceChannel(member: GuildMember) {
    if(!member.voice) return undefined
    return member.voice.channel as VoiceBasedChannel
}

export function createVoice(channel: BaseGuildVoiceChannel): Voice {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfMute: false,
    })
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        }
    })
    const subscription = connection.subscribe(player)
    const voice = {connection, player, subscription}
    cache.set(channel.guild, voice)
    return voice
}

export function destroyVoice(guild: Guild) {
    const voice = getVoice(guild)
    if(!voice) return false
    const {connection, player} = voice
    player.stop(true)
    connection.destroy()
    return cache.delete(guild)
}

export function getVoice(guild: Guild): Voice | undefined {
    return cache.get(guild)
}
export function voiceExists(guild: Guild) {
    return cache.has(guild)
}

export function getAllVoices() {
    return Array.from(cache).map(([guild, voice]) => ({ guild, voice }))
}
export function filterVoices(predicate: (guild: Guild, voice: Voice) => boolean) {
    return getAllVoices().filter((v) => predicate(v.guild, v.voice))
}
export function findVoice(predicate: (guild: Guild, voice: Voice) => boolean) {
    return getAllVoices().find(({guild, voice}) => predicate(guild, voice))
}
