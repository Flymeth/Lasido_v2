"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const platines_1 = require("../../utils/music/platines");
class PlatinesStop extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "stop",
            description: "Stops the player and disconnect the bot.",
            options: [
                { name: "keep-queue", description: "If you don't want to delete the queue (default to False).", type: discord_js_1.ApplicationCommandOptionType.Boolean }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (!platines)
            return interaction.reply({
                content: "I'm not in a voice channel, so the player is already stopped.",
                ephemeral: true
            });
        const keepQueue = interaction.options.getBoolean("keep-queue") === true;
        if (!keepQueue)
            platines.updateSettings(s => { s.music.queue = []; s.music.active_track = -1; });
        platines.destroy();
        return interaction.reply("The player just stopped!");
    }
}
exports.default = PlatinesStop;
