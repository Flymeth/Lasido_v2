"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const play_dl_1 = __importDefault(require("play-dl"));
const tracks_1 = require("../../utils/music/tracks");
const platines_1 = require("../../utils/music/platines");
const voice_1 = require("../../utils/music/voice");
const playlists_1 = require("../../utils/music/playlists");
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
        if (!(0, voice_1.getVoice)(interaction.guild)) {
            const member = interaction.member;
            const channel = member.voice.channel;
            if (!channel)
                return interaction.reply({
                    content: "You must be connected to a guild's voice channel to do this command.",
                    ephemeral: true
                });
            if (!channel.joinable)
                return interaction.reply({
                    content: "This channel is unreachable for me.",
                    ephemeral: true
                });
            (0, voice_1.createVoice)(channel);
        }
        await interaction.deferReply({ ephemeral: true });
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (!platines)
            return;
        const query = interaction.options.getString("query", true);
        const query_type = await play_dl_1.default.validate(query);
        const medias = [];
        switch (query_type) {
            case "yt_video": {
                medias.push(await (0, tracks_1.getVideoInfos)(query));
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
            (0, tracks_1.convertToYoutube)(m);
        });
        const firstMedia = await (0, tracks_1.convertToYoutube)(medias[0]);
        if (!firstMedia)
            return interaction.editReply({
                content: "Oups... An error occured."
            });
        const embed = await (0, tracks_1.getInfosEmbed)(firstMedia);
        interaction.deleteReply().catch(() => undefined);
        if (platines.status !== "Playing") {
            await platines.playTrack(-1);
            return interaction.followUp({
                content: `${interaction.user.toString()} started the player!`,
                embeds: [embed]
            });
        }
        else
            return interaction.followUp({
                content: `${interaction.user.toString()} added a song to queue.`,
                embeds: [embed]
            });
    }
}
exports.default = PlatinesPlay;
