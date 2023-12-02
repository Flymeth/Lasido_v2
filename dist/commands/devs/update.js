"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
class DevsUpdate extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "update",
            description: "Update all the commands/events from the written source.",
            options: [
                { name: "commands", description: "Update or not the commands", type: discord_js_1.ApplicationCommandOptionType.Boolean, required: true },
                { name: "events", description: "Update or not the events", type: discord_js_1.ApplicationCommandOptionType.Boolean, required: true }
            ]
        });
    }
    async execute(interaction, ...args) {
        await interaction.deferReply({ ephemeral: true });
        const updateCommands = interaction.options.getBoolean("commands", true);
        const updateEvents = interaction.options.getBoolean("events", true);
        if (updateCommands)
            await this.lasido.setupCommands();
        if (updateEvents)
            await this.lasido.setupEvents().then(() => this.lasido.registerEvents());
        return interaction.editReply({
            content: "Done!"
        });
    }
}
exports.default = DevsUpdate;
