import { ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../_main";
import BotCommand, { BotCommandGroup } from "../types/CommandClass";
import BotSubCommand from "../types/SubCommandClass";
import DevsKillCommand from "./devs/kill";
import owners from "../utils/owners";

export default class BotDevsCommands extends BotCommandGroup {
    sub_commands: BotSubCommand[]

    constructor(lasido: Lasido) {
        const sub_commands = [
            DevsKillCommand
        ].map(c => new c(lasido))

        super(lasido, {
            name: "devs",
            description: "Useful commands for the bot's developers",
        }, [
            DevsKillCommand
        ])

        this.sub_commands = sub_commands
    }

    async allowExecution(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<boolean | undefined> {
        if(!owners.includes(interaction.user.id)) {
            interaction.reply({
                content: "This command is not made for you!",
                ephemeral: true
            })
            return false
        }
    }
}