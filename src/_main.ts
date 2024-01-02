import { config } from "dotenv"
config()

import Discord from "discord.js"
import settings from "../database/_settings.json"
import path from "path"
import { BotCommandType } from "./types/CommandClass"
import { BotEventType } from "./types/EventClass"
import { rec_dyn_import } from "./utils/dynamic_imports"
import { setTokens } from "./utils/setPlayDLTokens"
import package_informations from "../package.json";

export class Lasido extends Discord.Client {
    commands: BotCommandType[]
    events: BotEventType[]
    root: string

    settings= settings
    package= package_informations
    constructor() {
        super({
            intents: ["GuildVoiceStates", "GuildMembers", "Guilds", "GuildMessages"]
        })
        this.commands= []
        this.events  = []
        this.root= __dirname
    }

    async setupCommands() {
        this.commands= []
        const commands_path= path.join(this.root, settings.directories.commands)
        const modules = await rec_dyn_import<{default: typeof BotCommandType}>(commands_path)
        for(const mod of modules) {
            const command = new mod.default(this)
            console.log(`[?] Command <${command.command_informations.name}> has been found!`);
            
            this.commands.push(command)
        }
    }
    async setupEvents() {
        this.events= []
        const events_path= path.join(this.root, settings.directories.evens)
        const modules = await rec_dyn_import<{default: typeof BotEventType}>(events_path)
        for(const mod of modules) {
            const event = new mod.default(this)
            console.log(`[?] Event <${event.id}> has been found!`);
            
            this.events.push(event)
        }
    }

    async updateCommands() {
        if(!this.application?.commands) return
        console.log("[?] Starting command updatement");
        
        console.log("[?]> Deleting existing commands...");
        // todo Use the "appCommand.equals()" to avoid deleting the commands that haven't changed.
        const existingCommands = await this.application.commands.fetch()
        for await(const existingCommand of Array.from(existingCommands.values())) {
            await this.application.commands.delete(existingCommand)
        }
        
        console.log("[?]> Registering commands...");
        
        const guildedCommands = this.commands.filter(c => c.guilded)
        const globalCommands = this.commands.filter(c => !c.guilded)

        await this.application.commands.set(globalCommands.map(c => c.command_informations))
        console.log("[?]> Global commands saved.");

        const guilds = Array.from(new Set<string>(guildedCommands.map(c => c.guilded as string)))
        for await(const guild_id of guilds) {
            const cmds = guildedCommands.filter(c => c.guilded === guild_id)
            await this.application.commands.set(cmds.map(c => c.command_informations), guild_id)
        }
        console.log("[?]> Guilded commands saved.");

        console.log("[?] Finished the commands updatement.");
    }
    async registerEvents() {
        for(const e of this.events) {
            this.removeAllListeners(e.id)
            this.on(e.id, (...args: any[]) => e.handle(...args))
        }
    }

    async launch(token: string, reload_commands= false) {
        await this.setupCommands()
        await this.setupEvents()
        await this.registerEvents()
        await this.login(token)
        
        //* Bot must be logined to update commands
        if(reload_commands) await this.updateCommands()
    }
}

const TOKEN= process.env.DISCORD_TOKEN
if(TOKEN) {
    const robot = new Lasido()

    ;(async() => {
        console.log("[?] Setting up dependencies...");
        await setTokens()
        
        console.log("[?] Finished. Launching robot...");
        await robot.launch(TOKEN, process.argv.includes("--update-cmds"))
    })()
}else console.error("TOKEN HAS NOT BEEN FOUND.");