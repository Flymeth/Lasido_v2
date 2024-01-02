import { ChatInputCommandInteraction, CacheType, EmbedBuilder, Attachment, Embed } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";
import { fromQueueType, getInfosEmbed } from "../../utils/music/tracks";
import { hex_to_int } from "../../utils/colors";
import progress from "string-progressbar";
import getTime from "../../utils/time";
import * as converter from "../../utils/music/converter";
import { YouTubeVideo } from "play-dl";

export default class PlatineNowPlaying extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "current-nowplaying",
            description: "Get information about the current playing track"
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const platines = getPlatines(this.lasido, interaction.guild)
        if(!platines || platines.status !== "Playing") return interaction.reply({
            content: "I'm not playing anything yet."
        })
        const {queue, active_track} = (await platines.settings).music
        const track = queue[active_track]
        if(!track) return
        const ressourceData = platines.currentRessource
        if(!ressourceData) return
        await interaction.deferReply()

        const { ressource, source } = ressourceData

        let audioDuration: number | null;
        let baseEmbed: EmbedBuilder;
        switch (source) {
            case "file": {
                const file = ressource.metadata as Attachment
                if(typeof file.duration === "number") audioDuration = file.duration * 1000
                else audioDuration = null

                baseEmbed = new EmbedBuilder({
                    title: file.name,
                    url: file.url,

                    description: file.description || undefined,
                    color: hex_to_int(this.lasido.settings.colors.primary)
                })
                break;
            }
            case "streaming_provider": {
                const video_details = await fromQueueType(track).then(v => converter.convertToYoutubeVideos(v)).then(r => r[0])
                if(!(video_details instanceof YouTubeVideo)) return interaction.editReply({content: "Oups... An error has come."})
                
                audioDuration = video_details.durationInSec * 1000
                baseEmbed = await getInfosEmbed(video_details)
                break;
            }
            default: return interaction.editReply({
                content: "Sorry. An error has come. (audio ressource has an invalid source)."
            })
        }

        const currentTimeChar = " 🪩 "
        const { playbackDuration } = ressource
        let progressbar = ""
        if(typeof audioDuration === "number") {
            progressbar = progress.splitBar(audioDuration, playbackDuration, 13, "➖", currentTimeChar)[0]
            if(!progressbar.includes(currentTimeChar)) progressbar = currentTimeChar + progressbar.slice(1)
        }

        const author = await this.lasido.users.fetch(track.author)

        baseEmbed.addFields(
            {name: "👻 Author", value: author.toString()},
            {name: "⏲️ Time", value: `**${getTime(playbackDuration).toString()}** ` +  audioDuration ? (progressbar + ` *${getTime(audioDuration).toString()}*`) : ""},
        )

        interaction.editReply({
            content: "",
            embeds: [baseEmbed]
        })
    }
}