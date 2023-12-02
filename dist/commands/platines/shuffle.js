"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const settings_1 = require("../../utils/settings");
const settings_2 = require("../../utils/music/settings");
const platines_1 = require("../../utils/music/platines");
class PlatineShuffle extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "shuffle",
            description: "Turn on/off shuffle or just shuffle the queue.",
            options: [
                {
                    name: "one-time", description: "Turn on this option to shuffle the queue instead of (des)activate taking a random track each time.", type: discord_js_1.ApplicationCommandOptionType.Boolean,
                }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const justShuffleQueue = interaction.options.getBoolean("one-time");
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (justShuffleQueue) {
            (0, settings_2.setShuffle)(interaction.guild, "one-time", !!platines, platines);
            return interaction.reply({
                content: "The queue has been shuffled!"
            });
        }
        else {
            const { shuffle } = (await (0, settings_1.getSettings)(interaction.guild)).music.options;
            (0, settings_2.setShuffle)(interaction.guild, shuffle ? "desactivate" : "activate", undefined, platines);
            return interaction.reply({
                content: `Shuffle mode has been turned \`${shuffle ? "off" : "on"}\`!`
            });
        }
    }
}
exports.default = PlatineShuffle;
