import { VoiceState } from "discord.js";
import { Lasido } from "../_main";
import BotEvent from "../types/EventClass";
import { getPlatines } from "../utils/music/platines";

export default class VoiceStateChange extends BotEvent {
    constructor(lasido: Lasido) {
        super(lasido, "voiceStateUpdate")
    }

    async handle(oldState: VoiceState, newState: VoiceState, ...args: any[]): Promise<any> {
        if(!newState.channelId) {
            if(
                newState.member?.id === this.lasido.user?.id
                || (oldState.channel?.members.size || 0) < 2
            ) getPlatines(this.lasido, newState.guild)?.destroy()
        }
    }
}