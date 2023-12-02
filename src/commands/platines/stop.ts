import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";

export default class PlatinesStop extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "stop",
            description: "Stops the player and disconnect the bot.",
            options: [
                {name: "keep-queue", description: "If you don't want to delete the queue (default to False).", type: ApplicationCommandOptionType.Boolean}
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const platines = getPlatines(this.lasido, interaction.guild)
        if(!platines) return interaction.reply({
            content: "I'm not in a voice channel, so the player is already stopped.",
            ephemeral: true
        })
        
        const keepQueue = interaction.options.getBoolean("keep-queue") === true
        if(!keepQueue) platines.updateSettings(s => {s.music.queue = []; s.music.active_track = -1})
        platines.destroy()
        
        return interaction.reply("The player just stopped!")
    }
}