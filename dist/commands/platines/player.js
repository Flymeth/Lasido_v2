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
exports.stickPlayersFooterMessage = void 0;
const discord_js_1 = require("discord.js");
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
const platines_1 = require("../../utils/music/platines");
const tracks_1 = require("../../utils/music/tracks");
const fast_average_color_node_1 = require("fast-average-color-node");
const colors_1 = require("../../utils/colors");
const settings_1 = require("../../utils/music/settings");
const play_dl_1 = require("play-dl");
const converter = __importStar(require("../../utils/music/converter"));
exports.stickPlayersFooterMessage = "The player is in stick mode. All messages in this channel go above this one.";
class PlatinePlayer extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "player",
            description: "Get a fully functionnal player",
            options: [
                {
                    name: "stick",
                    description: "If you want the player to be sticked to the bottom of the chat (beta command: can be instable).",
                    type: discord_js_1.ApplicationCommandOptionType.Boolean
                },
                {
                    name: "force",
                    description: "If a player already exists, force to recreate a new player and delete the existing one.",
                    type: discord_js_1.ApplicationCommandOptionType.Boolean
                }
            ]
        });
    }
    async getComponents(platines) {
        const { options } = (await platines.settings).music;
        const playPauseButton = new discord_js_1.ButtonBuilder()
            .setEmoji(platines.status === "Playing" ? "⏸️" : "▶️")
            .setStyle(platines.status === "Playing" ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary)
            .setCustomId("play-pause");
        const shuffleButton = new discord_js_1.ButtonBuilder()
            .setEmoji(options.shuffle ? "🔀" : "➡️")
            .setStyle(options.shuffle ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary)
            .setLabel(options.shuffle ? "Shuffle: ON" : "Shuffle: OFF")
            .setCustomId("shuffle");
        const loopButton = new discord_js_1.ButtonBuilder()
            .setEmoji(options.loop.active ? (options.loop.loop_type === "queue" ? "🔁" : "🔂") : "↪️")
            .setStyle(options.loop.active ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary)
            .setCustomId("loop");
        const nextButton = new discord_js_1.ButtonBuilder()
            .setEmoji("⏭️")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setCustomId("next");
        const previousButton = new discord_js_1.ButtonBuilder()
            .setEmoji("⏮️")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setCustomId("previous");
        const stopButton = new discord_js_1.ButtonBuilder()
            .setEmoji("⏹️")
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setCustomId("stop");
        const deletePlayer = new discord_js_1.ButtonBuilder()
            .setEmoji("✖️")
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setCustomId("discard")
            .setLabel("Discard player");
        const rows = [
            new discord_js_1.ActionRowBuilder().setComponents(previousButton, stopButton, playPauseButton, nextButton),
            new discord_js_1.ActionRowBuilder().setComponents(shuffleButton, loopButton, deletePlayer)
        ];
        return rows;
    }
    async componentInteraction(platines, interaction) {
        const { music } = await platines.settings;
        switch (interaction.customId) {
            case "play-pause": {
                if (platines.status === "Playing")
                    platines.pause();
                else
                    await platines.resume();
                break;
            }
            case "shuffle": {
                (0, settings_1.setShuffle)(platines.guild, music.options.shuffle ? "desactivate" : "activate", true, platines);
                break;
            }
            case "loop": {
                const { loop: { active, loop_type } } = music.options;
                if (!active)
                    (0, settings_1.setLoop)(platines.guild, { activate: true, type: "queue" }, platines);
                else if (loop_type === "queue")
                    (0, settings_1.setLoop)(platines.guild, { activate: true, type: "song" }, platines);
                else
                    (0, settings_1.setLoop)(platines.guild, { activate: false }, platines);
                break;
            }
            case "next": {
                await platines.next();
                break;
            }
            case "previous": {
                await platines.previous();
                break;
            }
            case "stop": {
                platines.destroy();
            }
            case "discard": {
                return "discard";
            }
        }
        return this.getComponents(platines);
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const platines = (0, platines_1.getPlatines)(this.lasido, interaction.guild);
        if (!platines)
            return interaction.reply({
                content: "I must be connected to a voice channel to make that command working.",
                ephemeral: true
            });
        const { settings } = await platines.settings;
        if (settings.player) {
            const { channel, message } = settings.player;
            const playerMessage = await this.lasido.channels.fetch(channel).then(async (channel) => {
                if (!channel?.isTextBased())
                    return;
                return channel.messages.fetch(message).catch(() => undefined);
            }).catch(() => undefined);
            if (playerMessage) {
                if (!interaction.options.getBoolean("force"))
                    return interaction.reply({
                        content: `Sorry, there is already a player in this guild.\n[Click to access it](${playerMessage.url})`,
                        ephemeral: true
                    });
                else
                    playerMessage.delete().catch(() => undefined);
            }
        }
        const settingsUpdated = () => platines.status === "Playing" ? onStateChanged("playing").then(() => editMessage()) : undefined;
        const playerUpdated = (guildId) => interaction.guildId === guildId ? editMessage(true) : undefined;
        const events = {
            trackChange: (video, id) => onTrackChanged(video, id).then(() => editMessage()),
            queueChange: settingsUpdated,
            shuffleChange: settingsUpdated,
            loopChange: settingsUpdated,
            paused: () => onStateChanged("pause").then(() => editMessage()),
            stop: () => onStateChanged("pause").then(() => editMessage()),
            resumed: () => onStateChanged("playing").then(() => editMessage()),
            destroy: destroyPlayer,
        };
        const MusicOptionEmojis = {
            shuffle: "🔀",
            queueLoop: "🔁",
            songLoop: "🔂",
        };
        const embed = new discord_js_1.EmbedBuilder()
            .setAuthor({
            name: `💿 ${interaction.guild.name}'s platines`,
            iconURL: interaction.guild.iconURL() || undefined,
        });
        const updatePlayerMessage = (id) => platines.updateSettings(s => s.settings.player = {
            channel: interaction.channelId,
            message: id
        });
        const componentInteractionMade = async (i) => {
            await i.deferUpdate();
            this.componentInteraction(platines, i).then(option => {
                if (option === "discard")
                    return destroyPlayer();
            });
        };
        const updateInteractionHandler = (m) => (m.awaitMessageComponent({ componentType: discord_js_1.ComponentType.Button })
            .then(b => componentInteractionMade(b))
            .catch(() => undefined));
        const stick = !!interaction.options.getBoolean("stick");
        if (stick)
            embed.setFooter({
                text: exports.stickPlayersFooterMessage
            });
        await interaction.deferReply({ ephemeral: stick }).then(async () => (interaction.fetchReply().then(({ id }) => updatePlayerMessage(id))));
        async function onTrackChanged(video, id) {
            if (!platines)
                return;
            const { options, queue } = (await platines.settings).music;
            const details = video instanceof play_dl_1.YouTubeVideo ? video : await (converter.convertToYoutubeVideos(video).then(r => r[0]));
            const author = await platines.lasido.users.fetch(queue[id].author);
            embed.setTitle(`${options.loop.active ? (options.loop.loop_type === "queue" ? MusicOptionEmojis.queueLoop : MusicOptionEmojis.songLoop) : ""}${options.shuffle ? MusicOptionEmojis.shuffle : "▶️"} Playing ${details.title}`);
            embed.setURL(details.url);
            embed.setImage(details.thumbnails.at(-1)?.url || null);
            embed.setFields({ name: "Duration", value: new Date(details.durationInSec * 1000).toLocaleTimeString(new Intl.Locale("fr"), { timeStyle: "medium" }) }, { name: "Author", value: `[${details.channel?.name}](${details.channel?.url})` }, { name: "Position", value: `${id + 1} of ${queue.length}` }, { name: "Added by", value: author.toString() });
            const thumbnailURL = details.thumbnails.at(-1)?.url;
            if (thumbnailURL) {
                const color = await (0, fast_average_color_node_1.getAverageColor)(thumbnailURL);
                embed.setColor((0, colors_1.hex_to_int)(color.hex));
            }
            onStateChanged("playing");
        }
        async function onStateChanged(state) {
            if (state === "pause") {
                embed
                    .setTitle("⏸️ Currently paused.")
                    .setURL(null)
                    .setFields()
                    .setImage(null);
            }
            else {
                if (!platines)
                    return;
                const { queue, active_track } = (await platines.settings).music;
                const infos = await (0, tracks_1.fromQueueType)(queue[active_track]).then(t => converter.convertToYoutubeVideos(t)).then(r => r[0]);
                if (!(infos instanceof play_dl_1.YouTubeVideo))
                    return destroyPlayer();
                return onTrackChanged(infos, active_track);
            }
        }
        const lastMessage = async () => {
            const { settings: { player } } = await platines.settings;
            if (!player)
                return;
            return this.lasido.channels.fetch(player.channel).then(channel => {
                if (!channel?.isTextBased())
                    return;
                return channel.messages.fetch(player.message).then(m => m);
            }).catch(() => undefined);
        };
        const getComponents = () => this.getComponents(platines);
        async function destroyPlayer() {
            (await lastMessage())?.delete().catch(() => undefined);
            interaction.deleteReply().catch(() => undefined);
            if (platines) {
                for (const event in events)
                    platines.removeListener(event, events[event]);
                platines.lasido.removeListener("playerUpdate", playerUpdated);
                platines.updateSettings(s => s.settings.player = undefined);
            }
        }
        async function editMessage(recreateMessageIfStickMode) {
            const messageContent = {
                content: "Please note that this command is in beta-test for now!",
                embeds: [embed],
                components: await getComponents(),
                ephemeral: false
            };
            if (!platines)
                return destroyPlayer();
            const { settings } = await platines.settings;
            if (stick) {
                const msg = await lastMessage();
                if (!msg)
                    await interaction.editReply("The sticky player has been created." + new Date().toString());
                else if (msg.id !== settings.player?.message)
                    return destroyPlayer();
                if (!msg || recreateMessageIfStickMode) {
                    await msg?.delete().catch(() => undefined);
                    interaction.followUp(messageContent)?.then(async (message) => {
                        await updatePlayerMessage(message.id);
                        await updateInteractionHandler(message);
                    });
                }
                else
                    msg?.edit(messageContent).then(async (message) => {
                        await updateInteractionHandler(message);
                    });
            }
            else
                interaction.editReply(messageContent).then(async (message) => {
                    if (message.id !== settings.player?.message)
                        return destroyPlayer();
                    await updateInteractionHandler(message);
                }).catch(() => destroyPlayer());
        }
        for (const event in events)
            platines.on(event, events[event]);
        this.lasido.on("playerUpdate", playerUpdated);
        return onStateChanged(platines.status === "Playing" ? "playing" : "pause").then(() => editMessage());
    }
}
exports.default = PlatinePlayer;
