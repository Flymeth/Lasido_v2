"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubCommandClass_1 = __importDefault(require("../../../types/SubCommandClass"));
const settings_1 = require("../../../utils/music/settings");
class BroadcastDisable extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "disable",
            description: "Disable the DJ in your guild."
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        (0, settings_1.setBroadcast)(interaction.guild, { active: false });
        return interaction.reply({
            content: "Broadcast messages are now disabled."
        });
    }
}
exports.default = BroadcastDisable;
