import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { createVoice, getVoice } from "../../utils/music/voice";
import { AudioPlayerStatus, createAudioResource } from "@discordjs/voice";
import { getPlatines } from "../../utils/music/platines";

export default class PlatinesPlayFile extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "play-file",
            description: "Play songs from an audio file (beta).",
            options: [
                {name: "file", description: "An audio file", type: ApplicationCommandOptionType.Attachment, required: true}
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {
        if(!interaction.guild) return

        if(!getVoice(interaction.guild)) {
            const member = interaction.member as GuildMember

            const channel= member.voice.channel
            if(!channel) return interaction.reply({
                content: "You must be connected to a guild's voice channel to do this command.",
                ephemeral: true
            })
            if(!channel.joinable) return interaction.reply({
                content: "This channel is unreachable for me.",
                ephemeral: true
            })

            createVoice(channel)
        }
        
        await interaction.deferReply({ephemeral: true})
        
        const file = interaction.options.getAttachment("file", true)
        if(!file.contentType?.startsWith("audio")) return interaction.editReply({
            content: "This file is not in a valid format. Please give to this command an audio file."
        })

        
        const ressource = createAudioResource(file.url, {
            metadata: { file },
        })
        const platines = getPlatines(this.lasido, interaction.guild)
        if(!platines) return
        if( platines.status === "Playing" 
            || platines.status === "Paused" 
            || platines.status === "Buffering"
        ) {
            await platines.broadcast(`Starting playing an audio file given by ${interaction.user.toString()}. The current playing track has been stopped.`, true)
            platines.player.removeAllListeners(AudioPlayerStatus.Idle)
            platines.player.stop(true)
        }

        await platines.play(ressource, "file")
        interaction.editReply({
            content: "Starting playing the file... If the player doesn't start, try to re-send the command. (Note that this feature is in beta)"
        })
    }
}