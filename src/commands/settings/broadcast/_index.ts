import { Lasido } from "../../../_main";
import { BotCommandGroup } from "../../../types/CommandClass";
import BroadcastDisable from "./disable";
import BroadcastSet from "./set";

export default class SettingsBroadcastGroup extends BotCommandGroup {
    constructor(lasido: Lasido) {
        super(lasido, {
            name: "broadcast",
            description: "Set how you want the bot broadcast in your server."
        }, [BroadcastDisable, BroadcastSet])
    }
}