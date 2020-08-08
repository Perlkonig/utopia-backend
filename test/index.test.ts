// tslint:disable: no-unused-expression
// Seed: "testing", Sequence: 2, 4, 4, 3, 2, 2, 4, 6, 4, 5

import { expect } from "chai";
import "mocha";

import { interpret } from "xstate";
import { ueMachine, collapseState, NestedState } from "../src/index";
import { Game } from "../src/Game";
import { Errors } from "../src/Error";
import { SearchState } from "../src/States";

describe("Game Engine", () => {
    it ("Starts correctly", () => {
        const c = new Game(undefined, 1);
        const s = interpret(ueMachine.withContext(c));
        s.start();
        expect(s.state.value).to.equal("idle");
        expect(s.state.context.clock.current).to.equal(1);
    });
});

describe("Searching", () => {
    it ("Location is checked", () => {
        const c = new Game();
        const s = interpret(ueMachine.withContext(c));
        s.start();
        const error = "Error code: " + Errors.LOCATION_INVALID.toString();
        expect(() => s.send("SEARCH")).to.throw(error);
        expect(() => s.send("SEARCH", {location: undefined})).to.throw(error);
        expect(() => s.send("SEARCH", {location: null})).to.throw(error);
        expect(() => s.send("SEARCH", {location: 0})).to.throw(error);
        expect(() => s.send("SEARCH", {location: 7})).to.throw(error);
        expect(() => s.send("SEARCH", {location: 1.5})).to.throw(error);
        expect(() => s.send("SEARCH", {foo: "bar"})).to.throw(error);
        expect(() => s.send("SEARCH", {location: 1})).to.not.throw();
        // s.send("SEARCH", {location: 1});
        expect(s.state.context.location).to.equal(1);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.assigning.waiting");
    });

    it ("Field is properly initialized", () => {
        // Fresh field
        let c = new Game("testing");
        let s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        let pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.trackerpos).to.equal(0);
        expect(pad.die1).to.equal(2);
        expect(pad.die2).to.equal(4);
        expect(pad.interrupts).to.be.empty;
        expect(pad.statuses).to.be.empty;
        expect(pad.locations).to.deep.equal([null,null,null,null,null,null,null,null]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.assigning.waiting");

        // Seal of Balance interrupt
        c = new Game("testing");
        c.pc.artifacts.push({name: "Seal of Balance", active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        pad = s.state.context.scratch as SearchState;
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.interruptingSetup");
        expect(pad).to.not.be.undefined;
        expect(pad.trackerpos).to.equal(0);
        expect(pad.die1).to.be.undefined;
        expect(pad.die2).to.be.undefined;
        expect(pad.interrupts).to.include("Seal of Balance");

        // Invalid RESOLVE command
        const error = "Error code: " + Errors.RESOLUTION_INVALID.toString();
        expect(() => s.send("RESOLVE")).to.throw(error);
        expect(() => s.send("RESOLVE", {foo: "bar"})).to.throw(error);
        expect(() => s.send("RESOLVE", {resolutions: "bar"})).to.throw(error);
        expect(() => s.send("RESOLVE", {resolutions: [{name: "Seal of Balance", resolution: true}]})).to.not.throw();

        // Seal of Balance resolved true
        // s.send("RESOLVE", {resolutions: [{name: "Seal of Balance", resolution: true}]});
        pad = s.state.context.scratch as SearchState;
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.assigning.waiting");
        expect(pad.die1).to.equal(2);
        expect(pad.die2).to.equal(4);
        expect(pad.interrupts).to.be.empty;
        expect(pad.statuses).to.deep.include({name: "Seal of Balance", resolution: true});

        // Seal of Balance resolved false
        c = new Game("testing");
        c.pc.artifacts.push({name: "Seal of Balance", active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("RESOLVE", {resolutions: [{name: "Seal of Balance", resolution: false}]});
        pad = s.state.context.scratch as SearchState;
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.assigning.waiting");
        expect(pad.die1).to.equal(2);
        expect(pad.die2).to.equal(4);
        expect(pad.interrupts).to.be.empty;
        expect(pad.statuses).to.be.empty;
    });

    it ("Dice are assigned properly", () => {
        const c = new Game("testing");
        const s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});

        // Invalid ASSIGN commands
        const errGeneral = "Error code: " + Errors.ASSIGNMENT_MALFORMED;
        const errDie = "Error code: " + Errors.ASSIGNMENT_DIE_INVALID;
        const errLocation = "Error code: " + Errors.ASSIGNMENT_LOCATION_INVALID;
        expect(() => s.send("ASSIGN")).to.throw(errGeneral);
        expect(() => s.send("ASSIGN", {foo: "bar"})).to.throw(errGeneral);
        expect(() => s.send("ASSIGN", {value: "wrong", location: "wrong"})).to.throw(errDie);
        expect(() => s.send("ASSIGN", {value: 1, location: "Z"})).to.throw(errDie);
        expect(() => s.send("ASSIGN", {value: 2, location: "ZZ"})).to.throw(errLocation);

        // Valid first command
        expect(() => s.send("ASSIGN", {value: 4, location: "B"})).to.not.throw();
        let pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.die1).to.equal(2);
        expect(pad.die2).to.be.undefined;
        expect(pad.locations).to.deep.equal([null,4,null,null,null,null,null,null]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.assigning.waiting");

        // Valid second command
        expect(() => s.send("ASSIGN", {value: 2, location: "Z"})).to.not.throw();
        pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.die1).to.equal(4);
        expect(pad.die2).to.equal(3);
        expect(pad.locations).to.deep.equal([null,4,null,null,null,null,null,2]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.assigning.waiting");

        // Fill up the pad and make sure it transitions correctly
        expect(() => s.send("ASSIGN", {value: 4, location: "Y"})).to.not.throw();
        expect(() => s.send("ASSIGN", {value: 3, location: "C"})).to.not.throw();
        expect(() => s.send("ASSIGN", {value: 2, location: "A"})).to.not.throw();
        expect(() => s.send("ASSIGN", {value: 2, location: "X"})).to.not.throw();

    });
});
