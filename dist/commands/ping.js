"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = __importDefault(require("../types/CommandClass"));
const discord_js_1 = require("discord.js");
const colors_1 = require("../utils/colors");
class PingCommand extends CommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "ping",
            description: "Make a little call to the bot's API"
        });
    }
    async execute(interaction, ...args) {
        await interaction.reply({
            content: "",
            embeds: [
                new discord_js_1.EmbedBuilder({
                    title: "🏓 PONG!",
                    description: `Latence: \`${this.lasido.ws.ping}ms\``,
                    color: (0, colors_1.hex_to_int)(this.lasido.settings.colors.primary)
                })
            ]
        });
        return true;
    }
}
exports.default = PingCommand;
