import { expect } from "chai";
import "mocha";

import { Clock, TickResult } from '../src/Clock';

describe("Game Clock", () => {
    it ("Expert mode works as expected", () => {
        const c = new Clock(5);
        expect(c.current).to.equal(5);
    });

    it ("Events are triggered", () => {
        const c = new Clock();
        const first = c.tick();
        const second = c.tick();
        expect(first).to.equal(TickResult.NOTHING);
        expect(second).to.equal(TickResult.EVENT);
    });

    it ("Doomsday triggered", () => {
        const c = new Clock();
        c.current = 14;
        const result = c.tick();
        expect(result).to.equal(TickResult.DOOM);
    });

    it ("Extension works", () => {
        const c = new Clock();
        for (let i=0; i<10; i++) {
            const result = c.extend();
            if (i < 7) {
                // tslint:disable-next-line: no-unused-expression
                expect(result).to.be.true;
                expect(c.doomsday).to.equal(16+i);
            } else {
                // tslint:disable-next-line: no-unused-expression
                expect(result).to.be.false;
                expect(c.doomsday).to.equal(22);
            }
        }
    });
});

