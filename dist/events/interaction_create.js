"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventClass_1 = __importDefault(require("../types/EventClass"));
class UserInteraction extends EventClass_1.default {
    constructor(lasido) {
        super(lasido, "interactionCreate");
    }
    async handle(interaction, ...args) {
        if (interaction.isChatInputCommand()) {
            const command = this.lasido.commands.find(cmd => cmd.command_informations.name == interaction.commandName);
            if (!command) {
                interaction.reply({ content: "Oups... This command has no handler.", ephemeral: true });
            }
            else {
                if (!(command.mp || interaction.inGuild()))
                    return interaction.reply({ content: "Sorry, this command is not enabled in mp." });
                command.execute(interaction, ...args).catch((err) => {
                    console.error("------  [!]> LASIDO ERROR  ----------");
                    console.error(err);
                    console.error("-------------------------------------");
                });
            }
        }
        else
            return;
    }
}
exports.default = UserInteraction;
