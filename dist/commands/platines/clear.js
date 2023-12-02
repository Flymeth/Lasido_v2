"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const platines_1 = require("../../utils/music/platines");
const settings_1 = require("../../utils/settings");
class PlatinesClear extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "clear",
            description: "Clear the whole queue"
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const { music } = await (0, settings_1.getSettings)(interaction.guild);
        const deleteWholeQueue = await interaction.reply({
            content: `❗ Do you want to delete the whole queue (\`${music.queue.length}\` tracks) ?`,
            components: [new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder({
                    emoji: "✅",
                    style: discord_js_1.ButtonStyle.Danger,
                    customId: "yes"
                }), new discord_js_1.ButtonBuilder({
                    emoji: "❎",
                    style: discord_js_1.ButtonStyle.Secondary,
                    customId: "no"
                }))]
        }).then(message => message.awaitMessageComponent({
            componentType: discord_js_1.ComponentType.Button,
            time: 10000
        }).then(react => react.component.customId === "yes").catch(() => false))
            .catch(() => undefined);
        await interaction.deleteReply().catch(() => undefined);
        if (deleteWholeQueue) {
            const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
            if (platines) {
                if (platines.status === "Playing")
                    platines.stop("Queue has been deleted.");
                platines.currentRessource = undefined;
            }
            (0, settings_1.updateSettings)(interaction.guild, (s) => (s.music.queue = [], s.music.active_track = -1));
            interaction.channel?.send({
                content: `${interaction.user.toString()} just deleted the queue!`
            });
        }
        return interaction.editReply({ content: "done!", components: [] });
    }
}
exports.default = PlatinesClear;
