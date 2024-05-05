import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import play, { DeezerAlbum, DeezerPlaylist, DeezerTrack, SoundCloudPlaylist, SoundCloudTrack, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack, YouTubePlayList, YouTubeVideo } from "play-dl";
import { getInfosEmbed } from "../../utils/music/tracks";
import { getPlatines } from "../../utils/music/platines";
import { createVoice, getVoice } from "../../utils/music/voice";
import { getPlaylist } from "../../utils/music/playlists";
import * as converter from "../../utils/music/converter"

export default class PlatinesPlay extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "play",
            description: "Play music",
            options: [
                {name: "query", description: "Video URL, Spotify/Deezer/Soundcloud URL, Video searching keywords", type: ApplicationCommandOptionType.String, required: true},
                {name: "play-next", description: "Set this option to true if you want to insert the song(s) just after the current playing one", type: ApplicationCommandOptionType.Boolean}
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        await interaction.deferReply({ ephemeral: true })

        if(!getVoice(interaction.guild)) {
            const member = interaction.member as GuildMember

            const channel= member.voice.channel
            if(!channel) return interaction.editReply({
                content: "You must be connected to a guild's voice channel to do this command.",
            })
            if(!channel.joinable) return interaction.editReply({
                content: "This channel is unreachable for me.",
            })

            createVoice(channel)
        }
        
        const platines = getPlatines(this.lasido, interaction.guild)
        if(!platines) return;

        const query = interaction.options.getString("query", true)
        const query_type = await play.validate(query)
        
        const medias: (YouTubeVideo | SpotifyTrack | SoundCloudTrack | DeezerTrack)[] = [];
        switch (query_type) {
            case "yt_video": {
                medias.push(await (
                    converter.convertToYoutubeVideos(query).then(r => r[0] as YouTubeVideo)
                ))
                break;
            }
            case "dz_track": {
                medias.push(await play.deezer(query) as DeezerTrack)
                break;
            }
            case "sp_track": {
                medias.push(await play.spotify(query) as SpotifyTrack)
                break;
            }
            case "so_track": {
                medias.push(await play.soundcloud(query) as SoundCloudTrack)
                break;
            }
            case "search": {
                const results = await play.search(query, {source: {youtube: "video"}, limit: 1})
                medias.push(results[0])
                break;
            }
            default: {
                interaction.editReply({
                    content: "Searching for your playlist/album..."
                })
                const infos = await getPlaylist(query)
                if(!infos) return interaction.editReply({
                    content: "The playlist/album you given isn't valid."
                })

                const name = "name" in infos ? infos.name : infos.title
                const tracksNumber = "tracksCount" in infos ? infos.tracksCount : infos.videoCount
                if(!tracksNumber) return interaction.editReply({
                    content: "This playlist is empty..."
                })

                interaction.editReply({
                    content: `Found \`${tracksNumber}\` tracks in ${infos.type} __${name}__.`
                })
                medias.push(...await ("all_videos" in infos ? infos.all_videos() : infos.all_tracks()))
            }
        }

        if(!medias.length) return interaction.editReply({
            content: "Youps: I didn't found this media.",
        })

        const insertNext = interaction.options.getBoolean("play-next");

        ;(async() => {
            let inserted = 0;
            const currentIndex = insertNext ? Math.max(0, (await platines.settings).music.active_track) + 1 : undefined;

            while(inserted < medias.length) {
                const media = medias[inserted];

                const insertIndex = (
                    currentIndex === undefined || platines.status !== "Playing"
                ) ? undefined : currentIndex + inserted;
                await platines.addToQueue(interaction.user, media, insertIndex);
                converter.convertToYoutubeVideos(media);

                inserted++
            }
        })()

        // To avoid searching for the first media as it will not be used
        if(medias.length > 1 && platines.status === "Playing") return interaction.followUp({
            content: `${interaction.user.toString()} added ${medias.length} songs to queue.`,
        })
        
        const firstMedia = await converter.convertToYoutubeVideos(medias[0]).then(m => m[0])
        if(!(firstMedia instanceof YouTubeVideo)) return interaction.editReply({
            content: "Oups... An error occured."
        })
        const embed = await getInfosEmbed(firstMedia)
        embed.setFooter({
            text: `Use '/platines play' to do the same!`
        })
        interaction.deleteReply().catch(() => undefined)

        if(platines.status !== "Playing") {
            await platines.playTrack(-medias.length) // <- plays the first item of `media`
            
            return interaction.channel?.send({
                content: `${interaction.user.toString()} started the player!`,
                embeds: [embed]
            })
        }
        else return interaction.channel?.send({
            content: `${interaction.user.toString()} added a song to queue.`,
            embeds: [embed]
        })
    }
}