"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const platines_1 = require("../../utils/music/platines");
class PlatinesNext extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "next",
            description: "Pass the music and get the next one",
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (!platines)
            return interaction.reply({
                content: "You must be connected to a voice channel to do that...",
                ephemeral: true
            });
        await interaction.deferReply();
        await platines.next();
        interaction.editReply({ content: `Song nexted.` });
    }
}
exports.default = PlatinesNext;
