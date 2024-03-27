import { ActivityType, ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";

export default class DevsEvalCommand extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "eval",
            description: "Evaluate an expretion directly from in the bot process",
            options: [
                {type: ApplicationCommandOptionType.String, name: "code", description: "The code Lasido needs to execute (must be javascript).", required: true}
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {
        await interaction.reply({
            content: "I'm currently executing the code...",
            ephemeral: true
        })
        const code = interaction.options.getString("code", true)
        let result: string;
        try {
            const answer = eval(code)
            if(typeof answer === "object") result = JSON.stringify(answer)
            else result = "" + answer
        } catch (error: any) {
            result = "" + error
        }

        await interaction.editReply({
            content: "```" + result.replaceAll("`", "\`") + "```"
        })
    }
}