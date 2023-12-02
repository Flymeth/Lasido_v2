import { Lasido } from "../_main";
import BotCommand from "../types/CommandClass";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js"
import { hex_to_int } from "../utils/colors";
import getTime from "../utils/time";

export default class PingCommand extends BotCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "ping",
            description: "Make a little call to the bot's API"
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]) {
        await interaction.reply({
            content: "",
            embeds: [
                new EmbedBuilder({
                    title: "🏓 PONG!",
                    description: `Latence: \`${this.lasido.ws.ping}ms\`\nUptime: \`${getTime(process.uptime() * 1000).toString()}\``,
                    color: hex_to_int(this.lasido.settings.colors.primary)
                })
            ]
        })
        return true
    }
}