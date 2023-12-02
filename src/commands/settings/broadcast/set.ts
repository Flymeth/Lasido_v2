import { ChatInputCommandInteraction, CacheType, ApplicationCommandOptionType, ChannelType, GuildMember, CommandInteractionOption, CommandOptionChannelResolvableType, ApplicationCommandChannelOptionData, TextBasedChannel } from "discord.js";
import { Lasido } from "../../../_main";
import BotSubCommand from "../../../types/SubCommandClass";
import { setBroadcast } from "../../../utils/music/settings";

const allowedChannelsType: ApplicationCommandChannelOptionData["channel_types"] = [
    ChannelType.GuildText,
    ChannelType.GuildAnnouncement,
    ChannelType.GuildStageVoice,
    ChannelType.PublicThread,
    ChannelType.PrivateThread
]

export default class BroadcastSet extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "set",
            description: "Set the dj and its behaviors",
            options: [
                {
                    name: "channel",
                    description: "Set the broadcast's channel",
                    type: ApplicationCommandOptionType.Channel,
                    channel_types: allowedChannelsType
                }
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const channel = (
            interaction.options.getChannel("channel", false, allowedChannelsType)
        ) as TextBasedChannel || interaction.channel
        if(channel.isDMBased()) return interaction.reply({
            content: "This is an invalid channel (please provide a guild text-based channel).",
            ephemeral: true
        })

        const permissions = channel.permissionsFor(interaction.guild.members.me as GuildMember)
        if(!(permissions.has("SendMessages") && permissions.has("ViewChannel"))) return interaction.reply({
            content: "I've not access to this channel or I cannot send message in it.",
            ephemeral: true
        })
        
        setBroadcast(interaction.guild, {
            active: true,
            channel: channel.id
        })

        return interaction.reply({
            content: `Enable broadcast messages into ${channel.toString()}.`
        })
    }
}