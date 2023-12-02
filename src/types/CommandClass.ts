import { Lasido } from "../_main"
import {ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputApplicationCommandData, ChatInputCommandInteraction, MessageApplicationCommandData, UserApplicationCommandData} from "discord.js"
import { BotSubCommandType } from "./SubCommandClass"

export default class BotCommand<data_type = ChatInputApplicationCommandData | MessageApplicationCommandData | UserApplicationCommandData> {
    lasido: Lasido
    command_informations: data_type
    guilded?: string
    mp: boolean

    constructor(
        lasido: Lasido,
        command: data_type,
        only_in_guild?: string,
        allow_mp = false
    ) {
        this.lasido= lasido
        this.command_informations= command
        this.guilded= only_in_guild
        this.mp = allow_mp
    }
    
    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {}
}
export class BotCommandGroup extends BotCommand {
    sub_commands: BotSubCommandType[]

    constructor(
        lasido: Lasido,
        command: Omit<Omit<ChatInputApplicationCommandData, "type">, "options">,
        sub_commands: (typeof BotSubCommandType)[],
        only_in_guild?: string,
        allow_mp = false
    ) {
        const subs = sub_commands.map(c => new c(lasido))

        super(lasido, {
            ...command,
            type: ApplicationCommandType.ChatInput,
            options: subs.map(c => ({
                ...c.sub_command_informations,
                type: ApplicationCommandOptionType.Subcommand
            }))
            
        }, only_in_guild, allow_mp)
        this.sub_commands= subs
    }

    async allowExecution(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<boolean | undefined> {return true}
    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        const executedAllowed = await this.allowExecution(interaction, ...args)
        if(executedAllowed === false) return;
        const sub = interaction.options.getSubcommand(true)

        const command = this.sub_commands.find(cmd => cmd.sub_command_informations.name === sub)
        if(!command) return interaction.reply({
            content: "This sub command has not been found.",
            ephemeral: true
        })
        return command.execute(interaction, ...args)
    }
}

export class BotCommandType extends BotCommand {
    //@ts-ignore
    constructor(lasido: Lasido) {  }
}