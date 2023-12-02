import { ChatInputCommandInteraction, CacheType, ApplicationCommandOptionType } from "discord.js";
import { Lasido } from "../../../_main";
import BotSubCommand from "../../../types/SubCommandClass";
import { setDJ } from "../../../utils/music/settings";

export default class DJSet extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "set",
            description: "Set the dj and its behaviors",
            options: [
                {
                    name: "role",
                    description: "Set the DJ's role",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const role = interaction.options.getRole("role", true)
        setDJ(interaction.guild, {
            active: true,
            role: role.id
        })

        return interaction.reply({
            content: `Everyone with the role ${role.toString()} will now be considered as DJs.`
        })
    }
}