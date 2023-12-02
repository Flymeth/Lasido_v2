"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../../types/SubCommandClass"));
const settings_1 = require("../../../utils/music/settings");
const allowedChannelsType = [
    discord_js_1.ChannelType.GuildText,
    discord_js_1.ChannelType.GuildAnnouncement,
    discord_js_1.ChannelType.GuildStageVoice,
    discord_js_1.ChannelType.PublicThread,
    discord_js_1.ChannelType.PrivateThread
];
class BroadcastSet extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "set",
            description: "Set the dj and its behaviors",
            options: [
                {
                    name: "channel",
                    description: "Set the broadcast's channel",
                    type: discord_js_1.ApplicationCommandOptionType.Channel,
                    channel_types: allowedChannelsType
                }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const channel = (interaction.options.getChannel("channel", false, allowedChannelsType)) || interaction.channel;
        if (channel.isDMBased())
            return interaction.reply({
                content: "This is an invalid channel (please provide a guild text-based channel).",
                ephemeral: true
            });
        const permissions = channel.permissionsFor(interaction.guild.members.me);
        if (!(permissions.has("SendMessages") && permissions.has("ViewChannel")))
            return interaction.reply({
                content: "I've not access to this channel or I cannot send message in it.",
                ephemeral: true
            });
        (0, settings_1.setBroadcast)(interaction.guild, {
            active: true,
            channel: channel.id
        });
        return interaction.reply({
            content: `Enable broadcast messages into ${channel.toString()}.`
        });
    }
}
exports.default = BroadcastSet;
