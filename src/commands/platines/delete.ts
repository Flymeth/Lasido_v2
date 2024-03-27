import { APIButtonComponent, ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonComponent, ButtonStyle, CacheType, ChatInputCommandInteraction, ComponentType, MessageActionRowComponent, MessageActionRowComponentBuilder } from "discord.js";
import { Lasido } from "../../_main";
import BotSubCommand from "../../types/SubCommandClass";
import { getPlatines } from "../../utils/music/platines";
import { getSettings, updateSettings } from "../../utils/settings";

export default class PlatinesDelete extends BotSubCommand {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "delete",
            description: "Delete a track from the queue",
            options: [{
                name: "track-id",
                description: "The track index you want to delete (default to the current playing track)",
                type: ApplicationCommandOptionType.Integer
            }]
        })
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>, ...args: any[]): Promise<any> {
        if(!interaction.guild) return
        const platines = getPlatines(this.lasido, interaction.guild)
        const index = interaction.options.getInteger("track-id")
        if(!platines) {
            if(typeof index === "number") updateSettings(interaction.guild, (s) => s.music.queue.splice(index, 1))
            else return interaction.reply({
                content: "I'm not playing anything: you must indidate the track's index.",
                ephemeral: true
            })
        }else {
            const { active_track } = (await platines.settings).music

            const id = (index ?? active_track + 1) -1
            platines.remFromQueue(id)

            if(
                index === active_track 
                && platines.status === "Playing"
            ) platines.next()
        }

        return interaction.reply({content: "done!"})
    }
}