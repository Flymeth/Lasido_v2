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
const play_dl_1 = __importStar(require("play-dl"));
const tracks_1 = require("../../utils/music/tracks");
const platines_1 = require("../../utils/music/platines");
const voice_1 = require("../../utils/music/voice");
const playlists_1 = require("../../utils/music/playlists");
const converter = __importStar(require("../../utils/music/converter"));
class PlatinesPlay extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "play",
            description: "Play music",
            options: [
                { name: "query", description: "Video URL, Spotify/Deezer/Soundcloud URL, Video searching keywords", type: discord_js_1.ApplicationCommandOptionType.String, required: true }
            ]
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        await interaction.deferReply({ ephemeral: true });
        if (!(0, voice_1.getVoice)(interaction.guild)) {
            const member = interaction.member;
            const channel = member.voice.channel;
            if (!channel)
                return interaction.editReply({
                    content: "You must be connected to a guild's voice channel to do this command.",
                });
            if (!channel.joinable)
                return interaction.editReply({
                    content: "This channel is unreachable for me.",
                });
            (0, voice_1.createVoice)(channel);
        }
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (!platines)
            return;
        const query = interaction.options.getString("query", true);
        const query_type = await play_dl_1.default.validate(query);
        const medias = [];
        switch (query_type) {
            case "yt_video": {
                medias.push(await (converter.convertToYoutubeVideos(query).then(r => r[0])));
                break;
            }
            case "dz_track": {
                medias.push(await play_dl_1.default.deezer(query));
                break;
            }
            case "sp_track": {
                medias.push(await play_dl_1.default.spotify(query));
                break;
            }
            case "so_track": {
                medias.push(await play_dl_1.default.soundcloud(query));
                break;
            }
            case "search": {
                const results = await play_dl_1.default.search(query, { source: { youtube: "video" }, limit: 1 });
                medias.push(results[0]);
                break;
            }
            default: {
                interaction.editReply({
                    content: "Searching for your playlist/album..."
                });
                const infos = await (0, playlists_1.getPlaylist)(query);
                if (!infos)
                    return interaction.editReply({
                        content: "The playlist/album you given isn't valid."
                    });
                const name = "name" in infos ? infos.name : infos.title;
                const tracksNumber = "tracksCount" in infos ? infos.tracksCount : infos.videoCount;
                if (!tracksNumber)
                    return interaction.editReply({
                        content: "This playlist is empty..."
                    });
                interaction.editReply({
                    content: `Found \`${tracksNumber}\` tracks in ${infos.type} __${name}__.`
                });
                medias.push(...await ("all_videos" in infos ? infos.all_videos() : infos.all_tracks()));
            }
        }
        if (!medias.length)
            return interaction.editReply({
                content: "Youps: I didn't found this media.",
            });
        medias.forEach(m => {
            platines.addToQueue(interaction.user, m);
            converter.convertToYoutubeVideos(m);
        });
        if (medias.length > 1 && platines.status === "Playing")
            return interaction.followUp({
                content: `${interaction.user.toString()} added ${medias.length} songs to queue.`,
            });
        const firstMedia = await converter.convertToYoutubeVideos(medias[0]).then(m => m[0]);
        if (!(firstMedia instanceof play_dl_1.YouTubeVideo))
            return interaction.editReply({
                content: "Oups... An error occured."
            });
        const embed = await (0, tracks_1.getInfosEmbed)(firstMedia);
        embed.setFooter({
            text: "Use '/platines play' to do the same!"
        });
        interaction.deleteReply().catch(() => undefined);
        if (platines.status !== "Playing") {
            await platines.playTrack(-medias.length);
            return interaction.channel?.send({
                content: `${interaction.user.toString()} started the player!`,
                embeds: [embed]
            });
        }
        else
            return interaction.channel?.send({
                content: `${interaction.user.toString()} added a song to queue.`,
                embeds: [embed]
            });
    }
}
exports.default = PlatinesPlay;
