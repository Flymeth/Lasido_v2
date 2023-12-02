"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventClass_1 = __importDefault(require("../types/EventClass"));
const platines_1 = require("../utils/music/platines");
class VoiceStateChange extends EventClass_1.default {
    constructor(lasido) {
        super(lasido, "voiceStateUpdate");
    }
    async handle(oldState, newState, ...args) {
        if (!newState.channelId) {
            if (newState.member?.id === this.lasido.user?.id
                || (oldState.channel?.members.size || 0) < 2)
                (0, platines_1.getPlatines)(this.lasido, newState.guild)?.destroy();
        }
    }
}
exports.default = VoiceStateChange;
