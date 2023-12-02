"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotCommandType = exports.BotCommandGroup = void 0;
const discord_js_1 = require("discord.js");
class BotCommand {
    lasido;
    command_informations;
    guilded;
    mp;
    constructor(lasido, command, only_in_guild, allow_mp = false) {
        this.lasido = lasido;
        this.command_informations = command;
        this.guilded = only_in_guild;
        this.mp = allow_mp;
    }
    async execute(interaction, ...args) { }
}
exports.default = BotCommand;
class BotCommandGroup extends BotCommand {
    sub_commands;
    constructor(lasido, command, sub_commands, only_in_guild, allow_mp = false) {
        const subs = sub_commands.map(c => new c(lasido));
        super(lasido, {
            ...command,
            type: discord_js_1.ApplicationCommandType.ChatInput,
            options: subs.map(c => ({
                ...c.sub_command_informations,
                type: discord_js_1.ApplicationCommandOptionType.Subcommand
            }))
        }, only_in_guild, allow_mp);
        this.sub_commands = subs;
    }
    async allowExecution(interaction, ...args) { return true; }
    async execute(interaction, ...args) {
        const executedAllowed = await this.allowExecution(interaction, ...args);
        if (executedAllowed === false)
            return;
        const sub = interaction.options.getSubcommand(true);
        const command = this.sub_commands.find(cmd => cmd.sub_command_informations.name === sub);
        if (!command)
            return interaction.reply({
                content: "This sub command has not been found.",
                ephemeral: true
            });
        return command.execute(interaction, ...args);
    }
}
exports.BotCommandGroup = BotCommandGroup;
class BotCommandType extends BotCommand {
    constructor(lasido) { }
}
exports.BotCommandType = BotCommandType;
