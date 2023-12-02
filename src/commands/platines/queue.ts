import { ChatInputCommandInteraction, CacheType, ApplicationCommandType, Guild, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentBuilder, ActionRowData, ButtonComponentData, MessageActionRowComponentBuilder, ComponentType, GuildMember, User, Integration } from "discord.js";
import { Lasido } from "../../_main";
import { getSettings } from "../../utils/settings";
import playdl, { YouTubeVideo } from "play-dl";
import { convertToYoutube, fromQueueType, getVideoInfos } from "../../utils/music/tracks";
import { getPlatines } from "../../utils/music/platines";
import BotSubCommand from "../../types/SubCommandClass";
import { hex_to_int } from "../../utils/colors";
import getTime from "../../utils/time";

export default class PlatineQueue extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "queue",
            description: "Get the current guild's queue",
        })
    }
    
    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const {music: { queue }} = await getSettings(interaction.guild)
        if(!queue.length) return interaction.reply({content: "The queue is empty for this guild. Start adding tracks with the `/platines play` command."})
        
        await interaction.deferReply()
        const MAX_FIELDS_PER_EMBED = 10
        const tracks: {author: GuildMember | User, video: YouTubeVideo}[][] = new Array(Math.ceil(queue.length / MAX_FIELDS_PER_EMBED)).fill(undefined).map(() => [])

        let index = 0
        let totalTime = 0
        while(index < queue.length) {
            const matrixIndex = Math.floor(index / MAX_FIELDS_PER_EMBED)
            const infos = queue[index]
            const video = await fromQueueType(infos).then(i => convertToYoutube(i))
            if(!video) continue;
            const author = await this.lasido.users.fetch(infos.author)
            tracks[matrixIndex].push({ author, video })
            
            totalTime+= video.durationInSec
            index++
        }

        const embedInformations = {
            current: 0,
            pages: tracks.length,
            totalTime
        }

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.guild.name}'s queue`)
            .setColor(hex_to_int(this.lasido.settings.colors.primary))
        ;
        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        const platines = getPlatines(this.lasido, interaction.guild)

        async function buildEmbed() {
            const pageTracks = tracks[embedInformations.current]
            const indexRanges = new Array(2).fill(embedInformations.current * MAX_FIELDS_PER_EMBED).map((v, i) => v + pageTracks.length * i)
            const currentTrackIndex = (await platines?.settings)?.music.active_track

            embed.setFields(pageTracks.map(({ author, video }, index) => {
                const globalIndex = indexRanges[0] + index
                const isMain = platines?.status !== "Idle" && globalIndex === currentTrackIndex

                return {
                    name: `\`#${globalIndex +1}\` - ` + (isMain ? "🎵 " : "") + `[${getTime(video.durationInSec * 1000).toString()}] ${video.title}`,
                    value: `Added by ${author.toString()}\n[Track Source](${video.url})\nDuration: ${getTime(video.durationInSec * 1000).toString()}`,
                }
            }))
            .setDescription(
                `Page ${embedInformations.current +1} of ${embedInformations.pages}`
                + `\nTracks ${indexRanges[0] +1} to ${indexRanges[1]} of ${queue.length}`
                + `\nTotal queue time: ${getTime(embedInformations.totalTime * 1000).toString()}`
            )
        }
        async function buildRow() {
            const previousButton = new ButtonBuilder()
                .setCustomId("previous")
                .setDisabled(embedInformations.current <= 0)
                .setStyle(ButtonStyle.Primary)
                .setEmoji("⬅️")
            ;
            const hideButton = new ButtonBuilder()
                .setCustomId("hide")
                .setEmoji("✖️")
                .setStyle(ButtonStyle.Danger)
            ;
            const nextButton = new ButtonBuilder()
                .setCustomId("next")
                .setDisabled(embedInformations.current +1 >= embedInformations.pages)
                .setStyle(ButtonStyle.Primary)
                .setEmoji("➡️")
            ;

            const currentTrack = (await platines?.settings)?.music.active_track
            if(typeof currentTrack === "number") {
                const currentTrackPage = Math.floor(currentTrack / MAX_FIELDS_PER_EMBED)

                const currentButton = new ButtonBuilder()
                    .setCustomId("current")
                    .setEmoji("🎵")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(currentTrackPage === embedInformations.current)
                ;
                row.setComponents(previousButton, hideButton, currentButton, nextButton)
            }else row.setComponents(previousButton, hideButton, nextButton)
        }

        async function editReply() {
            await buildEmbed()
            await buildRow()

            interaction.editReply({
                content: "",
                embeds: [embed],
                components: [row]
            })
            .catch(() => undefined)
            .then(message => {
                message?.awaitMessageComponent({componentType: ComponentType.Button, time: 60_000}).then(async (button) => {
                    const { customId } = button
                    switch (customId) {
                        case "previous": {
                            embedInformations.current--
                            break;
                        }
                        case "next": {
                            embedInformations.current++
                            break;
                        }
                        case "current": {
                            const currentTrack = (await platines?.settings)?.music.active_track
                            if(typeof currentTrack === "number") embedInformations.current = Math.floor(currentTrack / MAX_FIELDS_PER_EMBED)
                            break;
                        }
                        default:
                            return interaction.deleteReply()
                    }
                    return button.deferUpdate().then(editReply)
                }).catch(() => 
                    interaction.editReply({content: "", embeds: [embed], components: []}).catch(() => undefined)
                )
            })
        }
        return editReply()
    }
}