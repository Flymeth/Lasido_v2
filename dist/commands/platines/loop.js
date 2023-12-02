"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const settings_1 = require("../../utils/music/settings");
const platines_1 = require("../../utils/music/platines");
class PlatinesLoop extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "loop",
            description: "Set the loop type",
            options: [
                {
                    name: "set",
                    description: "Set the loop type",
                    required: true,
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    choices: [
                        { name: "Activate queue loop", value: "queue" },
                        { name: "Activate song loop", value: "song" },
                        { name: "Desactivate loop", value: "disable" }
                    ]
                }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const loopType = interaction.options.getString("set");
        switch (loopType) {
            case "song":
            case "queue": {
                (0, settings_1.setLoop)(interaction.guild, { activate: true, type: loopType }, (0, platines_1.getPlatines)(this.lasido, interaction.guild));
                break;
            }
            case "disable": {
                (0, settings_1.setLoop)(interaction.guild, { activate: false }, (0, platines_1.getPlatines)(this.lasido, interaction.guild));
                break;
            }
            default:
                return interaction.reply({
                    content: "Oups... An error append.",
                    ephemeral: true
                });
        }
        return interaction.reply({
            content: "Done!"
        });
    }
}
exports.default = PlatinesLoop;
