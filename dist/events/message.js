"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventClass_1 = __importDefault(require("../types/EventClass"));
const settings_1 = require("../utils/settings");
const player_1 = require("../commands/platines/player");
class BotMessageEvent extends EventClass_1.default {
    constructor(lasido) {
        super(lasido, "messageCreate");
    }
    async handle(msg, ...args) {
        if (!msg.guildId)
            return;
        const { guildId, channelId } = msg;
        if (await (0, settings_1.settingsGenerated)(guildId)) {
            const { player } = (await (0, settings_1.getSettings)(guildId)).settings;
            if (player
                && (msg.author.id !== this.lasido.user?.id
                    || msg.embeds.at(0)?.footer?.text !== player_1.stickPlayersFooterMessage)) {
                const message = await this.lasido.channels.fetch(player.channel).then(async (channel) => {
                    if (!channel?.isTextBased())
                        return;
                    return channel.messages.fetch(player.message);
                }).catch(() => undefined);
                if (!message)
                    return (0, settings_1.updateSettings)(msg.guildId, (s) => s.settings.player = undefined);
                if (message.channelId === channelId)
                    return this.lasido.emit(`playerUpdate`, guildId);
            }
        }
    }
}
exports.default = BotMessageEvent;
