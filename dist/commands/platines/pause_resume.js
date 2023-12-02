"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const platines_1 = require("../../utils/music/platines");
const voice_1 = require("../../utils/music/voice");
const settings_1 = require("../../utils/settings");
const colors_1 = require("../../utils/colors");
class PlatinesPauseResume extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "pause-resume",
            description: "Pause the music or resume it",
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        if (!(await (0, settings_1.getSettings)(interaction.guild)).music.queue.length)
            return interaction.reply({
                content: "Cannot play/pause because the player is empty.",
                ephemeral: true
            });
        if (!(0, voice_1.getVoice)(interaction.guild)) {
            const c = (0, voice_1.getMemberVoiceChannel)(interaction.member);
            if (!c)
                return interaction.reply({
                    content: "Please connect to a voice channel to do that command.",
                    ephemeral: true
                });
            (0, voice_1.createVoice)(c);
        }
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (!platines)
            return interaction.reply({
                content: "An error has come...",
                ephemeral: true
            });
        await interaction.deferReply();
        const wasPlaying = platines.status === "Playing";
        if (wasPlaying)
            platines.pause();
        else
            await platines.resume();
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("Player's state has changed!")
            .setColor((0, colors_1.hex_to_int)(wasPlaying ? this.lasido.settings.colors.negative : this.lasido.settings.colors.positive))
            .setDescription(`You have ${wasPlaying ? "paused" : "resumed"} the player!`);
        interaction.editReply({
            content: "",
            embeds: [embed]
        });
    }
}
exports.default = PlatinesPauseResume;
