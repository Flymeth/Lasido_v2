import { Lasido } from "../_main"

export default class BotEvent {
    id: string
    lasido: Lasido

    constructor(
        lasido: Lasido,
        id: string
    ) {
        this.lasido= lasido
        this.id= id
    }
    
    async handle(...args: any[]): Promise<any> {}
}

export class BotEventType extends BotEvent {
    //@ts-ignore
    constructor(lasido: Lasido) {  }
}