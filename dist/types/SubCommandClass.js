"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotSubCommandType = void 0;
const discord_js_1 = require("discord.js");
class BotSubCommand {
    lasido;
    sub_command_informations;
    constructor(lasido, data) {
        this.lasido = lasido;
        this.sub_command_informations = {
            ...data,
            type: discord_js_1.ApplicationCommandOptionType.Subcommand
        };
    }
    async execute(interaction, ...args) { }
    async helper() { }
}
exports.default = BotSubCommand;
class BotSubCommandType extends BotSubCommand {
    constructor(lasido) { }
}
exports.BotSubCommandType = BotSubCommandType;
