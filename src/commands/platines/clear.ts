import { APIButtonComponent, ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonComponent, ButtonStyle, CacheType, ChatInputCommandInteraction, ComponentType, MessageActionRowComponent, MessageActionRowComponentBuilder } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";
import { getSettings, updateSettings } from "../../utils/settings";

export default class PlatinesClear extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "clear",
            description: "Clear the whole queue"
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const { music } = await getSettings(interaction.guild)

        const deleteWholeQueue = await interaction.reply({
            content: `❗ Do you want to delete the whole queue (\`${music.queue.length}\` tracks) ?`,
            components: [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder({
                    emoji: "✅",
                    style: ButtonStyle.Danger,
                    customId: "yes"
                }),
                new ButtonBuilder({
                    emoji: "❎",
                    style: ButtonStyle.Secondary,
                    customId: "no"
                })
            )]
        }).then(message => message.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 10000
        }).then(react => (react.component as ButtonComponent).customId === "yes").catch(() => false))
        .catch(() => undefined)

        await interaction.deleteReply().catch(() => undefined)
        if(deleteWholeQueue) {
            const platines = getPlatines(this.lasido, interaction.guild)
            if(platines) {
                if(platines.status === "Playing") platines.stop("Queue has been deleted.")
                platines.currentRessource = undefined
            }

            updateSettings(interaction.guild, (s) => (s.music.queue = [], s.music.active_track= -1))
            interaction.channel?.send({
                content: `${interaction.user.toString()} just deleted the queue!`
            })
        }

        return interaction.editReply({content: "done!", components: []})
    }
}