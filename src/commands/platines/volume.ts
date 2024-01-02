import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";
import { setVolume } from "../../utils/music/settings";

export default class PlatinesVolume extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "volume",
            description: "Change the volume of the player",
            options: [
                {name: "value", description: "The new volume value in pourcents (must be between 1 and 200 included)", required: true, type: ApplicationCommandOptionType.Integer}
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
        if(platines.currentRessource?.source === "file") return interaction.reply({
            content: "Sorry, cannot change the current ressource's volume on the fly because it comes from a user's file.",
            ephemeral: true
        })

        const value = interaction.options.getInteger("value", true)
        if(value < 1 || value > 200) return interaction.reply({
            content: "The volume value must be between 1 and 200 included!",
            ephemeral: true
        })

        const gainValue = value / 200
        setVolume(interaction.guild, gainValue, platines)

        return interaction.reply({
            content: `The volume has been changed to \`${value}\`%.`
        })
    }
}