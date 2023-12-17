import playdl, { Deezer, DeezerAlbum, DeezerPlaylist, DeezerTrack, SoundCloud, SoundCloudPlaylist, SoundCloudTrack, Spotify, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack, YouTube, YouTubeChannel, YouTubePlayList, YouTubeVideo } from "play-dl"
import { getPool } from "../db"

export type service_id= "so" | "yt" | "sp" | "dz"
export function getID(url: URL | string) {
    if(typeof url === "string") url = new URL(url)
    if(playdl.yt_validate(url.toString())) return url.searchParams.get("v")
    return /\/([^/]+)$/.exec(url.pathname)?.[1] || null
}
export function getBDDKey(track: SpotifyTrack | DeezerTrack | SoundCloudTrack | YouTubeVideo) {
    const service: service_id = (
        track instanceof SpotifyTrack ? "sp" :
        track instanceof DeezerTrack ? "dz" :
        track instanceof SoundCloudTrack ? "so" : "yt"
    )
    return { service, id: getID(track.url) }
}
export function getYoutubeQuery(track: SpotifyTrack | DeezerTrack | SoundCloudTrack): string {
    const title = "title" in track ? track.title : track.name
    const artist= (
        "artist" in track ? track.artist.name :
        "artists" in track ? track.artists[0].name : track.user.name
    )

    return `Music ${title} by ${artist}`
}

/**
 * Convert a link or platform's track into a youtube video(s)
 * THIS FUNCTION DOES NOT HANDLE SEARCHING!
 */
export async function convertToYoutubeVideos(...tracks: (
    SoundCloud
    | Spotify
    | Deezer
    | YouTubePlayList | YouTubeVideo
    | URL | string
)[]): Promise<(
    YouTubeVideo | {
        source: DeezerAlbum | DeezerPlaylist | SpotifyAlbum | SpotifyPlaylist | SoundCloudPlaylist | YouTubePlayList, 
        videos: YouTubeVideo[]
    }
)[]> {
    const dbPool = await getPool()
    
    const result = await Promise.all(tracks.map(async (track, init_index) => {
        if(typeof track === "string" || track instanceof URL) {
            const query = track.toString()
            const source = await playdl.validate(query)
            if(!source) throw new Error(`The track with query [${query}] cannot be processed...`);
            if(source === "search") throw new Error("This function cannot handle the search method...");

            if(source.startsWith("yt")) {
                if(source === "yt_video") {
                    const video_ID = getID(query)
                    const knownVideo = await dbPool.query<{INFOS: string}>(
                        "SELECT INFOS FROM cache WHERE ID = ?", [video_ID]
                    ).catch(() => null)

                    if(knownVideo?.INFOS) return { init_index, data: new YouTubeVideo(knownVideo.INFOS) }
                    else {
                        const videoDetails = await playdl.video_basic_info(query).then(r => r.video_details)
                        saveToDB(videoDetails)
                        return { init_index, data: videoDetails }
                    }
                }else {
                    const playlist = await playdl.playlist_info(query)
                    const videos = await playlist.all_videos()
                    return { init_index, data: {
                        source: playlist,
                        videos: await convertToYoutubeVideos(...videos).then(result => result.filter((r): r is YouTubeVideo => r instanceof YouTubeVideo))
                    } }
                }
            }else {
                const answer = await (
                    source.startsWith("dz") ? playdl.deezer :
                    source.startsWith("so") ? playdl.soundcloud : playdl.spotify
                )(query)

                if( answer instanceof DeezerTrack
                    || answer instanceof SpotifyTrack
                    || answer instanceof SoundCloudTrack
                ) {
                    const video = await convertToYoutubeVideos(answer).then(r => r[0])
                    return { init_index, data: video }
                }else {
                    const tracks = await answer.all_tracks()
                    const videos = await convertToYoutubeVideos(...tracks)
                    return { init_index, data: {
                        source: answer,
                        videos: videos.filter((r): r is YouTubeVideo => r instanceof YouTubeVideo)
                    } }
                }
            }
        } else if(track instanceof YouTubeVideo) {
            saveToDB(track)
            return { init_index, data: track }
        } else if(
            track instanceof SpotifyAlbum
            || track instanceof SpotifyPlaylist
            || track instanceof DeezerAlbum
            || track instanceof DeezerPlaylist
            || track instanceof SoundCloudPlaylist
            || track instanceof YouTubePlayList
        ) {
            const tracks = await ("all_tracks" in track ? track.all_tracks : track.all_videos)()
            const videos = await convertToYoutubeVideos(...tracks)
            return { init_index, data: {
                source: track,
                videos: videos.filter((r): r is YouTubeVideo => r instanceof YouTubeVideo)
            } }
        } else {
            const { id, service } = getBDDKey(track)
            const saved = await dbPool.query<{
                YT_ID: string,
                DATA?: object
            }>(
                "SELECT YT_ID, DATA FROM converter WHERE ID = ? AND service = ? "
                + "JOIN cache ON converter.YT_ID = cache.ID",
                [id, service]
            ).catch(() => null)

            if(saved?.DATA) {
                return { init_index, data: new YouTubeVideo(saved.DATA) }
            }else {
                const query = getYoutubeQuery(track)
                const video = await playdl.search(query, { source: { youtube: "video" }, limit: 1 }).then(r => r[0])
                saveToDB(video, track)
                return { init_index, data: video }
            }
        }
    }))

    return result.sort((a, b) => b.init_index - a.init_index).map(({ data }) => data)
}
export function individualyConvertToYoutubeVideos(...tracks: (
    SoundCloud
    | Spotify
    | Deezer
    | YouTubePlayList | YouTubeVideo
    | URL | string
)[]) {
    return tracks.map(item => {
        return () => convertToYoutubeVideos(item).then(v => v[0])
    })
}

async function saveToDB(youtubeVideo: YouTubeVideo, source?: SpotifyTrack | DeezerTrack | SoundCloudTrack | YouTubeVideo) {
    const dbPool = await getPool()
    const data = JSON.stringify(youtubeVideo.toJSON())
    await dbPool.query(
        `INSERT INTO cache VALUES (?, ?) ON DUPLICATE KEY UPDATE \`INFOS\` = ?`, [youtubeVideo.id, data, data]
    )
    if(source) {
        const { id, service } = getBDDKey(source)
        await dbPool.query(
            `INSERT INTO converter (ID, SERVICE, YT_ID) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE \`YT_ID\` = ?`, [id, service, youtubeVideo.id, youtubeVideo.id]
        )
    }
}
