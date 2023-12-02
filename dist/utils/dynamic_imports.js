"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rec_dyn_import = exports.dyn_import = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function dyn_import(file_path) {
    const module_path = path_1.default.join("file://", file_path.toString());
    const module = await import(module_path);
    return module.default;
}
exports.dyn_import = dyn_import;
async function rec_dyn_import(folder_path) {
    const files = fs_1.default.readdirSync(folder_path.toString()).filter(f => !f.startsWith("_") && f.endsWith(".js"));
    const modules = [];
    for await (const file of files) {
        const file_path = path_1.default.join(folder_path.toString(), file);
        modules.push(await dyn_import(file_path));
    }
    return modules;
}
exports.rec_dyn_import = rec_dyn_import;
