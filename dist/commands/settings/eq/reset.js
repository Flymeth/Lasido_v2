"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = require("../../../utils/music/settings");
const platines_1 = require("../../../utils/music/platines");
const SubCommandClass_1 = __importDefault(require("../../../types/SubCommandClass"));
class EqReset extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "reset",
            description: "Reset the equalizer to default",
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        (0, settings_1.setEQ)(interaction.guild, undefined, (0, platines_1.getPlatines)(this.lasido, interaction.guild));
        return interaction.reply({
            content: "EQ has been reset."
        });
    }
}
exports.default = EqReset;
