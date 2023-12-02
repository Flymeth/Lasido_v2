"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const settings_1 = require("../../../utils/settings");
const settings_2 = require("../../../utils/music/settings");
const platines_1 = require("../../../utils/music/platines");
const SubCommandClass_1 = __importDefault(require("../../../types/SubCommandClass"));
const bandHrz = [30, 60, 150, 200, 500, 1000, 2000, 5000, 12000];
class EQSet extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "set",
            description: "Set your own server's equalizer (not recommended).",
            options: new Array(8).fill(undefined).map((_, index) => ({
                name: `band-${index}`,
                description: `Set the gain of the ${bandHrz[index]}hz band.`,
                type: discord_js_1.ApplicationCommandOptionType.Number,
                min_value: -10,
                max_value: 10
            }))
        });
    }
    async execute(interaction, ...args) {
        if (!interaction.guild)
            return;
        const currentSettings = await (0, settings_1.getSettings)(interaction.guild);
        const bands = new Array(8).fill(undefined).map((_, index) => ({
            band: index,
            gain: interaction.options.getNumber(`band-${index}`) ?? currentSettings.settings.eq?.find(b => b.band === index)?.gain ?? 0
        }));
        (0, settings_2.setEQ)(interaction.guild, bands, (0, platines_1.getPlatines)(this.lasido, interaction.guild));
        return interaction.reply({
            content: `__EQ has been updated:__\n` + bands.map(b => `Band #${b.band}: \`${b.gain}\``).join("\n")
        });
    }
}
exports.default = EQSet;
