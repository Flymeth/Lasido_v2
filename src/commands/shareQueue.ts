import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction } from "discord.js"
import { Lasido } from "../_main"
import { getSettings, updateSettings } from "../utils/settings"
import BotCommand from "../types/CommandClass"

export default class ShareQueue extends BotCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "share-queue",
            description: "Share and import queue from other servers.",
            options: [
                {name: "import", description: "The import/server id of the guild you want to import from. (Leave blank to get your import id)", type: ApplicationCommandOptionType.String},
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const importID = interaction.options.getString("import")
        if(!importID) { // Display the sharing embed

            return interaction.reply({
                content: `Here is your sharing code: \`${interaction.guild.id}\`.\n> Note that I must be on both guild to share queues on each-others.`
            })

        }else { // Import the queue
            if(importID === interaction.guild.id) return interaction.reply({
                content: "Are you dumb ? Why the fuck would you import tracks from this server to THIS server ? Seriously I didn't coded this bot for that kind of stupid people...",
                ephemeral: true
            })

            await interaction.deferReply()
            const guild = await this.lasido.guilds.fetch(importID)
            if(!guild) return interaction.editReply({
                content: "Sorry, the import id is invalid (maybe because I'm not in the given discord server).",
            })

            const { music } = await getSettings(guild)
            if(!music.queue.length) return interaction.editReply({
                content: `The queue of \`${guild.name}\` is empty.`
            })
            const result = await updateSettings(interaction.guild, c => c.music.queue.push(...music.queue))

            return interaction.editReply({
                content: `Successfuly added \`${music.queue.length}\` track(s) from \`${guild.name}\` to this server.\n> This server has now \`${result.music.queue.length}\` track(s) in its queue.`
            })
        }
    }
}