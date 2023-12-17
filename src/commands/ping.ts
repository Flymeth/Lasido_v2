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
                    description: `${this.lasido.user?.toString()} version \`${this.lasido.package.version}\` by [Flymeth](https://flymeth.net)`,
                    color: hex_to_int(this.lasido.settings.colors.primary),
                    author: {
                        name: "Repository",
                        url: "https://github.com/Flymeth/Lasido_v2"
                    },
                    fields: [
                        {name: "Latence", value: `\`${this.lasido.ws.ping}ms\``, inline: true},
                        {name: "Uptime", value: `\`${getTime(process.uptime() * 1000).toString()}\``, inline: true}
                    ],
                })
            ]
        })
        return true
    }
}