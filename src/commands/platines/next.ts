import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";


export default class PlatinesNext extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "next",
            description: "Pass the music and get the next one",
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const platines = getPlatines(this.lasido, interaction.guild)
        if(!platines) return interaction.reply({
            content: "You must be connected to a voice channel to do that...",
            ephemeral: true
        })

        await interaction.deferReply()
        await platines.next()

        interaction.editReply({content: `Song nexted.`})
    }
}