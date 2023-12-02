import GuildSettingJsonFile from "../../database/schema/guildSettings"
import { BaseGuild } from "discord.js";
import { getPool } from "./db";

const cache = new Map<string, GuildSettingJsonFile>()
function new_default(): GuildSettingJsonFile {
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
    }
}

export async function settingsGenerated(guild: BaseGuild | string): Promise<boolean> {
    const guild_id= typeof guild === "string" ? guild : guild.id

    const exists = await getPool().then(
        conn => conn.query(`SELECT DATA FROM servers WHERE ID = ? LIMIT 1`, [parseInt(guild_id)]).then(() => true)
    ).catch(() => false)
    return exists
}

export async function getSettings(guild: BaseGuild | string): Promise<GuildSettingJsonFile> {
    const guild_id= typeof guild === "string" ? guild : guild.id
    const cached = cache.get(guild_id)
    if(cached) return cached

    const data = await getPool().then(
        conn => conn.query(`SELECT DATA FROM servers WHERE ID = ? LIMIT 1`, [parseInt(guild_id)]).then(q => q[0].DATA)
    ).catch(() => undefined) as GuildSettingJsonFile | undefined

    if(!data) return setSettings(guild, new_default())
    data.settings.player = undefined
    return setSettings(guild,  data)
}

export function setSettings(guild: BaseGuild | string, settings: GuildSettingJsonFile) {
    const guild_id= typeof guild === "string" ? guild : guild.id
    getPool().then(conn => conn.query(`INSERT INTO servers VALUES (?, ?) ON DUPLICATE KEY UPDATE \`data\` = ?`, [parseInt(guild_id), settings, settings]))
    cache.set(guild_id, settings)
    
    return settings
}

export async function updateSettings(guild: BaseGuild | string, updater: (current: GuildSettingJsonFile) => void) {
    return getSettings(guild).then(settings => {
        updater(settings)
        return setSettings(guild, settings)
    })
}