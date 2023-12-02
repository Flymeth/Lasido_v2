"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const CommandClass_1 = __importDefault(require("../types/CommandClass"));
const _index_1 = __importDefault(require("./settings/dj/_index"));
const _index_2 = __importDefault(require("./settings/broadcast/_index"));
const settings_1 = require("../utils/settings");
class BotSettings extends CommandClass_1.default {
    command_groups;
    constructor(lasido) {
        const groups = [
            _index_1.default, _index_2.default
        ].map(c => new c(lasido));
        super(lasido, {
            name: "settings",
            description: "Update your server's settings",
            type: discord_js_1.ApplicationCommandType.ChatInput,
            options: groups.map(grp => ({
                name: grp.command_informations.name,
                description: grp.command_informations.description,
                type: discord_js_1.ApplicationCommandOptionType.SubcommandGroup,
                options: grp.command_informations.options || []
            }))
        });
        this.command_groups = groups;
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const memberPermission = interaction.memberPermissions;
        if (!memberPermission?.has("ManageGuild"))
            return interaction.reply({
                content: "Sorry: you do not have the permission to edit the server's settings.",
                ephemeral: true
            });
        const { dj } = (await (0, settings_1.getSettings)(interaction.guild)).settings;
        if (dj.active && dj.role && !interaction.member?.roles.valueOf().hasOwnProperty(dj.role))
            return interaction.reply({
                content: "You must be a DJ to perfom this action (regardless of your server's permissions).",
                ephemeral: true
            });
        const group = interaction.options.getSubcommandGroup(true);
        const command = this.command_groups.find(cmd => cmd.command_informations.name === group);
        if (!command)
            return interaction.reply({
                content: "This setting has not been found.",
                ephemeral: true
            });
        return command.execute(interaction, ...args);
    }
}
exports.default = BotSettings;
