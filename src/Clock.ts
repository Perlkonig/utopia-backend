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
    triggered: boolean;

    constructor(expert: number = 0) {
        this.current = expert;
        this.doomsday = 15;
        this.maxdays = 22;
        this.events = [2, 5, 8, 11, 14, 17, 20];
        this.triggered = false;
    }

    tick(): TickResult {
        this.current++;
        if (this.current >= this.doomsday) {
            this.triggered = true;
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
