// tslint:disable: no-unused-expression
// Seed: "testing", Sequence: 2, 4, 4, 3, 2, 2, 4, 6, 4, 5

import { expect } from "chai";
import "mocha";

import { interpret } from "xstate";
import { ueMachine, collapseState, NestedState } from "../src/index";
import { Game } from "../src/Game";
import { GameConstants } from "../src/Constants";
import { Errors } from "../src/Error";
import { SearchState, FightState } from "../src/States";

describe("State Machine: _General", () => {
    it ("Starts correctly", () => {
        const c = new Game(undefined, 1);
        const s = interpret(ueMachine.withContext(c));
        s.start();
        expect(s.state.value).to.equal("idle");
        expect(s.state.context.clock.current).to.equal(1);
    });
});

describe("State Machine: Searching", () => {
    it ("Location is checked", () => {
        const c = new Game();
        const s = interpret(ueMachine.withContext(c));
        s.start();
        const error = Errors.LOCATION_INVALID.toString();
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
        c.pc.artifacts.push({name: GameConstants.SealOfBalance, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        pad = s.state.context.scratch as SearchState;
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.interruptingSetup");
        expect(pad).to.not.be.undefined;
        expect(pad.trackerpos).to.equal(0);
        expect(pad.die1).to.be.undefined;
        expect(pad.die2).to.be.undefined;
        expect(pad.interrupts).to.include(GameConstants.SealOfBalance);

        // Invalid RESOLVE command
        const error = Errors.RESOLUTION_INVALID.toString();
        expect(() => s.send("RESOLVE")).to.throw(error);
        expect(() => s.send("RESOLVE", {foo: "bar"})).to.throw(error);
        expect(() => s.send("RESOLVE", {resolutions: "bar"})).to.throw(error);
        expect(() => s.send("RESOLVE", {resolutions: [{name: GameConstants.HermeticMirror, resolution: true}]})).to.throw(error);
        expect(() => s.send("RESOLVE", {resolutions: [{name: GameConstants.SealOfBalance, resolution: true}]})).to.not.throw();

        // Seal of Balance resolved true
        // s.send("RESOLVE", {resolutions: [{name: GameConstants.SealOfBalance, resolution: true}]});
        pad = s.state.context.scratch as SearchState;
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.assigning.waiting");
        expect(pad.die1).to.equal(2);
        expect(pad.die2).to.equal(4);
        expect(pad.interrupts).to.be.empty;
        expect(pad.statuses).to.deep.include({name: GameConstants.SealOfBalance, resolution: true});

        // Seal of Balance resolved false
        c = new Game("testing");
        c.pc.artifacts.push({name: GameConstants.SealOfBalance, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.SealOfBalance, resolution: false}]});
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
        const errGeneral = Errors.ASSIGNMENT_MALFORMED;
        const errDie = Errors.ASSIGNMENT_DIE_INVALID;
        const errLocation = Errors.ASSIGNMENT_LOCATION_INVALID;
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
        pad = s.state.context.scratch as SearchState;
        expect(pad.results).to.not.be.undefined;
        expect(pad.results![0]).to.equal(1);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.waiting");
    });

    it("Pre-resolution interrupts are identified correctly", () => {
        // With Dowsing Rod
        let c = new Game("VkKCBpYL1c");
        let s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 1, location: "z"});
        s.send("ASSIGN", {value: 5, location: "a"});
        s.send("ASSIGN", {value: 5, location: "x"});
        s.send("ASSIGN", {value: 4, location: "b"});
        s.send("ASSIGN", {value: 5, location: "c"});
        s.send("ASSIGN", {value: 3, location: "y"});
        let pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.results).to.not.be.undefined;
        expect(pad.results![0]).to.equal(14);
        expect(pad.interrupts).to.deep.equal([GameConstants.DowsingRod]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.resolving.interruptingSearch");

        // With Good Fortune
        c = new Game("testing");
        c.events[0].push(GameConstants.GoodFortune)
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "Z"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 2, location: "X"});
        pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.interrupts).to.deep.equal([GameConstants.GoodFortune]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.resolving.interruptingSearch");

        // With Hermetic Mirror
        c = new Game("testing");
        c.pc.artifacts.push({name: GameConstants.HermeticMirror, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "Z"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 2, location: "X"});
        pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.interrupts).to.deep.equal([GameConstants.HermeticMirror]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.resolving.interruptingSearch");

        // With Scrying Lens
        c = new Game("testing");
        c.pc.artifacts.push({name: GameConstants.ScryingLens, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 3});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "Z"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 2, location: "X"});
        pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.interrupts).to.deep.equal([GameConstants.ScryingLens]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.resolving.interruptingSearch");

        // Most of them at the same time
        c = new Game("VkKCBpYL1c");
        c.events[0].push(GameConstants.GoodFortune)
        c.pc.artifacts.push({name: GameConstants.HermeticMirror, active: true, used: false});
        c.pc.treasures.push({name: GameConstants.ShimmeringMoonlace, active: true});
        c.pc.artifacts.push({name: GameConstants.ScryingLens, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 1, location: "z"});
        s.send("ASSIGN", {value: 5, location: "a"});
        s.send("ASSIGN", {value: 5, location: "x"});
        s.send("ASSIGN", {value: 4, location: "b"});
        s.send("ASSIGN", {value: 5, location: "c"});
        s.send("ASSIGN", {value: 3, location: "y"});
        pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.results).to.not.be.undefined;
        expect(pad.results![0]).to.equal(14);
        expect(pad.interrupts).to.deep.equal([GameConstants.DowsingRod, GameConstants.GoodFortune, GameConstants.HermeticMirror]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.resolving.interruptingSearch");
    });

    it("Pre-resolution interrupts resolve correctly", () => {
        let c = new Game("Jl3rgvFMkL"); // 342141 = 243 141
        c.events[0].push(GameConstants.GoodFortune)
        c.pc.artifacts.push({name: GameConstants.HermeticMirror, active: true, used: false});
        let s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        let pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.results).to.not.be.undefined;
        expect(pad.results![0]).to.equal(102);
        expect(pad.interrupts).to.deep.equal([GameConstants.GoodFortune, GameConstants.HermeticMirror]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.resolving.interruptingSearch");

        // First subtract 11 to throw error
        expect(() => s.send("RESOLVE", {resolutions: [{name: GameConstants.GoodFortune, resolution: -11}]})).to.throw(Errors.RESOLUTION_INVALID);

        // Now subtract 1
        expect(() => s.send("RESOLVE", {resolutions: [{name: GameConstants.GoodFortune, resolution: -1}]})).to.not.throw();
        pad = s.state.context.scratch as SearchState;
        expect(pad.results![0]).to.equal(101);
        expect(pad.interrupts).to.deep.equal([GameConstants.HermeticMirror]);

        // Doing it twice should throw an error
        expect(() => s.send("RESOLVE", {resolutions: [{name: GameConstants.GoodFortune, resolution: -1}]})).to.throw(Errors.RESOLUTION_INVALID);

        // Subtract 2, which should trigger Dowsing Rod
        expect(() => s.send("RESOLVE", {resolutions: [{name: GameConstants.HermeticMirror, resolution: 2}]})).to.not.throw();
        pad = s.state.context.scratch as SearchState;
        expect(pad.results![0]).to.equal(99);
        expect(pad.interrupts).to.deep.equal([GameConstants.DowsingRod]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.resolving.interruptingSearch");

        // Trigger Dowsing Rod
        expect(() => s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: true}]})).to.not.throw();
        pad = s.state.context.scratch as SearchState;
        expect(pad.results![0]).to.equal(1);
        expect(pad.interrupts).to.be.empty;
        expect(s.state.context.pc.hasArtifact(GameConstants.SealOfBalance)).to.be.true;
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.waiting");

        // Ensure ignored interrupts don't get picked up again
        c = new Game("Jl3rgvFMkL"); // 342141 = 243 141
        c.events[0].push(GameConstants.GoodFortune)
        c.pc.artifacts.push({name: GameConstants.HermeticMirror, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.results).to.not.be.undefined;
        expect(pad.results![0]).to.equal(102);
        expect(pad.interrupts).to.deep.equal([GameConstants.GoodFortune, GameConstants.HermeticMirror]);
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.resolving.interruptingSearch");
        s.send("RESOLVE", {resolutions: [{name: GameConstants.HermeticMirror, resolution: false}, {name: GameConstants.GoodFortune, resolution: false}]})
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.fighting.settingup");
    });

    it("Different results resolve correctly", () => {
        // Fighting
        let c = new Game("Jl3rgvFMkL"); // 342141 = 243 141
        let s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.fighting.settingup");
        let pad: FightState | SearchState;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.encounter.level).to.equal(1);

        c = new Game("Jl3rgvFMkL"); // 342141 = 243 141
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "Z"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 2, location: "X"});
        s.send("ASSIGN", {value: 1, location: "A"});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 1, location: "C"});
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.fighting.settingup");
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.encounter.level).to.equal(2);

        // Gaining components
        c = new Game("VkKCBpYL1c"); // 155453 = 545 531
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 1, location: "z"});
        s.send("ASSIGN", {value: 5, location: "a"});
        s.send("ASSIGN", {value: 5, location: "x"});
        s.send("ASSIGN", {value: 4, location: "b"});
        s.send("ASSIGN", {value: 5, location: "c"});
        s.send("ASSIGN", {value: 3, location: "y"});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: false}]});
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.waiting");
        pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.results).to.not.be.undefined;
        expect(pad.results![0]).to.equal(14);
        expect(s.state.context.pc.components).to.deep.include({name: GameConstants.Silver, count: 1});

        // Gaining inactive artifact
        c = new Game("Jl3rgvFMkL"); // 342141 = 243 141
        c.events[0].push(GameConstants.GoodFortune)
        c.pc.artifacts.push({name: GameConstants.HermeticMirror, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.GoodFortune, resolution: -1}]});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.HermeticMirror, resolution: 2}]});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: true}]});
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.waiting");
        expect(s.state.context.pc.artifacts).to.deep.include({name: GameConstants.SealOfBalance, active: false, used: false});

        // Gaining inactive artifact when you already have it
        c = new Game("Jl3rgvFMkL"); // 342141 = 243 141
        c.events[0].push(GameConstants.GoodFortune)
        c.pc.artifacts.push({name: GameConstants.HermeticMirror, active: true, used: false});
        c.pc.artifacts.push({name: GameConstants.SealOfBalance, active: false, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.GoodFortune, resolution: -1}]});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.HermeticMirror, resolution: 2}]});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: true}]});
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.waiting");
        expect(s.state.context.pc.artifacts).to.deep.include({name: GameConstants.SealOfBalance, active: false, used: false});
        expect(s.state.context.pc.components).to.deep.include({name: GameConstants.Silver, count: 1});

        // Gaining active artifact
        c = new Game("Jl3rgvFMkL"); // 342141 = 243 141
        c.events[0].push(GameConstants.GoodFortune)
        c.pc.artifacts.push({name: GameConstants.HermeticMirror, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.GoodFortune, resolution: -3}]});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: true}]});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.HermeticMirror, resolution: 1}]});
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.waiting");
        expect(s.state.context.pc.artifacts).to.deep.include({name: GameConstants.SealOfBalance, active: true, used: false});

        // Gaining active artifact when you already have it
        c = new Game("Jl3rgvFMkL"); // 342141 = 243 141
        c.events[0].push(GameConstants.GoodFortune)
        c.pc.artifacts.push({name: GameConstants.HermeticMirror, active: true, used: false});
        c.pc.artifacts.push({name: GameConstants.SealOfBalance, active: false, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 4, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.GoodFortune, resolution: -3}]});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: true}]});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.HermeticMirror, resolution: 1}]});
        expect(collapseState(s.state.value as NestedState)).to.equal("searching.waiting");
        expect(s.state.context.pc.artifacts).to.deep.include({name: GameConstants.SealOfBalance, active: false, used: false});
        expect(s.state.context.pc.components).to.deep.include({name: GameConstants.Silver, count: 2});
    });
});
