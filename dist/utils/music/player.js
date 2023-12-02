"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_events_1 = require("node:events");
class Player extends node_events_1.EventEmitter {
    constructor(lasido, guild) {
        super();
    }
}
exports.default = Player;
