import { ChatInputCommandInteraction, CacheType, EmbedBuilder } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";
import { fromQueueType, getInfosEmbed, getVideoInfos } from "../../utils/music/tracks";
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
        const ressource = platines.currentRessource
        if(!ressource) return

        await interaction.deferReply()

        const video_details = await fromQueueType(track).then(v => converter.convertToYoutubeVideos(v)).then(r => r[0])
        if(!(video_details instanceof YouTubeVideo)) return interaction.editReply({content: "Oups... An error has come."})
        
        const author = await this.lasido.users.fetch(track.author)
        const { playbackDuration } = ressource
        const videoDuration = video_details.durationInSec * 1000

        const currentTimeChar = " 🪩 "
        let progressbar = progress.splitBar(videoDuration, playbackDuration, 13, "➖", currentTimeChar)[0]
        if(!progressbar.includes(currentTimeChar)) progressbar = currentTimeChar + progressbar.slice(1)
        const embed = (await getInfosEmbed(video_details))
        .addFields(
            {name: "👻 Author", value: author.toString()},
            {name: "⏲️ Time", value: `**${getTime(playbackDuration).toString()}** ` +  progressbar + ` *${getTime(videoDuration).toString()}*`},
        )

        interaction.editReply({
            content: "",
            embeds: [embed]
        })
    }
}