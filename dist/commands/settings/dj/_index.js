"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandClass_1 = require("../../../types/CommandClass");
const disable_1 = __importDefault(require("./disable"));
const set_1 = __importDefault(require("./set"));
class SettingsDJGroup extends CommandClass_1.BotCommandGroup {
    constructor(lasido) {
        super(lasido, {
            name: "dj",
            description: "Set your DJ's settings"
        }, [disable_1.default, set_1.default]);
    }
}
exports.default = SettingsDJGroup;
