import { Lasido } from "../_main";
import BotCommand from "../types/CommandClass";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, Embed, EmbedBuilder } from "discord.js"
import { hex_to_int } from "../utils/colors";
import { DeezerTrack, SoundCloudTrack, SpotifyTrack, YouTubeVideo, deezer, search, soundcloud, spotify, validate, video_info } from "play-dl";
import { getSearchQueryFrom } from "../utils/music/converter";
import { getAverageColor } from "fast-average-color-node";

export default class PingCommand extends BotCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "convert",
            description: "Convert a track from a streaming platform to another",
            options: [
                {name: "source", description: "The URL of the source track you want to convert.", type: ApplicationCommandOptionType.String, required: true},
                {
                    name: "target-plateform", description: "The streaming platform you want to convert the track to", type: ApplicationCommandOptionType.String,
                    choices: ["youtube", "soundcloud", "deezer", "spotify"].map(platform => ({
                        name: platform[0].toUpperCase() + platform.slice(1),
                        value: platform
                    })),
                    required: true
                }
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]) {
        const source = interaction.options.getString("source", true)
        const target = interaction.options.getString("target-plateform", true)

        await interaction.deferReply()

        const validator = await validate(source)
        if(!(
            validator
            && (validator.endsWith("video") || validator.endsWith("track"))
        )) return interaction.editReply({
            content: "Your input source must be an url pointing to a single track/video.",
        })

        const trackInformation = await (
            validator === "yt_video" ? video_info(source).then(i => i.video_details) :
            validator === "sp_track" ? spotify(source) :
            validator === "so_track" ? soundcloud(source) : deezer(source)
        ) as YouTubeVideo | SpotifyTrack | SoundCloudTrack | DeezerTrack
        const query = getSearchQueryFrom(trackInformation, target === "youtube")

        const result = await search(query, {
            source: {
                deezer: target === "deezer" && "track" || undefined,
                soundcloud: target === "soundcloud" && "tracks" || undefined,
                spotify: target === "spotify" && "track" || undefined,
                youtube: target === "youtube" && "video" || undefined
            }
        }).then(r => r[0]) as typeof trackInformation
        if(!result) return interaction.editReply({
            content: `Sorry: I failed at finding your track on ${target}.`,
        })

        const imageURL: string | undefined = (
            result instanceof YouTubeVideo ? result.thumbnails.at(-1)?.url :
            "thumbnail" in result ? (
                typeof result.thumbnail === "string" ? result.thumbnail : result.thumbnail?.url
            ) : undefined
        )
        const artist: Embed["author"] = (
            result instanceof YouTubeVideo ? {
                name: result.channel?.name as string,
                iconURL: result.channel?.icons?.at(-1)?.url,
                url: result.channel?.url
            } :
            "artist" in result ? {
                name: result.artist.name,
                iconURL: result.artist.picture?.medium,
                url: result.artist.url
            } :
            "artists" in result ? {
                name: result.artists.map(a => a.name).join(", "),
                url: result.artists[0].url
            } : {
                name: "Unknown artist"
            }
        )
        const embed = new EmbedBuilder()
            .setURL(result.url)
            .setTitle(
                ("title" in result || result instanceof YouTubeVideo ? result.title : result.name)
                || null
            )
            .setImage(imageURL || null)
            .setColor(imageURL ? hex_to_int((await getAverageColor(imageURL)).hex) : "Random")
            .setAuthor(artist)
            .setTimestamp()
            .setFields(
                {
                    name: "Source URL",
                    value: `**${source} **`
                },
                {
                    name: `Result (${target}'s link)`,
                    value: `**${result.url} **`
                }
            )
            .setFooter({
                text: "Please note that this command may have wrong results"
            })
        ;
        return await interaction.editReply({
            content: "",
            embeds: [embed]
        })
    }
}