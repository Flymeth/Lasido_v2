"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const platines_1 = require("../../utils/music/platines");
class PlatinesJump extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "jump",
            description: "Jump to a certain track",
            options: [
                { name: "track-id", description: "The track index you want to be played (set a nagative number to select from the queue's end)", required: true, type: discord_js_1.ApplicationCommandOptionType.Integer }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (!platines)
            return interaction.reply({
                content: "I must be connected to a voice channel to perform that command.",
                ephemeral: true
            });
        const given_index = interaction.options.getInteger("track-id", true);
        if (!given_index)
            return interaction.reply({
                content: "The index must be a stricly negative or positive number.",
                ephemeral: true
            });
        const index = given_index < 0 ? given_index : given_index - 1;
        const done = await platines.skipTo(index);
        if (done)
            interaction.reply({
                content: "Done!"
            });
        else
            interaction.reply({
                content: "Oups... Cannot jump to that track..."
            });
    }
}
exports.default = PlatinesJump;
