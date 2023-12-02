"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = require("../../../types/CommandClass");
const reset_1 = __importDefault(require("./reset"));
const preset_1 = __importDefault(require("./preset"));
const set_1 = __importDefault(require("./set"));
class SettingsEQGroup extends CommandClass_1.BotCommandGroup {
    constructor(lasido) {
        super(lasido, {
            name: "eq",
            description: "Set your server's equalizer"
        }, [reset_1.default, preset_1.default, set_1.default]);
    }
}
exports.default = SettingsEQGroup;
