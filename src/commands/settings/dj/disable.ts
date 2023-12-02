import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Lasido } from "../../../_main";
import BotSubCommand from "../../../types/SubCommandClass";
import { setDJ } from "../../../utils/music/settings";

export default class DJDisableSub extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "disable",
            description: "Disable the DJ in your guild."
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        setDJ(interaction.guild, {active: false})

        return interaction.reply({
            content: "DJ settings has been updated."
        })
    }
}