"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hex_to_int = void 0;
function hex_to_int(color) {
    return parseInt(color.replace("#", ""), 16);
}
exports.hex_to_int = hex_to_int;
