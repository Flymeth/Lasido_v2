"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const settings_1 = require("../../../utils/music/settings");
const platines_1 = require("../../../utils/music/platines");
const SubCommandClass_1 = __importDefault(require("../../../types/SubCommandClass"));
const presets = [
    { name: "bassboost", eq: [
            { band: 0, gain: .75 },
            { band: 1, gain: .5 },
            { band: 2, gain: .25 }
        ] },
    { name: "midboost", eq: [
            { band: 3, gain: .25 },
            { band: 4, gain: .5 },
            { band: 5, gain: .25 }
        ] },
    { name: "highboost", eq: [
            { band: 6, gain: .75 },
            { band: 7, gain: .5 },
            { band: 8, gain: .25 }
        ] }
];
class EQPreset extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "preset",
            description: "Customize your server's sound by using presets (best option)",
            options: [
                {
                    name: "preset", description: "Choose the preset you want", required: true, type: discord_js_1.ApplicationCommandOptionType.Integer,
                    choices: presets.map((v, i) => ({
                        name: v.name,
                        value: i
                    }))
                }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const index = interaction.options.getInteger("preset", true);
        const preset = presets[index];
        if (!preset)
            return interaction.reply({
                content: "Oups... An error occured",
                ephemeral: true
            });
        (0, settings_1.setEQ)(interaction.guild, preset.eq, (0, platines_1.getPlatines)(this.lasido, interaction.guild));
        return interaction.reply({
            content: `EQ has been changed to \`${preset.name}\`!`
        });
    }
}
exports.default = EQPreset;
