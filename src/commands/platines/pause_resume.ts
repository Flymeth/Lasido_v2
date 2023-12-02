import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";
import { createVoice, getMemberVoiceChannel, getVoice } from "../../utils/music/voice";
import { getSettings } from "../../utils/settings";
import { hex_to_int } from "../../utils/colors";


export default class PlatinesPauseResume extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "pause-resume",
            description: "Pause the music or resume it",
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {
        if(!interaction.guild) return

        if(!(await getSettings(interaction.guild)).music.queue.length) return interaction.reply({
            content: "Cannot play/pause because the player is empty.",
            ephemeral: true
        })

        if(!getVoice(interaction.guild)) {
            const c = getMemberVoiceChannel(interaction.member as GuildMember)
            if(!c) return interaction.reply({
                content: "Please connect to a voice channel to do that command.",
                ephemeral: true
            })
            createVoice(c)
        }
        const platines = getPlatines(this.lasido, interaction.guild)
        if(!platines) return interaction.reply({
            content: "An error has come...",
            ephemeral: true
        })

        await interaction.deferReply()

        const wasPlaying = platines.status === "Playing"
        if(wasPlaying) platines.pause()
        else await platines.resume()

        const embed = new EmbedBuilder()
            .setTitle("Player's state has changed!")
            .setColor(hex_to_int(wasPlaying ? this.lasido.settings.colors.negative : this.lasido.settings.colors.positive))
            .setDescription(`You have ${wasPlaying ? "paused" : "resumed"} the player!`)
        interaction.editReply({
            content: "",
            embeds: [embed]
        })
    }
}