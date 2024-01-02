import { ActivitiesOptions, ActivityType, Collection, VoiceBasedChannel } from "discord.js";
import { Lasido } from "../_main";
import BotEvent from "../types/EventClass";
import { createVoice } from "../utils/music/voice";
import { getSettings, updateSettings } from "../utils/settings";

export default class BotIsReady extends BotEvent {
    private currentActivityIndex = -1
    activities: (() => Promise<ActivitiesOptions>)[] = [
        async() => ({
            name: `on ${this.lasido.guilds.cache.size} servers.`,
            type: ActivityType.Listening
        }),
        async() => ({
            name: `Flymeth on flymeth.net!`,
            type: ActivityType.Watching,
            url: "https://flymeth.net"
        }),
        async() => ({
            name: `on version ${this.lasido.package.version}.`,
            type: ActivityType.Playing
        })
    ]
    constructor(lasido: Lasido) {
        super(lasido, "ready")
    }

    private async changeActivity() {
        this.currentActivityIndex= (this.currentActivityIndex + 1) % this.activities.length

        const activityInformations = await this.activities.at(this.currentActivityIndex)?.();
        if(activityInformations) this.lasido.user?.setPresence({
            activities: [activityInformations]
        })
        setTimeout(() => this.changeActivity(), 10_000);
    }

    async handle(...args: any[]): Promise<void> {
        console.log(`[?] <${this.lasido.user?.username}> version [${this.lasido.package.version}] is ready to be used!`);
        this.changeActivity()

        const connectedVoiceChannel = this.lasido.channels.cache.filter(ch => ch.isVoiceBased() && ch.members.get(this.lasido.user?.id || "")) as Collection<string, VoiceBasedChannel>
        connectedVoiceChannel.forEach(ch => createVoice(ch))

        const guilds = await this.lasido.guilds.fetch().then(col => Array.from(col.values()))
        for(const guild of guilds) {
            const {settings: { player }} = await getSettings(guild)
            if(player) {
                this.lasido.channels.fetch(player.channel).then(channel => {
                    if(!channel?.isTextBased()) return;
                    channel.messages.fetch(player.message)
                        .then(m => !m.delete())
                        .catch(() => undefined)
                }).catch(() => undefined)

                updateSettings(guild, (current) => current.settings.player = undefined)
            }
        }
    }
}