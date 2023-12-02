import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Lasido } from "../_main";
import BotCommand from "../types/CommandClass";
import { getPlatines } from "../utils/music/platines";
import { fromQueueType } from "../utils/music/tracks";
import { hex_to_int } from "../utils/colors";
import * as genious from "genius-lyrics";
const client = new genious.Client()

export default class BotLyrics extends BotCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "lyrics",
            description: "Get the lyrics of a song",
            options: [
                {
                    name: "search",
                    description: "Search for a song to get lyrics (if not set, it will take the current playing song)",
                    type: ApplicationCommandOptionType.String
                }
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        let search = interaction.options.getString("search")
        if(!search) {
            const platines = getPlatines(this.lasido, interaction.guild)
            if(platines?.status !== "Playing") return interaction.reply({
                content: "Please use this command during a song is playing or directly search a song with the 'search' option.",
                ephemeral: true
            })
            const { queue, active_track } = (await platines.settings).music
            const track_details = await fromQueueType(queue[active_track])

            search = `${"name" in track_details ? track_details.name : track_details.title}`
        }
        interaction.deferReply()

        const geniusSong = await client.songs.search(search).then(songs => songs[0])
        
        const lyrics = await geniusSong.lyrics()
        if(!lyrics) return interaction.editReply({
            content: "Sorry: I didn't find this song..."
        })

        const lyricsPartition: string[] = []
        const MAX_EMBED_DESCRIPTION_SIZE = 4090 // I know it's 4096 but your mf
        while(MAX_EMBED_DESCRIPTION_SIZE * lyricsPartition.length < lyrics.length) {
            const boundaries = [MAX_EMBED_DESCRIPTION_SIZE * lyricsPartition.length, MAX_EMBED_DESCRIPTION_SIZE * (lyricsPartition.length + 1)]
            lyricsPartition.push(
                lyricsPartition.length ? "...\n" : ""
                + lyrics.slice(...boundaries)
                + (boundaries[1] <= lyrics.length ? "\n..." : "")
            )
        }

        const embeds = lyricsPartition.map(content => (
            new EmbedBuilder()
            .setColor(hex_to_int(this.lasido.settings.colors.primary))
            .setDescription(content)
        ))
        embeds[0].setAuthor({
            name: `${geniusSong.title} by ${geniusSong.artist.name}`,
            url: geniusSong.url,
            iconURL: geniusSong.artist.image
        })
        .setImage(geniusSong.image)
        
        return interaction.editReply({
            content: "",
            embeds
        })
    }
}