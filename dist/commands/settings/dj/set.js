"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../../types/SubCommandClass"));
const settings_1 = require("../../../utils/music/settings");
class DJSet extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "set",
            description: "Set the dj and its behaviors",
            options: [
                {
                    name: "role",
                    description: "Set the DJ's role",
                    type: discord_js_1.ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const role = interaction.options.getRole("role", true);
        (0, settings_1.setDJ)(interaction.guild, {
            active: true,
            role: role.id
        });
        return interaction.reply({
            content: `Everyone with the role ${role.toString()} will now be considered as DJs.`
        });
    }
}
exports.default = DJSet;
