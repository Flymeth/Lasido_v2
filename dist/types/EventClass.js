"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotEventType = void 0;
class BotEvent {
    id;
    lasido;
    constructor(lasido, id) {
        this.lasido = lasido;
        this.id = id;
    }
    async handle(...args) { }
}
exports.default = BotEvent;
class BotEventType extends BotEvent {
    constructor(lasido) { }
}
exports.BotEventType = BotEventType;
