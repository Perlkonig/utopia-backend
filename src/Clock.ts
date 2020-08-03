export enum TickResult {
    NOTHING = 0,
    EVENT,
    DOOM
}

export class Clock {
    current: number;
    doomsday: number;
    maxdays: number;
    events: number[];

    constructor(expert: number = 0) {
        this.current = expert;
        this.doomsday = 15;
        this.maxdays = 22;
        this.events = [2, 5, 8, 11, 14, 17, 20];
    }

    tick(): TickResult {
        this.current++;
        if (this.current >= this.doomsday) {
            return TickResult.DOOM;
        } else if (this.events.indexOf(this.current) >= 0) {
            return TickResult.EVENT;
        } else {
            return TickResult.NOTHING;
        }
    }

    extend(): boolean {
        if (this.doomsday < this.maxdays) {
            this.doomsday++;
            return true;
        } else {
            return false;
        }
    }
}
