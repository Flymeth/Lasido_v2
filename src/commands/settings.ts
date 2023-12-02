import { ApplicationCommandOptionType, ApplicationCommandSubCommandData, ApplicationCommandType, CacheType, ChatInputApplicationCommandData, ChatInputCommandInteraction } from "discord.js";
import { Lasido } from "../_main";
import BotCommand, { BotCommandGroup } from "../types/CommandClass";
import SettingsDJGroup from "./settings/dj/_index";
import SettingsBroadcastGroup from "./settings/broadcast/_index";
import { getSettings } from "../utils/settings";

export default class BotSettings extends BotCommand {
    command_groups: BotCommandGroup[]

    constructor(lasido: Lasido) {
        const groups: BotCommandGroup[] = [
            SettingsDJGroup, SettingsBroadcastGroup
        ].map(c => new c(lasido))

        super(lasido, {
            name: "settings",
            description: "Update your server's settings",
            type: ApplicationCommandType.ChatInput,
            options: groups.map(grp => ({
                name: grp.command_informations.name,
                description: (grp.command_informations as ChatInputApplicationCommandData).description,
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: (grp.command_informations as ChatInputApplicationCommandData).options as ApplicationCommandSubCommandData[] || []
            }))
        })

        this.command_groups = groups
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const memberPermission = interaction.memberPermissions
        if(!memberPermission?.has("ManageGuild")) return interaction.reply({
            content: "Sorry: you do not have the permission to edit the server's settings.",
            ephemeral: true
        })

        const { dj } = (await getSettings(interaction.guild)).settings
        if(dj.active && dj.role && !interaction.member?.roles.valueOf().hasOwnProperty(dj.role)) return interaction.reply({
            content: "You must be a DJ to perfom this action (regardless of your server's permissions).",
            ephemeral: true
        })

        const group = interaction.options.getSubcommandGroup(true)
        const command = this.command_groups.find(cmd => cmd.command_informations.name === group)
        if(!command) return interaction.reply({
            content: "This setting has not been found.",
            ephemeral: true
        })

        return command.execute(interaction, ...args)
    }
}