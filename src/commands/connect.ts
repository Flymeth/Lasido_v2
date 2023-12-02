import { Lasido } from "../_main";
import BotCommand from "../types/CommandClass";
import { ChatInputCommandInteraction, EmbedBuilder, GuildMember } from "discord.js"
import { createVoice, getVoice } from "../utils/music/voice";
import { hex_to_int } from "../utils/colors";

export default class ConnectCommand extends BotCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "connect",
            description: "Makes the bot joins your current voice channel",
            dmPermission: false
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]) {
        await interaction.deferReply()
        if(!interaction.inGuild()) return
        if(interaction.guild && getVoice(interaction.guild)) return interaction.editReply({
            content: "I'm already in a voice channel"
        })
        const member = interaction.member as GuildMember
        const channel= member.voice.channel
        if(!channel) return interaction.editReply({
            content: "You must be connected to a guild's voice channel to do this command."
        })
        if(!channel.joinable) return interaction.editReply({
            content: "This channel is unreachable for me."
        })

        createVoice(channel)
        interaction.editReply({
            content: "",
            embeds: [
                new EmbedBuilder({
                    title: "🔊 I'm now connected!",
                    description: `${member} connects me to ${channel}.`,
                    color: hex_to_int(this.lasido.settings.colors.positive)
                })
            ]
        })
    }
}