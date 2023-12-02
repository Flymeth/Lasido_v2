"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.setSettings = exports.getSettings = exports.settingsGenerated = exports.new_default = void 0;
const mariadb_1 = __importDefault(require("mariadb"));
const cache = new Map();
let db;
async function getPool() {
    if (db)
        return db;
    db = await mariadb_1.default.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "3306"),
        user: process.env.DB_U,
        password: process.env.DB_P,
        database: process.env.DB_NAME
    }).getConnection();
    return db;
}
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
exports.new_default = new_default;
async function settingsGenerated(guild) {
    const guild_id = typeof guild === "string" ? guild : guild.id;
    const exists = await getPool().then(conn => conn.query(`SELECT DATA FROM servers WHERE ID = ? LIMIT 1`, [parseInt(guild_id)]).then(() => true)).catch(() => false);
    return exists;
}
exports.settingsGenerated = settingsGenerated;
async function getSettings(guild) {
    const guild_id = typeof guild === "string" ? guild : guild.id;
    const cached = cache.get(guild_id);
    if (cached)
        return cached;
    const data = await getPool().then(conn => conn.query(`SELECT DATA FROM servers WHERE ID = ? LIMIT 1`, [parseInt(guild_id)]).then(q => q[0].DATA)).catch(() => undefined);
    if (!data)
        return setSettings(guild, new_default());
    data.settings.player = undefined;
    return setSettings(guild, data);
}
exports.getSettings = getSettings;
function setSettings(guild, settings) {
    const guild_id = typeof guild === "string" ? guild : guild.id;
    getPool().then(conn => conn.query(`INSERT INTO servers VALUES (?, ?) ON DUPLICATE KEY UPDATE \`data\` = ?`, [parseInt(guild_id), settings, settings]));
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
