import playdl, { DeezerAlbum, DeezerPlaylist, SoundCloudPlaylist, SpotifyAlbum, SpotifyPlaylist } from "play-dl";

export async function getPlaylist(url: string | URL) {
    if(typeof url !== "string") url = url.toString()
    const type = await playdl.validate(url)

    switch(type) {
        case "dz_album":
        case "dz_playlist": {
            return playdl.deezer(url) as Promise<DeezerAlbum | DeezerPlaylist>
        }
        case "sp_album":
        case "sp_playlist": {
            return playdl.spotify(url) as Promise<SpotifyAlbum | SpotifyPlaylist>
        }
        case "so_playlist": {
            return playdl.soundcloud(url) as Promise<SoundCloudPlaylist>
        }
        case "yt_playlist": {
            return playdl.playlist_info(url)
        }
        default:
            return null
    }
}