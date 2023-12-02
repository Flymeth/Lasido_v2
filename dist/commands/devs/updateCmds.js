"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubCommandClass_1 = __importDefault(require("../../types/SubCommandClass"));
class DevsUpdate extends SubCommandClass_1.default {
    constructor(lasido) {
        super(lasido, {
            name: "update",
            description: "Update all the commands from the written source."
        });
    }
    async execute(interaction, ...args) {
        this.lasido.updateCommands();
    }
}
exports.default = DevsUpdate;
