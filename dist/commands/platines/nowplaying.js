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
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const platines_1 = require("../../utils/music/platines");
const tracks_1 = require("../../utils/music/tracks");
const colors_1 = require("../../utils/colors");
const string_progressbar_1 = __importDefault(require("string-progressbar"));
const time_1 = __importDefault(require("../../utils/time"));
const converter = __importStar(require("../../utils/music/converter"));
const play_dl_1 = require("play-dl");
class PlatineNowPlaying extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "current-nowplaying",
            description: "Get information about the current playing track"
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (!platines || platines.status !== "Playing")
            return interaction.reply({
                content: "I'm not playing anything yet."
            });
        const { queue, active_track } = (await platines.settings).music;
        const track = queue[active_track];
        if (!track)
            return;
        const ressourceData = platines.currentRessource;
        if (!ressourceData)
            return;
        await interaction.deferReply();
        const { ressource, source } = ressourceData;
        let audioDuration;
        let baseEmbed;
        switch (source) {
            case "file": {
                const file = ressource.metadata;
                if (typeof file.duration === "number")
                    audioDuration = file.duration * 1000;
                else
                    audioDuration = null;
                baseEmbed = new discord_js_1.EmbedBuilder({
                    title: file.name,
                    url: file.url,
                    description: file.description || undefined,
                    color: (0, colors_1.hex_to_int)(this.lasido.settings.colors.primary)
                });
                break;
            }
            case "streaming_provider": {
                const video_details = await (0, tracks_1.fromQueueType)(track).then(v => converter.convertToYoutubeVideos(v)).then(r => r[0]);
                if (!(video_details instanceof play_dl_1.YouTubeVideo))
                    return interaction.editReply({ content: "Oups... An error has come." });
                audioDuration = video_details.durationInSec * 1000;
                baseEmbed = await (0, tracks_1.getInfosEmbed)(video_details);
                break;
            }
            default: return interaction.editReply({
                content: "Sorry. An error has come. (audio ressource has an invalid source)."
            });
        }
        const currentTimeChar = " 🪩 ";
        const { playbackDuration } = ressource;
        let progressbar = "";
        if (typeof audioDuration === "number") {
            progressbar = string_progressbar_1.default.splitBar(audioDuration, playbackDuration, 13, "➖", currentTimeChar)[0];
            if (!progressbar.includes(currentTimeChar))
                progressbar = currentTimeChar + progressbar.slice(1);
        }
        const author = await this.lasido.users.fetch(track.author);
        baseEmbed.addFields({ name: "👻 Author", value: author.toString() }, { name: "⏲️ Time", value: `**${(0, time_1.default)(playbackDuration).toString()}** ` + audioDuration ? (progressbar + ` *${(0, time_1.default)(audioDuration).toString()}*`) : "" });
        interaction.editReply({
            content: "",
            embeds: [baseEmbed]
        });
    }
}
exports.default = PlatineNowPlaying;
