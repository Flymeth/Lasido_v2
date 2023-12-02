"use strict";
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
exports.stickPlayersFooterMessage = "The player is in stick mode. All messages will be sent above it.";
class PlatinePlayer extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "player",
            description: "Get a fully functionnal player",
            options: [
                {
                    name: "stick",
                    description: "If you want the player to be sticked to the bottom of the chat.",
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
            if (playerMessage)
                return interaction.reply({
                    content: `Sorry, there is already a player in this guild.\n[Click to access it](${playerMessage.url})`,
                    ephemeral: true
                });
        }
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
            const details = typeof video === "string" ? await (0, tracks_1.getVideoInfos)(video) : video;
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
                const infos = await (0, tracks_1.fromQueueType)(queue[active_track]).then(t => (0, tracks_1.convertToYoutube)(t));
                if (!infos)
                    return destroyPlayer();
                return onTrackChanged(infos, active_track);
            }
        }
        let lastMessage = undefined;
        const getComponents = () => this.getComponents(platines);
        async function destroyPlayer() {
            if (lastMessage)
                lastMessage.delete().catch(() => undefined);
            interaction.deleteReply().catch(() => undefined);
            platines?.updateSettings(s => s.settings.player = undefined);
        }
        async function editMessage() {
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
                if (!lastMessage)
                    await interaction.editReply("The sticky player has been created.");
                else if (lastMessage.id !== settings.player?.message)
                    return destroyPlayer();
                interaction.followUp(messageContent)?.then(async (message) => {
                    if (lastMessage)
                        lastMessage.fetch().then((m) => m.delete()).catch(() => undefined);
                    await updateInteractionHandler(message);
                    await updatePlayerMessage(message.id);
                    lastMessage = message;
                });
            }
            else
                interaction.editReply(messageContent).then(async (message) => {
                    if (message.id !== settings.player?.message)
                        return destroyPlayer();
                    await updateInteractionHandler(message);
                }).catch(() => destroyPlayer());
        }
        const settingsUpdated = () => platines.status === "Playing" ? onStateChanged("playing").then(editMessage) : undefined;
        platines.on("trackChange", (video, id) => onTrackChanged(video, id).then(editMessage));
        platines.on("queueChange", settingsUpdated);
        platines.on("shuffleChange", settingsUpdated);
        platines.on("loopChange", settingsUpdated);
        platines.on("paused", () => onStateChanged("pause").then(editMessage));
        platines.on("stop", () => onStateChanged("pause").then(editMessage));
        platines.on("resumed", () => onStateChanged("playing").then(editMessage));
        platines.on("destroy", () => destroyPlayer());
        this.lasido.on("playerUpdate", (guildId) => interaction.guildId === guildId ? editMessage() : undefined);
        return onStateChanged(platines.status === "Playing" ? "playing" : "pause").then(editMessage);
    }
}
exports.default = PlatinePlayer;
