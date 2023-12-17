"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const EventClass_1 = __importDefault(require("../types/EventClass"));
const voice_1 = require("../utils/music/voice");
const settings_1 = require("../utils/settings");
class BotIsReady extends EventClass_1.default {
    currentActivityIndex = -1;
    activities = [
        async () => ({
            name: `on ${this.lasido.guilds.cache.size} servers.`,
            type: discord_js_1.ActivityType.Listening
        }),
        async () => ({
            name: `Flymeth on flymeth.net!`,
            type: discord_js_1.ActivityType.Watching,
            url: "https://flymeth.net"
        }),
        async () => ({
            name: `on version ${this.lasido.package.version}.`,
            type: discord_js_1.ActivityType.Playing
        })
    ];
    constructor(lasido) {
        super(lasido, "ready");
    }
    async changeActivity() {
        this.currentActivityIndex = (this.currentActivityIndex + 1) % this.activities.length;
        const activityInformations = await this.activities.at(this.currentActivityIndex)?.();
        if (activityInformations)
            this.lasido.user?.setPresence({
                activities: [activityInformations]
            });
        setTimeout(() => this.changeActivity(), 10_000);
    }
    async handle(...args) {
        console.log(`[?] <${this.lasido.user?.username}> is ready to be used!`);
        this.changeActivity();
        const connectedVoiceChannel = this.lasido.channels.cache.filter(ch => ch.isVoiceBased() && ch.members.get(this.lasido.user?.id || ""));
        connectedVoiceChannel.forEach(ch => (0, voice_1.createVoice)(ch));
        const guilds = await this.lasido.guilds.fetch().then(col => Array.from(col.values()));
        for (const guild of guilds) {
            const { settings: { player } } = await (0, settings_1.getSettings)(guild);
            if (player) {
                this.lasido.channels.fetch(player.channel).then(channel => {
                    if (!channel?.isTextBased())
                        return;
                    channel.messages.fetch(player.message)
                        .then(m => !m.delete())
                        .catch(() => undefined);
                }).catch(() => undefined);
                (0, settings_1.updateSettings)(guild, (current) => current.settings.player = undefined);
            }
        }
    }
}
exports.default = BotIsReady;
