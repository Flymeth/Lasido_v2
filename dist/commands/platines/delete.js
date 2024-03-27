"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const platines_1 = require("../../utils/music/platines");
const settings_1 = require("../../utils/settings");
class PlatinesDelete extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "delete",
            description: "Delete a track from the queue",
            options: [{
                    name: "track-id",
                    description: "The track index you want to delete (default to the current playing track)",
                    type: discord_js_1.ApplicationCommandOptionType.Integer
                }]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        const index = interaction.options.getInteger("track-id");
        if (!platines) {
            if (typeof index === "number")
                (0, settings_1.updateSettings)(interaction.guild, (s) => s.music.queue.splice(index, 1));
            else
                return interaction.reply({
                    content: "I'm not playing anything: you must indidate the track's index.",
                    ephemeral: true
                });
        }
        else {
            const { active_track } = (await platines.settings).music;
            const id = (index ?? active_track + 1) - 1;
            platines.remFromQueue(id);
            if (index === active_track
                && platines.status === "Playing")
                platines.next();
        }
        return interaction.reply({ content: "done!" });
    }
}
exports.default = PlatinesDelete;
