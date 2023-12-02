"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = __importDefault(require("../types/CommandClass"));
const discord_js_1 = require("discord.js");
const voice_1 = require("../utils/music/voice");
const colors_1 = require("../utils/colors");
class ConnectCommand extends CommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "connect",
            description: "Makes the bot joins your current voice channel",
            dmPermission: false
        });
    }
    async execute(interaction, ...args) {
        await interaction.deferReply();
        if (!interaction.inGuild())
            return;
        if (interaction.guild && (0, voice_1.getVoice)(interaction.guild))
            return interaction.editReply({
                content: "I'm already in a voice channel"
            });
        const member = interaction.member;
        const channel = member.voice.channel;
        if (!channel)
            return interaction.editReply({
                content: "You must be connected to a guild's voice channel to do this command."
            });
        if (!channel.joinable)
            return interaction.editReply({
                content: "This channel is unreachable for me."
            });
        (0, voice_1.createVoice)(channel);
        interaction.editReply({
            content: "",
            embeds: [
                new discord_js_1.EmbedBuilder({
                    title: "🔊 I'm now connected!",
                    description: `${member} connects me to ${channel}.`,
                    color: (0, colors_1.hex_to_int)(this.lasido.settings.colors.positive)
                })
            ]
        });
    }
}
exports.default = ConnectCommand;
