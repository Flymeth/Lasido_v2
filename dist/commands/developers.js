"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = require("../types/CommandClass");
const kill_1 = __importDefault(require("./devs/kill"));
const owners_1 = __importDefault(require("../utils/owners"));
class BotDevsCommands extends CommandClass_1.BotCommandGroup {
    sub_commands;
    constructor(lasido) {
        const sub_commands = [
            kill_1.default
        ].map(c => new c(lasido));
        super(lasido, {
            name: "devs",
            description: "Useful commands for the bot's developers",
        }, [
            kill_1.default
        ]);
        this.sub_commands = sub_commands;
    }
    async allowExecution(interaction, ...args) {
        if (!owners_1.default.includes(interaction.user.id)) {
            interaction.reply({
                content: "This command is not made for you!",
                ephemeral: true
            });
            return false;
        }
    }
}
exports.default = BotDevsCommands;
