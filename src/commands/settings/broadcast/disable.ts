import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Lasido } from "../../../_main";
import BotSubCommand from "../../../types/SubCommandClass";
import { setBroadcast } from "../../../utils/music/settings";

export default class BroadcastDisable extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "disable",
            description: "Disable the DJ in your guild."
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        setBroadcast(interaction.guild, {active: false})

        return interaction.reply({
            content: "Broadcast messages are now disabled."
        })
    }
}