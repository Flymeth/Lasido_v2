import { EqualizerBand } from "@discord-player/equalizer"
import { service_id } from "../../src/utils/music/converter"

export type queueItem = {
    author: string,
    id: string,
    src: service_id
}
export default interface GuildSettingJsonFile {
    music: {
        queue: queueItem[],
        active_track: number,
        options: {
            volume: number,
            loop: {
                active: boolean,
                loop_type: "song" | "queue"
            },
            shuffle: boolean
        }
    }, 
    settings: {
        dj: {
            active: boolean,
            role?: string
        },
        broadcast: {
            active: boolean,
            channel?: string
        },
        player?: {
            channel: string,
            message: string
        }
    }
}
