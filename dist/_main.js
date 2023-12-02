"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lasido = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const discord_js_1 = __importDefault(require("discord.js"));
const _settings_json_1 = __importDefault(require("../database/_settings.json"));
const path_1 = __importDefault(require("path"));
const dynamic_imports_1 = require("./utils/dynamic_imports");
const setPlayDLTokens_1 = require("./utils/setPlayDLTokens");
const package_json_1 = __importDefault(require("../package.json"));
class Lasido extends discord_js_1.default.Client {
    commands;
    events;
    root;
    settings = _settings_json_1.default;
    package = package_json_1.default;
    constructor() {
        super({
            intents: ["GuildVoiceStates", "GuildMembers", "Guilds", "GuildMessages"]
        });
        this.commands = [];
        this.events = [];
        this.root = __dirname;
    }
    async setupCommands() {
        this.commands = [];
        const commands_path = path_1.default.join(this.root, _settings_json_1.default.directories.commands);
        const modules = await (0, dynamic_imports_1.rec_dyn_import)(commands_path);
        for (const mod of modules) {
            const command = new mod.default(this);
            console.log(`[?] Command <${command.command_informations.name}> has been saved!`);
            this.commands.push(command);
        }
    }
    async setupEvents() {
        this.events = [];
        const events_path = path_1.default.join(this.root, _settings_json_1.default.directories.evens);
        const modules = await (0, dynamic_imports_1.rec_dyn_import)(events_path);
        for (const mod of modules) {
            const event = new mod.default(this);
            console.log(`[?] Event <${event.id}> has been saved!`);
            this.events.push(event);
        }
    }
    async updateCommands() {
        if (!this.application?.commands)
            return;
        console.log("[?] Starting command updatement");
        console.log("[?]> Deleting existing commands...");
        for await (const [_, existingCommand] of this.application.commands.cache) {
            await this.application.commands.delete(existingCommand);
        }
        console.log("[?]> Registering commands...");
        const guildedCommands = this.commands.filter(c => c.guilded);
        const globalCommands = this.commands.filter(c => !c.guilded);
        await this.application.commands.set(globalCommands.map(c => c.command_informations));
        console.log("[?]> Global commands saved.");
        const guilds = new Set(guildedCommands.map(c => c.guilded));
        for await (const guild_id of guilds.values()) {
            const cmds = guildedCommands.filter(c => c.guilded === guild_id);
            await this.application.commands.set(cmds.map(c => c.command_informations), guild_id);
        }
        console.log("[?]> Guilded commands saved.");
        console.log("[?] Finished the commands updatement.");
    }
    async registerEvents() {
        for (const e of this.events) {
            this.removeAllListeners(e.id);
            this.on(e.id, (...args) => e.handle(...args));
        }
    }
    async launch(token, reload_commands = false) {
        await this.setupCommands();
        await this.setupEvents();
        await this.registerEvents();
        await this.login(token);
        if (reload_commands)
            await this.updateCommands();
    }
}
exports.Lasido = Lasido;
const TOKEN = process.env.DISCORD_TOKEN;
if (TOKEN) {
    const robot = new Lasido();
    (async () => {
        console.log("[?] Setting up dependencies...");
        await (0, setPlayDLTokens_1.setTokens)();
        console.log("[?] Finished. Launching robot...");
        await robot.launch(TOKEN, process.argv.includes("--update-cmds"));
    })();
}
else
    console.error("TOKEN HAS NOT BEEN FOUND.");
