"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findVoice = exports.filterVoices = exports.getAllVoices = exports.voiceExists = exports.getVoice = exports.destroyVoice = exports.createVoice = exports.getMemberVoiceChannel = void 0;
const voice_1 = require("@discordjs/voice");
const cache = new Map();
function getMemberVoiceChannel(member) {
    if (!member.voice)
        return undefined;
    return member.voice.channel;
}
exports.getMemberVoiceChannel = getMemberVoiceChannel;
function createVoice(channel) {
    const connection = (0, voice_1.joinVoiceChannel)({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfMute: false,
    });
    const player = (0, voice_1.createAudioPlayer)({
        behaviors: {
            noSubscriber: voice_1.NoSubscriberBehavior.Pause,
        }
    });
    const subscription = connection.subscribe(player);
    const voice = { connection, player, subscription };
    cache.set(channel.guild, voice);
    return voice;
}
exports.createVoice = createVoice;
function destroyVoice(guild) {
    const voice = getVoice(guild);
    if (!voice)
        return false;
    const { connection, player } = voice;
    player.stop(true);
    connection.destroy();
    return cache.delete(guild);
}
exports.destroyVoice = destroyVoice;
function getVoice(guild) {
    return cache.get(guild);
}
exports.getVoice = getVoice;
function voiceExists(guild) {
    return cache.has(guild);
}
exports.voiceExists = voiceExists;
function getAllVoices() {
    return Array.from(cache).map(([guild, voice]) => ({ guild, voice }));
}
exports.getAllVoices = getAllVoices;
function filterVoices(predicate) {
    return getAllVoices().filter((v) => predicate(v.guild, v.voice));
}
exports.filterVoices = filterVoices;
function findVoice(predicate) {
    return getAllVoices().find(({ guild, voice }) => predicate(guild, voice));
}
exports.findVoice = findVoice;
