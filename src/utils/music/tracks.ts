import playdl, {YouTubeVideo, SpotifyTrack, SoundCloudTrack, DeezerTrack, video_basic_info, yt_validate} from "play-dl"
import { createAudioResource } from "@discordjs/voice"
import { EmbedBuilder } from "discord.js"
import { getAverageColor } from "fast-average-color-node";
import { hex_to_int } from "../colors";
import { queueItem } from "../../../database/schema/guildSettings";
import * as converter from "./converter";

export function yturl(id: string) {
    return `https://youtu.be/${id}`
}
export function spurl(id: string) {
    return `https://open.spotify.com/track/${id}`
}
export function dzurl(id: string) {
    return `https://deezer.com/track/${id}`
}
export function sourl(id: string) {
    return `https://api.soundcloud.com/tracks/${id}`
}

export async function toQueueType(track: string | URL | DeezerTrack | YouTubeVideo | SpotifyTrack | SoundCloudTrack): Promise<Omit<queueItem, "author"> | null> {
    if(track instanceof URL || typeof track === "string") {
        if(typeof track !== "string") track = track.toString()
        const validator = await playdl.validate(track)
        if(
            !validator 
            || validator === "search"
            || validator.endsWith("album")
            || validator.endsWith("playlist")
        ) return null
        const id = converter.getID(track)
        if(!id) return null

        const src = validator.slice(0, 2) as converter.service_id
        return { id, src }
    }

    const { id, service } = converter.getBDDKey(track)
    if(!id) return null
    return { id, src: service }
}
export async function fromQueueType(infos: Omit<queueItem, "author">) {
    const { id, src } = infos
    switch(src) {
        case "dz": {
            return playdl.deezer(dzurl(id)) as Promise<DeezerTrack>
        }
        case "sp": {
            return playdl.spotify(spurl(id)) as Promise<SpotifyTrack>
        }
        case "so": {
            return playdl.soundcloud(sourl(id)) as Promise<SoundCloudTrack>
        }
        case "yt": {
            return (
                converter.convertToYoutubeVideos(yturl(id)).then(r => r[0] as YouTubeVideo)
            )
        }
    }
}

export async function newAudioResource(track: string | URL | YouTubeVideo | SpotifyTrack | SoundCloudTrack | DeezerTrack) {
    let src: string | undefined;

    if(track instanceof YouTubeVideo) {
        src = track.url
    }else if(track instanceof SoundCloudTrack) {
        src = track.url
    }else if(track instanceof URL || typeof track === "string") {
        src = track.toString()
    }else {
        const yt_track = await converter.convertToYoutubeVideos(track).then(r => r[0])
        if(!(yt_track instanceof YouTubeVideo)) return
        src = yt_track.url
    }

    if(!src) return
    const stream = await playdl.stream(src, { discordPlayerCompatibility: true })
    return createAudioResource(stream.stream, {
        inputType: stream.type,
        silencePaddingFrames: 0,
        inlineVolume: true
    })
}

export async function getInfosEmbed(video: YouTubeVideo) {
    const imageUrl = video.thumbnails.at(-1)?.url || null
    const color = imageUrl ? hex_to_int((await getAverageColor(imageUrl)).hex) : null
    return new EmbedBuilder()
        .setTitle(video.title || null)
        .setImage(imageUrl)
        .setAuthor({
            name: video.channel?.name || "unknown channel",
            iconURL: video.channel?.icons?.at(-1)?.url,
            url: video.channel?.url
        })
        .setColor(color)
        .setURL(video.url)
    ;
}
