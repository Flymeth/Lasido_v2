import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Lasido } from "../_main";
import BotCommand from "../types/CommandClass";
import { getPlatines } from "../utils/music/platines";
import { fromQueueType } from "../utils/music/tracks";
import { hex_to_int } from "../utils/colors";
import * as genious from "genius-lyrics";
import { getSearchQueryFrom } from "../utils/music/converter";
import { splitByLength } from "../utils/textSplit";
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
        const byQuery = !!search
        if(!search) {
            const platines = getPlatines(this.lasido, interaction.guild)
            if(platines?.status !== "Playing") return interaction.reply({
                content: "Please use this command during a song is playing or directly search a song with the 'search' option.",
                ephemeral: true
            })
            const { queue, active_track } = (await platines.settings).music
            const track_details = await fromQueueType(queue[active_track])

            search = getSearchQueryFrom(track_details, false)
        }
        await interaction.deferReply()

        const geniusSong = await client.songs.search(search).then(songs => songs[0])
        if(!geniusSong) return interaction.editReply({
            content: 
                "Sorry: I didn't found this song."
                + (byQuery ? "\n> Maybe try with the 'search' argument ?" : "")
        })
        
        const lyrics = await geniusSong.lyrics()
        if(!lyrics) return interaction.editReply({
            content: "Sorry: This song seams to have no lyrics..."
        })

        const MAX_EMBED_DESCRIPTION_SIZE = 4090 // I know it's 4096 but your mf
        const lyricsPartition = splitByLength(lyrics, MAX_EMBED_DESCRIPTION_SIZE, /\r?\n/)

        const embeds = lyricsPartition.map((content, index) => (
            new EmbedBuilder()
            .setColor(hex_to_int(this.lasido.settings.colors.primary))
            .setDescription(content)
            .setFooter({
                text: `Embed ${index + 1} of ${lyricsPartition.length} - Lyrics given by Genius`
            })
        ))
        embeds[0].setAuthor({
            name: `${geniusSong.title} by ${geniusSong.artist.name}`,
            url: geniusSong.url,
            iconURL: geniusSong.artist.image
        })
        embeds.at(-1)?.setImage(geniusSong.image)
        
        return interaction.editReply({
            content: "Voici les paroles demandées",
        }).then(i => embeds.forEach(e => interaction.followUp({
            content: "",
            embeds: [e]
        })))
    }
}