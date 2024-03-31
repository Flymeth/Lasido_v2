"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const CommandClass_1 = __importDefault(require("../types/CommandClass"));
const platines_1 = require("../utils/music/platines");
const tracks_1 = require("../utils/music/tracks");
const colors_1 = require("../utils/colors");
const genious = __importStar(require("genius-lyrics"));
const converter_1 = require("../utils/music/converter");
const client = new genious.Client();
class BotLyrics extends CommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "lyrics",
            description: "Get the lyrics of a song",
            options: [
                {
                    name: "search",
                    description: "Search for a song to get lyrics (if not set, it will take the current playing song)",
                    type: discord_js_1.ApplicationCommandOptionType.String
                }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        let search = interaction.options.getString("search");
        const byQuery = !!search;
        if (!search) {
            const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
            if (platines?.status !== "Playing")
                return interaction.reply({
                    content: "Please use this command during a song is playing or directly search a song with the 'search' option.",
                    ephemeral: true
                });
            const { queue, active_track } = (await platines.settings).music;
            const track_details = await (0, tracks_1.fromQueueType)(queue[active_track]);
            search = (0, converter_1.getSearchQueryFrom)(track_details, false);
        }
        interaction.deferReply();
        const geniusSong = await client.songs.search(search).then(songs => songs[0]);
        if (!geniusSong)
            return interaction.editReply({
                content: "Sorry: I didn't found this song."
                    + (byQuery ? "\n> Maybe try with the 'search' argument ?" : "")
            });
        const lyrics = await geniusSong.lyrics();
        if (!lyrics)
            return interaction.editReply({
                content: "Sorry: This song seams to have no lyrics..."
            });
        const lyricsPartition = [];
        const MAX_EMBED_DESCRIPTION_SIZE = 4090;
        while (MAX_EMBED_DESCRIPTION_SIZE * lyricsPartition.length < lyrics.length) {
            const boundaries = [MAX_EMBED_DESCRIPTION_SIZE * lyricsPartition.length, MAX_EMBED_DESCRIPTION_SIZE * (lyricsPartition.length + 1)];
            lyricsPartition.push((lyricsPartition.length ? "\n" : "")
                + lyrics.slice(...boundaries)
                + (boundaries[1] <= lyrics.length ? "\n..." : ""));
        }
        const embeds = lyricsPartition.map(content => (new discord_js_1.EmbedBuilder()
            .setColor((0, colors_1.hex_to_int)(this.lasido.settings.colors.primary))
            .setDescription(content)));
        embeds[0].setAuthor({
            name: `${geniusSong.title} by ${geniusSong.artist.name}`,
            url: geniusSong.url,
            iconURL: geniusSong.artist.image
        });
        embeds.at(-1)?.setImage(geniusSong.image);
        return interaction.editReply({
            content: "Voici les paroles demandées",
        }).then(i => embeds.forEach(e => interaction.followUp({
            content: "",
            embeds: [e]
        })));
    }
}
exports.default = BotLyrics;
