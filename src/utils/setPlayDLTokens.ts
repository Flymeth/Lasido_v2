import playdl from "play-dl";
import { config } from "dotenv";
config()

export async function setTokens() {
    await playdl.setToken({
        soundcloud: {
            client_id: await playdl.getFreeClientID()
        },
        spotify: {
            client_id: process.env.SPOTIFY_CLIENT || "",
            client_secret: process.env.SPOTIFY_SECRET || "",
            refresh_token: process.env.SPOTIFY_REFRESH || "",
            market: "US"
        },
    })
}