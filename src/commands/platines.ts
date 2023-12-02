import { Lasido } from "../_main";
import BotCommand, { BotCommandGroup } from "../types/CommandClass";
import { ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputCommandInteraction, Guild, GuildMember } from "discord.js";
import BotSubCommand from "../types/SubCommandClass";
import PlatinesPauseResume from "./platines/pause_resume";
import PlatinesNext from "./platines/next";
import PlatinesPrevious from "./platines/previous";
import PlatineNowPlaying from "./platines/nowplaying";
import PlatinesPlay from "./platines/play";
import PlatineQueue from "./platines/queue";
import PlatinesStop from "./platines/stop";
import PlatineShuffle from "./platines/shuffle";
import PlatinePlayer from "./platines/player";
import PlatinesLoop from "./platines/loop";
import PlatinesJump from "./platines/jump";
import PlatinesDelete from "./platines/delete";
import PlatinesClear from "./platines/clear";

export default class BotPlatines extends BotCommandGroup {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "platines",
            description: "Controls your music",
            dmPermission: false
        }, [
            PlatinesPauseResume, PlatinesNext, PlatinesPrevious, PlatineNowPlaying,
            PlatinesPlay, PlatineQueue, PlatinesStop, PlatineShuffle, PlatinePlayer,
            PlatinesLoop, PlatinesJump, PlatinesDelete, PlatinesClear
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
}