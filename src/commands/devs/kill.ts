import { ActivityType, ApplicationCommandType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../../_main";
import BotCommand from "../../types/CommandClass";
import owners from "../../utils/owners";
import { destroyVoice, getAllVoices } from "../../utils/music/voice";
import BotSubCommand from "../../types/SubCommandClass";

export default class DevsKillCommand extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "kill",
            description: "Kill the robot",
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {
        if(!owners.includes(interaction.user.id)) return interaction.reply({
            content: "You do not have the permission to do that.",
            ephemeral: true
        })
        await interaction.reply({
            content: "The request has been saved. I should kill myself in a few seconds.",
            ephemeral: true
        })

        console.log(`@${interaction.user.username} just killed me.`);
        getAllVoices().forEach(v => {
            destroyVoice(v.guild)
            console.log(`Destroyed voice from guild "${v.guild.name}"`);
        })
        
        this.lasido.destroy()
        console.log("I'm now fully killed.");
        process.kill(0)
    }
}