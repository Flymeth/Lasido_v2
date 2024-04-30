import { Lasido } from "../_main";
import { BotCommandGroup } from "../types/CommandClass";
import { CacheType, ChatInputCommandInteraction, GuildMember } from "discord.js";
import PlatinesPauseResume from "./platines/pause_resume";
import PlatinesNext from "./platines/next";
import PlatinesPrevious from "./platines/previous";
import PlatineNowPlaying from "./platines/nowplaying";
import PlatinesPlay from "./platines/play";
import PlatinesStop from "./platines/stop";
import PlatineShuffle from "./platines/shuffle";
import PlatinePlayer from "./platines/player";
import PlatinesLoop from "./platines/loop";
import PlatinesJump from "./platines/jump";
import PlatinesDelete from "./platines/delete";
import PlatinesClear from "./platines/clear";
import PlatinesVolume from "./platines/volume";
import PlatinesPlayFile from "./platines/playFile";
import { getSettings, updateSettings } from "../utils/settings";

export default class BotPlatines extends BotCommandGroup {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "platines",
            description: "Controls your music",
            dmPermission: false
        }, [
            PlatinesPauseResume, PlatinesNext, PlatinesPrevious, PlatineNowPlaying,
            PlatinesPlay, PlatinesStop, PlatineShuffle, PlatinePlayer,
            PlatinesLoop, PlatinesJump, PlatinesDelete, PlatinesClear, PlatinesVolume,
            PlatinesPlayFile
        ])
    }

    async allowExecution(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<boolean | undefined> {
        // If the bot is already connected to a vocal, the user must be connected to the same vocal
        if(
            interaction.guild?.members.me?.voice.channelId
            && interaction.guild.members.me.voice.channelId !== (interaction.member as GuildMember).voice.channelId
        ) {
            interaction.reply({
                content: `You must be connected to the same voice channel as me to use the platines commands.\n> Quick join: ${interaction.guild.members.me.voice.channel?.toString()}`
            })
            return false
        }
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return;
        const { settings } = await getSettings(interaction.guild)

        if(!settings.broadcast.channel) updateSettings(interaction.guild, c => c.settings.broadcast.channel = interaction.channelId)

        super.execute(interaction, ...args)
    }
}