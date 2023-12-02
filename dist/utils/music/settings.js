"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBroadcast = exports.setDJ = exports.setLoop = exports.setShuffle = exports.setVolume = void 0;
const settings_1 = require("../settings");
function setVolume(guild, volume, platines) {
    if (volume < 0 || volume > 2)
        return;
    platines?.currentRessource?.volume?.setVolume(volume);
    (0, settings_1.updateSettings)(guild, s => {
        platines?.emit("volumeChange", s.music.options.volume, volume);
        s.music.options.volume = volume;
    });
}
exports.setVolume = setVolume;
function setShuffle(guild, type, saveCurrentTrackIndex, platines) {
    if (type === "one-time") {
        (0, settings_1.updateSettings)(guild, ({ music }) => {
            const active = music.queue[music.active_track];
            music.queue = music.queue
                .map(v => ({ v, k: Math.random() }))
                .sort(({ k: k1 }, { k: k2 }) => k2 - k1)
                .map(({ v }) => v);
            if (active && saveCurrentTrackIndex) {
                const index = music.queue.findIndex(item => (item.src === active.src
                    && item.id === active.id
                    && item.author === active.author));
                music.active_track = index;
            }
        });
        platines?.emit("queueChange");
    }
    else {
        (0, settings_1.getSettings)(guild).then(({ music: { options } }) => {
            const value = type === "activate";
            if (options.shuffle === value)
                return;
            (0, settings_1.updateSettings)(guild, s => {
                s.music.options.shuffle = value;
            });
            platines?.emit("shuffleChange", options.shuffle, value);
        });
    }
}
exports.setShuffle = setShuffle;
function setLoop(guild, option, platines) {
    (0, settings_1.updateSettings)(guild, s => {
        if (!option.activate)
            s.music.options.loop.active = false;
        else
            s.music.options.loop = {
                active: true,
                loop_type: option.type
            };
    });
    platines?.emit("loopChange");
}
exports.setLoop = setLoop;
function setDJ(guild, option, platines) {
    (0, settings_1.updateSettings)(guild, s => {
        s.settings.dj = option;
    });
    platines?.emit("djChanged");
}
exports.setDJ = setDJ;
function setBroadcast(guild, option, platines) {
    (0, settings_1.updateSettings)(guild, s => {
        s.settings.broadcast = option;
    });
    platines?.emit("broadcastChanged");
}
exports.setBroadcast = setBroadcast;
