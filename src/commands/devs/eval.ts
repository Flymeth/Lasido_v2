import { ActivityType, ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputCommandInteraction, codeBlock, EmbedBuilder } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import {inspect} from "util";
import { splitByLength } from "../../utils/textSplit";
import { hex_to_int } from "../../utils/colors";

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
            if(typeof answer === "object") result = inspect(answer, {
                compact: 2,
                depth: 1,
                getters: true,
                sorted: true,
            })
            else result = "" + answer
        } catch (error: any) {
            result = "<ERROR> " + error
        }

        const MAX_EMBED_DESCRIPTION_SIZE = 4080 // I know it's 4096 but your mf
        const resultPartitions = splitByLength(result, MAX_EMBED_DESCRIPTION_SIZE, /\r?\n/)
        
        const embeds = resultPartitions.map(description => 
            new EmbedBuilder()
            .setDescription(codeBlock("js", description))
            .setColor(hex_to_int(
                this.lasido.settings.colors.primary
            ))
            .setFooter({
                text: `Input: '${code}'`
            })
        )

        await interaction.editReply({
            content: "",
            embeds
        })
    }
}