"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = __importDefault(require("../types/CommandClass"));
const voice_1 = require("../utils/music/voice");
class Disconnect extends CommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "disconnect",
            description: "Disconnect Lasido from your voice channel",
            dmPermission: false
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        if (!(0, voice_1.getVoice)(interaction.guild))
            return interaction.reply({
                content: "I'm not connected to any channel on this server."
            });
        (0, voice_1.destroyVoice)(interaction.guild);
        return interaction.reply({
            content: "Done!"
        });
    }
}
exports.default = Disconnect;
