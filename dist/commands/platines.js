"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = require("../types/CommandClass");
const pause_resume_1 = __importDefault(require("./platines/pause_resume"));
const next_1 = __importDefault(require("./platines/next"));
const previous_1 = __importDefault(require("./platines/previous"));
const nowplaying_1 = __importDefault(require("./platines/nowplaying"));
const play_1 = __importDefault(require("./platines/play"));
const queue_1 = __importDefault(require("./platines/queue"));
const stop_1 = __importDefault(require("./platines/stop"));
const shuffle_1 = __importDefault(require("./platines/shuffle"));
const player_1 = __importDefault(require("./platines/player"));
const loop_1 = __importDefault(require("./platines/loop"));
const jump_1 = __importDefault(require("./platines/jump"));
const delete_1 = __importDefault(require("./platines/delete"));
const clear_1 = __importDefault(require("./platines/clear"));
const volume_1 = __importDefault(require("./platines/volume"));
class BotPlatines extends CommandClass_1.BotCommandGroup {
    constructor(lasido) {
        super(lasido, {
            name: "platines",
            description: "Controls your music",
            dmPermission: false
        }, [
            pause_resume_1.default, next_1.default, previous_1.default, nowplaying_1.default,
            play_1.default, queue_1.default, stop_1.default, shuffle_1.default, player_1.default,
            loop_1.default, jump_1.default, delete_1.default, clear_1.default, volume_1.default
        ]);
    }
    async allowExecution(interaction, ...args) {
        if (interaction.guild?.members.me?.voice.channelId
            && interaction.guild.members.me.voice.channelId !== interaction.member.voice.channelId) {
            interaction.reply({
                content: `You must be connected to the same voice channel as me to use the platines commands.\n> Quick join: ${interaction.guild.members.me.voice.channel?.toString()}`
            });
            return false;
        }
    }
}
exports.default = BotPlatines;
