import { Lasido } from "../_main"
import {ApplicationCommandSubCommandData, ApplicationCommandOptionType} from "discord.js"
import {ChatInputCommandInteraction} from "discord.js"

export default class BotSubCommand {
    lasido: Lasido
    sub_command_informations: ApplicationCommandSubCommandData

    constructor(
        lasido: Lasido,
        data: Omit<ApplicationCommandSubCommandData, "type">
    ) {
        this.lasido= lasido
        this.sub_command_informations= {
            ...data,
            type: ApplicationCommandOptionType.Subcommand
        }
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {}
    async helper() {}
}

export class BotSubCommandType extends BotSubCommand {
    //@ts-ignore
    constructor(lasido: Lasido) {  }
}