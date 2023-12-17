"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.setSettings = exports.getSettings = exports.settingsGenerated = void 0;
const db_1 = require("./db");
const cache = new Map();
function new_default() {
    return {
        music: {
            queue: [],
            active_track: -1,
            options: {
                volume: 1,
                shuffle: false,
                loop: {
                    active: false,
                    loop_type: "queue"
                }
            }
        },
        settings: {
            dj: {
                active: false,
            },
            broadcast: {
                active: false
            }
        }
    };
}
async function settingsGenerated(guild) {
    const guild_id = typeof guild === "string" ? guild : guild.id;
    const exists = await (0, db_1.getPool)().then(conn => conn.query(`SELECT DATA FROM servers WHERE ID = ?`, [parseInt(guild_id)]).then(() => true)).catch(() => false);
    return exists;
}
exports.settingsGenerated = settingsGenerated;
async function getSettings(guild) {
    const guild_id = typeof guild === "string" ? guild : guild.id;
    const cached = cache.get(guild_id);
    if (cached)
        return cached;
    const data = await (0, db_1.getPool)().then(conn => conn.query(`SELECT DATA FROM servers WHERE ID = ?`, [guild_id]).then(q => q[0].DATA))
        .catch(() => undefined);
    if (!data)
        return setSettings(guild, new_default());
    return setSettings(guild, data);
}
exports.getSettings = getSettings;
function setSettings(guild, settings) {
    const guild_id = typeof guild === "string" ? guild : guild.id;
    (0, db_1.getPool)().then(conn => conn.query(`INSERT INTO servers VALUES (?, ?) ON DUPLICATE KEY UPDATE \`data\` = ?`, [guild_id, settings, settings]));
    cache.set(guild_id, settings);
    return settings;
}
exports.setSettings = setSettings;
async function updateSettings(guild, updater) {
    return getSettings(guild).then(settings => {
        updater(settings);
        return setSettings(guild, settings);
    });
}
exports.updateSettings = updateSettings;
