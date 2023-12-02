import playdl, {YouTubeVideo, SpotifyTrack, SoundCloudTrack, DeezerTrack, video_basic_info, yt_validate} from "play-dl"
import { createAudioResource } from "@discordjs/voice"
import { EmbedBuilder } from "discord.js"
import { getAverageColor } from "fast-average-color-node";
import { hex_to_int } from "../colors";
import { queueItem } from "../../../database/schema/guildSettings";
import { getPool } from "../db";

const youtube_converted_cache = new Map<string, YouTubeVideo>()

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

export function ytid(url: URL | string) {
    if(typeof url === "string") url = new URL(url)
    return url.searchParams.get("v")
}
export function spid(url: URL | string) {
    if(typeof url === "string") url = new URL(url)
    return /\/([^/]+)$/.exec(url.pathname)?.[1] || null
}
export const dzid = spid
export const soid = spid

export async function toQueueType(track: string | URL | DeezerTrack | YouTubeVideo | SpotifyTrack | SoundCloudTrack): Promise<Omit<queueItem, "author"> | null> {

    if(track instanceof YouTubeVideo) {
        const id = ytid(track.url)
        if(!id) return null
        return { id, src: "yt" }
    } else if(track instanceof DeezerTrack) {
        const id = dzid(track.url)
        if(!id) return null
        return { id, src: "dz" }
    } else if(track instanceof SpotifyTrack) {
        const id = spid(track.url)
        if(!id) return null
        return { id, src: "sp" }
    } else if(track instanceof SoundCloudTrack) {
        const id = soid(track.url)
        if(!id) return null
        return { id, src: "so" }
    } else {
        if(typeof track !== "string") track = track.toString()
        const validator = await playdl.validate(track)
        if(
            !validator 
            || validator === "search"
            || validator.endsWith("album")
            || validator.endsWith("playlist")
        ) return null
        const type = validator.slice(0, 2)
        switch(type) {
            case "yt": {
                const id = ytid(track)
                if(!id) return null
                return { id, src: "yt" }
            }
            case "so": {
                const id = soid(track)
                if(!id) return null
                return { id, src: "so" }
            }
            case "dz": {
                const id = dzid(track)
                if(!id) return null
                return { id, src: "dz" }
            }
            case "sp": {
                const id = spid(track)
                if(!id) return null
                return { id, src: "sp" }
            }
        }
    }

    return null
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
            return getVideoInfos(yturl(id))
        }
    }
}

export async function convertToYoutube(track: YouTubeVideo | SpotifyTrack | DeezerTrack | SoundCloudTrack) {
    if(track instanceof YouTubeVideo) return track
    const cached = youtube_converted_cache.get(track.url)
    if(cached) return cached

    const fromDB = await getFromDB(track)
    if(fromDB) {
        youtube_converted_cache.set(track.url, fromDB)
        return fromDB
    }

    const title = "title" in track ? track.title : track.name
    const artist= (
        "artist" in track ? track.artist.name :
        "artists" in track ? track.artists[0].name : track.user.name
    )
    
    const found = await playdl.search(`music ${title} by ${artist}`, {source: {youtube: "video"}, limit: 1})
    if(found.length) {
        youtube_converted_cache.set(track.url, found[0])
        return found[0]
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
        const yt_track = await convertToYoutube(track)
        if(!yt_track) return
        src = yt_track.url
    }

    if(!src) return
    const stream = await playdl.stream(src, { discordPlayerCompatibility: true })
    return createAudioResource(stream.stream, {
        inputType: stream.type,
        silencePaddingFrames: 0
    })
}

export async function getVideoInfos(url: string | URL) {
    if(typeof url !== "string") url= url.toString()
    const cached = youtube_converted_cache.get(url)
    if(cached) return cached

    if(yt_validate(url) !== "video") throw new Error("Invalid video URL")
    const { video_details } = await video_basic_info(url)
    youtube_converted_cache.set(url, video_details)
    return video_details
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

export async function getFromDB(track: YouTubeVideo | SpotifyTrack | SoundCloudTrack | DeezerTrack): Promise<YouTubeVideo | undefined> {
    if(track instanceof YouTubeVideo) return track

    let id: string,service: queueItem["src"];
    if(track instanceof SpotifyTrack) {
        service = "sp"
        id = track.id
    }else if(track instanceof SoundCloudTrack) {
        service = "so"
        id = track.id.toString()
    }else {
        service = "dz"
        id = track.id.toString()
    }
    const result = await getPool().then(async (db)=> {
        const answer = await db.query(`SELECT DATA FROM cache WHERE ID = ? AND SERVICE = ?`, [id, service]) as ReturnType<YouTubeVideo["toJSON"]> | undefined
        if(answer) return new YouTubeVideo(answer)
        else return answer
    })
    return result
}

export async function setToDB(from: SpotifyTrack | SoundCloudTrack | DeezerTrack, info: YouTubeVideo) {
    let id: string,service: queueItem["src"];
    if(from instanceof SpotifyTrack) {
        service = "sp"
        id = from.id
    }else if(from instanceof SoundCloudTrack) {
        service = "so"
        id = from.id.toString()
    }else {
        service = "dz"
        id = from.id.toString()
    }

    getPool().then(db => db.query(`INSERT INTO cache VALUES (?,?,?)`, [id, service, JSON.stringify(info.toJSON())]))
}