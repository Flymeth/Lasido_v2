import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";

export default class PlatinesJump extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "jump",
            description: "Jump to a certain track",
            options: [
                {name: "track-id", description: "The track index you want to be played", required: true, type: ApplicationCommandOptionType.Integer}
            ]
        })
    }
    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const platines = getPlatines(this.lasido, interaction.guild)
        if(!platines) return interaction.reply({
            content: "I must be connected to a voice channel to perform that command.",
            ephemeral: true
        })
        const index = interaction.options.getInteger("track-id", true) -1
        const done = await platines.skipTo(index)

        if(done) interaction.reply({
            content: "Done!"
        })
        else interaction.reply({
            content: "Oups... Cannot jump to that track..."
        })
    }
}