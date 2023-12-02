import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getSettings, updateSettings } from "../../utils/settings";
import { setShuffle } from "../../utils/music/settings";
import { getPlatines } from "../../utils/music/platines";

export default class PlatineShuffle extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "shuffle",
            description: "Turn on/off shuffle or just shuffle the queue.",
            options: [
                {
                    name: "one-time", description: "Turn on this option to shuffle the queue instead of (des)activate taking a random track each time.", type: ApplicationCommandOptionType.Boolean,
                }
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const justShuffleQueue = interaction.options.getBoolean("one-time")
        const platines = getPlatines(this.lasido, interaction.guild)

        if(justShuffleQueue) {
            setShuffle(interaction.guild, "one-time", !!platines, platines)
            return interaction.reply({
                content: "The queue has been shuffled!"
            })
        }else {
            const { shuffle } = (await getSettings(interaction.guild)).music.options
            setShuffle(interaction.guild, shuffle ? "desactivate" : "activate", undefined, platines)
            return interaction.reply({
                content: `Shuffle mode has been turned \`${shuffle ? "off" : "on"}\`!`
            })
        }
    }
}