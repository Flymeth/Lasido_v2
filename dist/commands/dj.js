"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = require("../types/CommandClass");
class BotSettings extends CommandClass_1.BotCommandGroup {
    constructor(lasido) {
        super(lasido, {
            name: "dj",
            description: "Modify your serveur's DJs settings",
        }, []);
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
    }
}
exports.default = BotSettings;
