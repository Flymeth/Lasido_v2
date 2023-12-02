import { ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputCommandInteraction, EmbedBuilder, italic } from "discord.js";
import { Lasido } from "../_main";
import BotCommand from "../types/CommandClass";
import playdl, { DeezerAlbum, DeezerPlaylist, DeezerTrack, SoundCloudPlaylist, SoundCloudTrack, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack, YouTubeChannel, YouTubePlayList, YouTubeVideo } from "play-dl";
import { hex_to_int } from "../utils/colors";
import getTime from "../utils/time";

export default class BotSearch extends BotCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "search",
            description: "Search for a song on different platforms",
            type: ApplicationCommandType.ChatInput,
            options: [{
                name: "query",
                description: "Type here what you want to search",
                type: ApplicationCommandOptionType.String,
                required: true
            }, {
                type: ApplicationCommandOptionType.String,
                name: "platform",
                description: "The platform from where you want to searcn (default to all of them)",
                choices: [
                    {name: "Youtube", value: "ytb"},
                    {name: "Deezer", value: "dzr"},
                    {name: "SoundCloud", value: "scd"},
                    {name: "Spotify", value: "sty"}
                ]
            }, {
                type: ApplicationCommandOptionType.String,
                name: "type",
                description: "The type of result you want",
                choices: [
                    {name: "Videos/Tracks (default)", value: "tracks"},
                    {name: "Playlists", value: "playlists"},
                    {name: "Albums/Channels", value: "albums"}
                ]
            }]
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        const query = interaction.options.getString("query", true)
        const platform = interaction.options.getString("platform")
        const type = (interaction.options.getString("type") || "tracks") as "tracks" | "playlists" | "albums"
        
        const source: {[key: string]: 
            "tracks" 
            | "track" 
            | "video" 
            | "playlist" 
            | "playlists" 
            | "channel" 
            | "album" 
            | "albums"
            | undefined
        } = {}

        const ytType = (
            type === "tracks" ? "video" :
            type === "albums" ? "channel" :
            type === "playlists" ? "playlist" : undefined
        )
        const dzType = (
            type === "tracks" ? "track" :
            type === "albums" ? "album" :
            type === "playlists" ? "playlist" : undefined
        )
        const soType = (
            type === "tracks" ? "tracks" :
            type === "albums" ? "albums" :
            type === "playlists" ? "playlists" : undefined
        )
        const spType = (
            type === "tracks" ? "track" :
            type === "albums" ? "album" :
            type === "playlists" ? "playlist" : undefined
        )

        switch (platform) {
            case "ytb":
                source.youtube = ytType
                break;
            case "dzr":
                source.deezer = dzType
                break;
            case "scd":
                source.soundcloud= soType
                break;
            case "sty":
                source.spotify= spType
                break;
            default: 
                source.spotify = spType
                source.youtube = ytType
                source.soundcloud= soType
                source.deezer = dzType
        }

        const result = await playdl.search(query, { source, limit: 10 }) as (
            YouTubeVideo
            | SoundCloudTrack
            | DeezerTrack
            | SpotifyTrack
            | YouTubeChannel
            | YouTubePlayList
            | SpotifyAlbum
            | SpotifyPlaylist
            | DeezerAlbum
            | DeezerPlaylist
            | SoundCloudPlaylist
        )[]
        if(!result.length) return interaction.reply({
            content: "I've not found anything with this query.",
            ephemeral: true
        })

        const stringPlatform = (
            platform === "ytb" ? "YouTube" :
            platform === "dzr" ? "Deezer" :
            platform === "sty" ? "Spotify" :
            platform === "scd" ? "SoundCloud" : undefined
        )
        const searchEmbed = new EmbedBuilder()
            .setColor(hex_to_int(this.lasido.settings.colors.primary))
            .setTitle(`Result for ${type} in ${stringPlatform || "internet"} with query:`)
            .setDescription(italic(query))
            .setFooter({
                text: "Pro TIP: If you want a result to be in your queue, just copy the song's URL and paste it in the [/play]'s query option."
            })
            .setFields(result.map((value, index) => {
                const title = (
                    "name" in value ? value.name :
                    "title" in value ? value.title : undefined
                ) || `[RESULT #${index}]`
                const emoji = (
                    value.type === "playlist" || value.type === "album" ? "📁" :
                    value.type === "channel" || value.type === "user" ? "👽" : "📀"
                )
                
                const length = (
                    "durationInSec" in value ? getTime((value.durationInSec || 0) * 1000).toString() : 
                    "tracksCount" in value ? value.tracksCount :
                    "videoCount" in value ? value.videoCount : 0
                )
                
                const author = (
                    "channel" in value ? value.channel?.name :
                    ("artist" in value) && typeof value.artist !== "boolean" ? value.artist?.name :
                    "artists" in  value ? value.artists[0].name : undefined
                ) || `[ARTIST FOR RESULT #${index}]`

                return {
                    name: `${emoji} - ${title}`, 
                    value: `👻 Artist: **${author}**\n[Source](${value.url})\n${
                        typeof length === "string" ? `Duration: **${length}**` : `Size: \`${length}\``
                    }`, 
                    inline: true
                }
            }))

        interaction.reply({
            content: "",
            embeds: [searchEmbed]
        })
    }
}