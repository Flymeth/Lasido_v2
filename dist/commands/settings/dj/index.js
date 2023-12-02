"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = require("../../../types/CommandClass");
class SettingsDJGroup extends CommandClass_1.BotCommandGroup {
    constructor(lasido) {
        super(lasido, {
            name: "dj",
            description: "Set your DJ's settings"
        }, []);
    }
}
exports.default = SettingsDJGroup;
