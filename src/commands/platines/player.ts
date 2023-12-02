import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, ComponentBuilder, ComponentData, ComponentType, EmbedBuilder, Guild, InteractionEditReplyOptions, InteractionReplyOptions, InteractionType, Message, MessageActionRowComponent, MessageActionRowComponentBuilder, MessageComponentInteraction, MessageCreateOptions, MessageEditOptions, MessageInteraction, MessagePayload } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { Platines, getPlatines } from "../../utils/music/platines";
import { convertToYoutube, fromQueueType, getVideoInfos } from "../../utils/music/tracks";
import { getAverageColor } from "fast-average-color-node";
import { hex_to_int } from "../../utils/colors";
import { setLoop, setShuffle } from "../../utils/music/settings";
import { YouTubeVideo } from "play-dl";

export const stickPlayersFooterMessage = "The player is in stick mode. All messages will be sent above it."

export default class PlatinePlayer extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "player",
            description: "Get a fully functionnal player",
            options: [
                {
                    name: "stick",
                    description: "If you want the player to be sticked to the bottom of the chat.",
                    type: ApplicationCommandOptionType.Boolean
                }
            ]
        })
    }

    private async getComponents(platines: Platines) {
        const { options } = (await platines.settings).music

        const playPauseButton = new ButtonBuilder()
            .setEmoji(platines.status === "Playing" ? "⏸️" : "▶️")
            .setStyle(platines.status === "Playing" ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setCustomId("play-pause")
        ;
        const shuffleButton = new ButtonBuilder()
            .setEmoji(options.shuffle ? "🔀" : "➡️")
            .setStyle(options.shuffle ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setLabel(options.shuffle ? "Shuffle: ON" : "Shuffle: OFF")
            .setCustomId("shuffle")
        ;
        const loopButton = new ButtonBuilder()
            .setEmoji(
                options.loop.active ? (
                    options.loop.loop_type === "queue" ? "🔁" : "🔂"
                ) : "↪️"
            )
            .setStyle(options.loop.active ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setCustomId("loop")
        ;
        const nextButton = new ButtonBuilder()
            .setEmoji("⏭️")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("next")
        ;
        const previousButton = new ButtonBuilder()
            .setEmoji("⏮️")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("previous")
        ;
        const stopButton = new ButtonBuilder()
            .setEmoji("⏹️")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("stop")
        ;
        const deletePlayer = new ButtonBuilder()
            .setEmoji("✖️")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("discard")
            .setLabel("Discard player")
        ;

        const rows = [
            new ActionRowBuilder().setComponents(previousButton, stopButton, playPauseButton, nextButton),
            new ActionRowBuilder().setComponents(shuffleButton, loopButton, deletePlayer)
        ]
        
        return rows as ActionRowBuilder<MessageActionRowComponentBuilder>[]
    }
    private async componentInteraction(platines: Platines, interaction: ButtonInteraction) {
        const { music } = await platines.settings

        switch(interaction.customId) {
            case "play-pause": {
                if(platines.status === "Playing") platines.pause()
                else await platines.resume()
                break;
            }
            case "shuffle": {
                setShuffle(platines.guild, music.options.shuffle ? "desactivate" : "activate", true, platines)
                break;
            }
            case "loop": {
                const { loop: {active, loop_type} } = music.options
                if(!active) setLoop(platines.guild, {activate: true, type: "queue"}, platines)
                else if(loop_type === "queue") setLoop(platines.guild, {activate: true, type: "song"}, platines)
                else setLoop(platines.guild, {activate: false}, platines)

                break;
            }
            case "next": {
                await platines.next()
                break
            }
            case "previous": {
                await platines.previous()
                break
            }
            case "stop": {
                platines.destroy()
            }
            case "discard": {
                return "discard"
            }
        }
        return this.getComponents(platines)
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const platines = getPlatines(this.lasido, interaction.guild)
        if(!platines) return interaction.reply({
            content: "I must be connected to a voice channel to make that command working.",
            ephemeral: true
        })
        const { settings } = await platines.settings
        if(settings.player) {
            const { channel, message } = settings.player
            const playerMessage = await this.lasido.channels.fetch(channel).then(async (channel) => {
                if(!channel?.isTextBased()) return
                return channel.messages.fetch(message).catch(() => undefined)
            }).catch(() => undefined)
            if(playerMessage) return interaction.reply({
                content: `Sorry, there is already a player in this guild.\n[Click to access it](${playerMessage.url})`,
                ephemeral: true
            })
        }

        const MusicOptionEmojis = {
            shuffle: "🔀",
            queueLoop: "🔁",
            songLoop: "🔂",
        }
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `💿 ${interaction.guild.name}'s platines`,
                iconURL: interaction.guild.iconURL() || undefined,
            })
        ;

        const updatePlayerMessage = (id: string) => platines.updateSettings(s => s.settings.player = {
            channel: interaction.channelId,
            message: id
        })
        const componentInteractionMade = async (i: ButtonInteraction) => {
            await i.deferUpdate()

            this.componentInteraction(platines, i).then(option => {
                if(option === "discard") return destroyPlayer()
            })
        }
        const updateInteractionHandler = (m: Message) => (
            m.awaitMessageComponent({componentType: ComponentType.Button})
            .then(b => componentInteractionMade(b))
            .catch(() => undefined)
        )
        
        const stick = !!interaction.options.getBoolean("stick")
        if(stick) embed.setFooter({
            text: stickPlayersFooterMessage
        })
        await interaction.deferReply({ephemeral: stick}).then(async () => (
            interaction.fetchReply().then(({id}) => updatePlayerMessage(id))
        ))

        async function onTrackChanged(video: string | YouTubeVideo, id: number) {
            if(!platines) return
            const { options, queue } = (await platines.settings).music

            const details = typeof video === "string" ? await getVideoInfos(video) : video
            const author = await platines.lasido.users.fetch(queue[id].author)
            embed.setTitle(`${
                options.loop.active ? (
                    options.loop.loop_type === "queue" ? MusicOptionEmojis.queueLoop : MusicOptionEmojis.songLoop
                ) : ""
            }${
                options.shuffle ? MusicOptionEmojis.shuffle : "▶️"
            } Playing ${details.title}`)
            embed.setURL(details.url)
            embed.setImage(details.thumbnails.at(-1)?.url || null)
            embed.setFields(
                {name: "Duration", value: new Date(details.durationInSec * 1000).toLocaleTimeString(new Intl.Locale("fr"), {timeStyle: "medium"})},
                {name: "Author", value: `[${details.channel?.name}](${details.channel?.url})`},
                {name: "Position", value: `${id + 1} of ${queue.length}`},
                {name: "Added by", value: author.toString()}
            )
            const thumbnailURL = details.thumbnails.at(-1)?.url
            if(thumbnailURL) {
                const color = await getAverageColor(thumbnailURL)
                embed.setColor(hex_to_int(color.hex))
            }
        }
        async function onStateChanged(state: "pause" | "playing") {
            if(state === "pause") {
                embed
                    .setTitle("⏸️ Currently paused.")
                    .setURL(null)
                    .setFields()
                    .setImage(null)
                ;
            }else {
                if(!platines) return
                const { queue, active_track } = (await platines.settings).music
                const infos = await fromQueueType(queue[active_track]).then(t => convertToYoutube(t))
                if(!infos) return destroyPlayer()
                return onTrackChanged(infos, active_track)
            }
        }

        let lastMessage: Message | undefined = undefined;
        const getComponents = () => this.getComponents(platines)
        async function destroyPlayer() {
            if(lastMessage) lastMessage.delete().catch(() => undefined)
            interaction.deleteReply().catch(() => undefined)
            platines?.updateSettings(s => s.settings.player = undefined)
        }
        async function editMessage() {
            const messageContent: InteractionReplyOptions | MessageEditOptions = {
                content: "Please note that this command is in beta-test for now!",
                embeds: [embed], 
                components: await getComponents(),
                ephemeral: false
            }

            if(!platines) return destroyPlayer()
            const { settings } = await platines.settings
            
            if(stick) {
                if(!lastMessage) await interaction.editReply("The sticky player has been created.")
                else if(lastMessage.id !== settings.player?.message) return destroyPlayer()
                
                interaction.followUp(messageContent)?.then(async (message) => {
                    if(lastMessage) lastMessage.fetch().then((m) => m.delete()).catch(() => undefined)
                    await updateInteractionHandler(message)
                    await updatePlayerMessage(message.id)
                    lastMessage= message
                })
            }else interaction.editReply(messageContent).then(async message => {
                if(message.id !== settings.player?.message) return destroyPlayer()
                
                await updateInteractionHandler(message)
            }).catch(() => destroyPlayer())
        }

        const settingsUpdated = () => platines.status === "Playing" ? onStateChanged("playing").then(editMessage) : undefined
        platines.on("trackChange", (video, id) => onTrackChanged(video, id).then(editMessage))
        platines.on("queueChange", settingsUpdated)
        platines.on("shuffleChange", settingsUpdated)
        platines.on("loopChange", settingsUpdated)
        platines.on("paused", () => onStateChanged("pause").then(editMessage))
        platines.on("stop", () => onStateChanged("pause").then(editMessage))
        platines.on("resumed", () => onStateChanged("playing").then(editMessage))
        platines.on("destroy", () => destroyPlayer())
        this.lasido.on("playerUpdate", (guildId) => interaction.guildId === guildId ? editMessage() : undefined)

        return onStateChanged(
            platines.status === "Playing" ? "playing" : "pause"
        ).then(editMessage)
    }
}