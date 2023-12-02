"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const owners_1 = __importDefault(require("../../utils/owners"));
const voice_1 = require("../../utils/music/voice");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
class DevsKillCommand extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "kill",
            description: "Kill the robot",
        });
    }
    async execute(interaction, ...args) {
        if (!owners_1.default.includes(interaction.user.id))
            return interaction.reply({
                content: "You do not have the permission to do that.",
                ephemeral: true
            });
        await interaction.reply({
            content: "The request has been saved. I should kill myself in a few seconds.",
            ephemeral: true
        });
        console.log(`@${interaction.user.username} just killed me.`);
        (0, voice_1.getAllVoices)().forEach(v => {
            (0, voice_1.destroyVoice)(v.guild);
            console.log(`Destroyed voice from guild "${v.guild.name}"`);
        });
        this.lasido.destroy();
        console.log("I'm now fully killed.");
        process.kill(0);
    }
}
exports.default = DevsKillCommand;
