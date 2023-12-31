"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const settings_1 = require("../../utils/settings");
const tracks_1 = require("../../utils/music/tracks");
const platines_1 = require("../../utils/music/platines");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const colors_1 = require("../../utils/colors");
const time_1 = __importDefault(require("../../utils/time"));
class PlatineQueue extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "queue",
            description: "Get the current guild's queue",
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const { music: { queue } } = await (0, settings_1.getSettings)(interaction.guild);
        if (!queue.length)
            return interaction.reply({ content: "The queue is empty for this guild. Start adding tracks with the `/platines play` command." });
        await interaction.reply({
            content: "Acquiring queue's track..."
        });
        const MAX_FIELDS_PER_EMBED = 10;
        const tracks = new Array(Math.ceil(queue.length / MAX_FIELDS_PER_EMBED)).fill(undefined).map(() => []);
        const user_cache = new Map();
        let index = 0;
        let totalTime = 0;
        let isValid = true;
        while (index < queue.length) {
            if (!isValid)
                return;
            const matrixIndex = Math.floor(index / MAX_FIELDS_PER_EMBED);
            const infos = queue[index];
            const video = await (0, tracks_1.fromQueueType)(infos, true);
            if (!user_cache.has(infos.author))
                user_cache.set(infos.author, await this.lasido.users.fetch(infos.author));
            const author = user_cache.get(infos.author);
            tracks[matrixIndex].push({ author, video });
            totalTime += video.durationInSec;
            index++;
            interaction.editReply({
                content: `Please wait a moment... I'm getting informations about track \`${index}\` of \`${queue.length}\`...`
            }).catch(() => {
                isValid = false;
            });
        }
        const embedInformations = {
            current: 0,
            pages: tracks.length,
            totalTime
        };
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`${interaction.guild.name}'s queue`)
            .setColor((0, colors_1.hex_to_int)(this.lasido.settings.colors.primary));
        const row = new discord_js_1.ActionRowBuilder();
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        async function buildEmbed() {
            const pageTracks = tracks[embedInformations.current];
            const indexRanges = new Array(2).fill(embedInformations.current * MAX_FIELDS_PER_EMBED).map((v, i) => v + pageTracks.length * i);
            const currentTrackIndex = (await platines?.settings)?.music.active_track;
            embed.setFields(pageTracks.map(({ author, video }, index) => {
                const globalIndex = indexRanges[0] + index;
                const isMain = platines?.status !== "Idle" && globalIndex === currentTrackIndex;
                return {
                    name: `\`#${globalIndex + 1}\` - ` + (isMain ? "🎵 " : "") + `[${(0, time_1.default)(video.durationInSec * 1000).toString()}] ${video.title}`,
                    value: `Added by ${author.toString()}\n[Track Source](${video.url})\nDuration: ${(0, time_1.default)(video.durationInSec * 1000).toString()}`,
                };
            }))
                .setDescription(`Page ${embedInformations.current + 1} of ${embedInformations.pages}`
                + `\nTracks ${indexRanges[0] + 1} to ${indexRanges[1]} of ${queue.length}`
                + `\nTotal queue time: ${(0, time_1.default)(embedInformations.totalTime * 1000).toString()}`);
        }
        async function buildRow() {
            const previousButton = new discord_js_1.ButtonBuilder()
                .setCustomId("previous")
                .setDisabled(embedInformations.current <= 0)
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji("⬅️");
            const hideButton = new discord_js_1.ButtonBuilder()
                .setCustomId("hide")
                .setEmoji("✖️")
                .setStyle(discord_js_1.ButtonStyle.Danger);
            const nextButton = new discord_js_1.ButtonBuilder()
                .setCustomId("next")
                .setDisabled(embedInformations.current + 1 >= embedInformations.pages)
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji("➡️");
            const currentTrack = (await platines?.settings)?.music.active_track;
            if (typeof currentTrack === "number") {
                const currentTrackPage = Math.floor(currentTrack / MAX_FIELDS_PER_EMBED);
                const currentButton = new discord_js_1.ButtonBuilder()
                    .setCustomId("current")
                    .setEmoji("🎵")
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setDisabled(currentTrackPage === embedInformations.current || platines?.status !== "Playing");
                row.setComponents(previousButton, hideButton, currentButton, nextButton);
            }
            else
                row.setComponents(previousButton, hideButton, nextButton);
        }
        async function editReply() {
            await buildEmbed();
            await buildRow();
            interaction.editReply({
                content: "",
                embeds: [embed],
                components: [row]
            })
                .catch(() => undefined)
                .then(message => {
                message?.awaitMessageComponent({ componentType: discord_js_1.ComponentType.Button, time: 60_000 }).then(async (button) => {
                    const { customId } = button;
                    switch (customId) {
                        case "previous": {
                            embedInformations.current--;
                            break;
                        }
                        case "next": {
                            embedInformations.current++;
                            break;
                        }
                        case "current": {
                            const currentTrack = (await platines?.settings)?.music.active_track;
                            if (typeof currentTrack === "number")
                                embedInformations.current = Math.floor(currentTrack / MAX_FIELDS_PER_EMBED);
                            break;
                        }
                        default:
                            return interaction.deleteReply();
                    }
                    return button.deferUpdate().then(editReply);
                }).catch(() => interaction.editReply({ content: "", embeds: [embed], components: [] }).catch(() => undefined));
            });
        }
        return editReply();
    }
}
exports.default = PlatineQueue;
