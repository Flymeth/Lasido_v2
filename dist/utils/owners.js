"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const owners = node_fs_1.default.readFileSync(node_path_1.default.join(__dirname, "../../owners"), { encoding: "utf-8" }).split(/\D+/).filter(Boolean);
exports.default = owners;
