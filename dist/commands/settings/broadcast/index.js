"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = require("../../../types/CommandClass");
class SettingsBroadcastGroup extends CommandClass_1.BotCommandGroup {
    constructor(lasido) {
        super(lasido, {
            name: "broadcast",
            description: "Set how you want the bot broadcast in your server."
        }, []);
    }
}
exports.default = SettingsBroadcastGroup;
