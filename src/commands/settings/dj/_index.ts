import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Lasido } from "../../../_main";
import { BotCommandGroup } from "../../../types/CommandClass";
import DJDisableSub from "./disable";
import DJSet from "./set";

export default class SettingsDJGroup extends BotCommandGroup {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "dj",
            description: "Set your DJ's settings"
        }, [DJDisableSub, DJSet])
    }
}