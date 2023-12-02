import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { setLoop } from "../../utils/music/settings";
import { getPlatines } from "../../utils/music/platines";

export default class PlatinesLoop extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "loop",
            description: "Set the loop type",
            options: [
                {
                    name: "set",
                    description: "Set the loop type",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    choices: [
                        {name: "Activate queue loop", value: "queue"},
                        {name: "Activate song loop", value: "song"},
                        {name: "Desactivate loop", value: "disable"}
                    ]
                }
            ]
        })
    }
    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const loopType = interaction.options.getString("set")

        switch (loopType) {
            case "song":
            case "queue": {
                setLoop(interaction.guild, {activate: true, type: loopType}, getPlatines(this.lasido, interaction.guild))
                break;
            }
            case "disable": {
                setLoop(interaction.guild, {activate: false}, getPlatines(this.lasido, interaction.guild))
                break;
            }
            default:
                return interaction.reply({
                    content: "Oups... An error append.",
                    ephemeral: true
                })
        }

        return interaction.reply({
            content: "Done!"
        })
    }
}