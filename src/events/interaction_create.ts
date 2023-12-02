import { Lasido } from "../_main";
import BotEvent from "../types/EventClass";
import { BaseInteraction } from "discord.js"

export default class UserInteraction extends BotEvent {
    constructor(lasido: Lasido) {
        super(
            lasido,
            "interactionCreate"
        )
    }

    async handle(interaction: BaseInteraction, ...args: any[]) {
        if(interaction.isChatInputCommand()) {
            const command= this.lasido.commands.find(cmd => cmd.command_informations.name == interaction.commandName)
            if(!command) {
                interaction.reply({content: "Oups... This command has no handler.", ephemeral: true})
            }else {
                if(!(command.mp || interaction.inGuild())) return interaction.reply({content: "Sorry, this command is not enabled in mp."})
                command.execute(interaction, ...args).catch((err) => {
                    console.error("------  [!]> LASIDO ERROR  ----------");
                    console.error(err);
                    console.error("-------------------------------------");
                })
            }
        }else return
    }
}