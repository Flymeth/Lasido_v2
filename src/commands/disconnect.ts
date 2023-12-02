import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Lasido } from "../_main";
import BotCommand from "../types/CommandClass";
import { destroyVoice, getVoice } from "../utils/music/voice";

export default class Disconnect extends BotCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "disconnect",
            description: "Disconnect Lasido from your voice channel",
            dmPermission: false
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        if(!getVoice(interaction.guild)) return interaction.reply({
            content: "I'm not connected to any channel on this server."
        })

        destroyVoice(interaction.guild)
        return interaction.reply({
            content: "Done!"
        })
    }
}