import { Message } from "discord.js";
import { Lasido } from "../_main";
import BotEvent from "../types/EventClass";
import { getSettings, settingsGenerated, updateSettings } from "../utils/settings";
import { stickPlayersFooterMessage } from "../commands/platines/player";

const otherMusicBotIds = [
    "760027263046909992",
    "184405311681986560"
]
let timesAskedForUsingMe = 0
export default class BotMessageEvent extends BotEvent {
    constructor(lasido: Lasido) {
        super(lasido, "messageCreate")
    }

    async handle(msg: Message, ...args: any[]): Promise<any> {
        if(!msg.guildId) return
        
        if(msg.interaction && otherMusicBotIds.includes(msg.author.id)) {
            if(!timesAskedForUsingMe) {
                msg.channel.send({
                    content: "Hey! Don't forget I'm here too 🥺...",
                }).then(m => setTimeout(() => m.delete(), 5000)).catch(() => undefined)
            }
            timesAskedForUsingMe= (timesAskedForUsingMe + 1) % Math.max(this.lasido.guilds.cache.size, 5)
        }

        // Edit player message (if sticky)
        const { guildId, channelId } = msg
        if(await settingsGenerated(guildId)) {
            const { player } = (await getSettings(guildId)).settings
            if(
                player // Must have a player
                && (msg.author.id !== this.lasido.user?.id // It's not a lasido's message
                    || msg.embeds.at(0)?.footer?.text !== stickPlayersFooterMessage // It's not the lasido's player message
                )
            ) {
                const message = await this.lasido.channels.fetch(player.channel).then(async (channel) => {
                    if(!channel?.isTextBased()) return
                    return channel.messages.fetch(player.message)
                }).catch(() => undefined)
                if(!message) return updateSettings(msg.guildId, (s) => s.settings.player= undefined)
                if(message.channelId === channelId) return this.lasido.emit(`playerUpdate`, guildId)
            }
        }
    }
}