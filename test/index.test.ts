// tslint:disable: no-unused-expression
// Seed: "testing", Sequence: 2, 4, 4, 3, 2, 2, 4, 6, 4, 5

import { expect } from "chai";
import "mocha";

import { interpret } from "xstate";
import { ueMachine } from "../src/index";
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
        expect(s.state.matches("searching.assigning.waiting")).to.be.true;
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
        expect(s.state.matches("searching.assigning.waiting")).to.be.true;

        // Seal of Balance interrupt
        c = new Game("testing");
        c.pc.artifacts.push({name: GameConstants.SealOfBalance, active: true, used: false});
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        pad = s.state.context.scratch as SearchState;
        expect(s.state.matches("searching.interruptingSetup")).to.be.true;
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
        expect(s.state.matches("searching.assigning.waiting")).to.be.true;
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
        expect(s.state.matches("searching.assigning.waiting")).to.be.true;
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
        expect(s.state.matches("searching.assigning.waiting")).to.be.true;

        // Valid second command
        expect(() => s.send("ASSIGN", {value: 2, location: "Z"})).to.not.throw();
        pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.die1).to.equal(4);
        expect(pad.die2).to.equal(3);
        expect(pad.locations).to.deep.equal([null,4,null,null,null,null,null,2]);
        expect(s.state.matches("searching.assigning.waiting")).to.be.true;

        // Fill up the pad and make sure it transitions correctly
        expect(() => s.send("ASSIGN", {value: 4, location: "Y"})).to.not.throw();
        expect(() => s.send("ASSIGN", {value: 3, location: "C"})).to.not.throw();
        expect(() => s.send("ASSIGN", {value: 2, location: "A"})).to.not.throw();
        expect(() => s.send("ASSIGN", {value: 2, location: "X"})).to.not.throw();
        pad = s.state.context.scratch as SearchState;
        expect(pad.results).to.not.be.undefined;
        expect(pad.results![0]).to.equal(1);
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
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
        expect(s.state.matches("searching.resolving.interruptingSearch")).to.be.true;

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
        expect(s.state.matches("searching.resolving.interruptingSearch")).to.be.true;

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
        expect(s.state.matches("searching.resolving.interruptingSearch")).to.be.true;

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
        expect(s.state.matches("searching.resolving.interruptingSearch")).to.be.true;

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
        expect(s.state.matches("searching.resolving.interruptingSearch")).to.be.true;
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
        expect(s.state.matches("searching.resolving.interruptingSearch")).to.be.true;

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
        expect(s.state.matches("searching.resolving.interruptingSearch")).to.be.true;

        // Trigger Dowsing Rod
        expect(() => s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: true}]})).to.not.throw();
        pad = s.state.context.scratch as SearchState;
        expect(pad.results![0]).to.equal(1);
        expect(pad.interrupts).to.be.empty;
        expect(s.state.context.pc.hasArtifact(GameConstants.SealOfBalance)).to.be.true;
        expect(s.state.matches("searching.idle.waiting")).to.be.true;

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
        expect(s.state.matches("searching.resolving.interruptingSearch")).to.be.true;
        s.send("RESOLVE", {resolutions: [{name: GameConstants.HermeticMirror, resolution: false}, {name: GameConstants.GoodFortune, resolution: false}]})
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
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
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        let fpad = s.state.context.scratch as FightState;
        expect(fpad).to.not.be.undefined;
        expect(fpad.encounter.level).to.equal(1);

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
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        fpad = s.state.context.scratch as FightState;
        expect(fpad).to.not.be.undefined;
        expect(fpad.encounter.level).to.equal(2);

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
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        const spad = s.state.context.scratch as SearchState;
        expect(spad).to.not.be.undefined;
        expect(spad.results).to.not.be.undefined;
        expect(spad.results![0]).to.equal(14);
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
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
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
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
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
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
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
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        expect(s.state.context.pc.artifacts).to.deep.include({name: GameConstants.SealOfBalance, active: false, used: false});
        expect(s.state.context.pc.components).to.deep.include({name: GameConstants.Silver, count: 2});
    });

    it ("Encounter levels are determined correctly", () => {
        // Unmodified level is determined correctly
        // Level 1, positive (100-199)
        let c = new Game("kU+7gaqxEF"); // 326211 -> 326 211
        let s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "A"});
        s.send("ASSIGN", {value: 2, location: "B"});
        s.send("ASSIGN", {value: 6, location: "C"});
        s.send("ASSIGN", {value: 2, location: "X"});
        s.send("ASSIGN", {value: 1, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        let pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(115);
        expect(pad.encounter.level).to.equal(1);

        // Level 1, negative (-1 to -100)
        c = new Game("kU+7gaqxEF"); // 326211 -> 226 311
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "X"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 6, location: "C"});
        s.send("ASSIGN", {value: 2, location: "B"});
        s.send("ASSIGN", {value: 1, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-85);
        expect(pad.encounter.level).to.equal(1);

        // Level 2, positive (200-299)
        c = new Game("kU+7gaqxEF"); // 326211 -> 611 322
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "X"});
        s.send("ASSIGN", {value: 2, location: "Y"});
        s.send("ASSIGN", {value: 6, location: "A"});
        s.send("ASSIGN", {value: 2, location: "Z"});
        s.send("ASSIGN", {value: 1, location: "B"});
        s.send("ASSIGN", {value: 1, location: "C"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(289);
        expect(pad.encounter.level).to.equal(2);

        // Level 2, negative (-101 to -200)
        c = new Game("isISxuWUYy"); // 336463 -> 463 633
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 3, location: "Y"});
        s.send("ASSIGN", {value: 6, location: "B"});
        s.send("ASSIGN", {value: 4, location: "A"});
        s.send("ASSIGN", {value: 6, location: "X"});
        s.send("ASSIGN", {value: 3, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-170);
        expect(pad.encounter.level).to.equal(2);

        // Level 3, positive (300-399)
        c = new Game("kU+7gaqxEF"); // 326211 -> 611 223
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "Z"});
        s.send("ASSIGN", {value: 2, location: "Y"});
        s.send("ASSIGN", {value: 6, location: "A"});
        s.send("ASSIGN", {value: 2, location: "X"});
        s.send("ASSIGN", {value: 1, location: "B"});
        s.send("ASSIGN", {value: 1, location: "C"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(388);
        expect(pad.encounter.level).to.equal(3);

        // Level 3, negative (-201 to -300)
        c = new Game("gjQZMm/zG0"); // 562643 -> 264 563
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 5, location: "X"});
        s.send("ASSIGN", {value: 6, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 6, location: "Y"});
        s.send("ASSIGN", {value: 4, location: "C"});
        s.send("ASSIGN", {value: 3, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-299);
        expect(pad.encounter.level).to.equal(3);

        // Level 4, positive (400-499)
        c = new Game("kU+7gaqxEF"); // 326211 -> 632 211
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "B"});
        s.send("ASSIGN", {value: 2, location: "C"});
        s.send("ASSIGN", {value: 6, location: "A"});
        s.send("ASSIGN", {value: 2, location: "X"});
        s.send("ASSIGN", {value: 1, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(421);
        expect(pad.encounter.level).to.equal(4);

        // Level 4, negative (-301 to -400)
        c = new Game("gjQZMm/zG0"); // 562643 -> 265 643
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 5, location: "C"});
        s.send("ASSIGN", {value: 6, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 6, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 3, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-378);
        expect(pad.encounter.level).to.equal(4);

        // Level 5, positive (500-555)
        c = new Game("kU+7gaqxEF"); // 326211 -> 623 112
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 2, location: "B"});
        s.send("ASSIGN", {value: 6, location: "A"});
        s.send("ASSIGN", {value: 2, location: "Z"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 1, location: "Y"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(511);
        expect(pad.encounter.level).to.equal(5);

        // Level 5, negative (-401 to -555)
        c = new Game("kU+7gaqxEF"); // 326211 -> 112 623
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "Z"});
        s.send("ASSIGN", {value: 2, location: "C"});
        s.send("ASSIGN", {value: 6, location: "X"});
        s.send("ASSIGN", {value: 2, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "A"});
        s.send("ASSIGN", {value: 1, location: "B"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-511);
        expect(pad.encounter.level).to.equal(5);

        // "Active Monsters" raises encounter level.
        c = new Game("isISxuWUYy"); // 336463 -> 463 633
        c.events[0].push(GameConstants.ActiveMonsters);
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 3, location: "Y"});
        s.send("ASSIGN", {value: 6, location: "B"});
        s.send("ASSIGN", {value: 4, location: "A"});
        s.send("ASSIGN", {value: 6, location: "X"});
        s.send("ASSIGN", {value: 3, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-170);
        expect(pad.encounter.level).to.equal(4);

        // But not past 5
        c = new Game("gjQZMm/zG0"); // 562643 -> 265 643
        c.events[0].push(GameConstants.ActiveMonsters);
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 5, location: "C"});
        s.send("ASSIGN", {value: 6, location: "B"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 6, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Y"});
        s.send("ASSIGN", {value: 3, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-378);
        expect(pad.encounter.level).to.equal(5);
    });

    it ("Combat resolves correctly", () => {
        // Regular encounter, finds component
        let c = new Game("EilxpQ0JqM"); // 222561 -> 222 561, 643
        let s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 2, location: "B"});
        s.send("ASSIGN", {value: 2, location: "C"});
        s.send("ASSIGN", {value: 5, location: "X"});
        s.send("ASSIGN", {value: 6, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        let pad = s.state.context.scratch as FightState;
        expect(pad.trackerpos).to.equal(0);
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-339);
        expect(pad.encounter.level).to.equal(4);
        s.send("RESOLVE", {resolutions: [{name: GameConstants.ParalysisWand, resolution: false}]});
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad.trackerpos).to.equal(1);
        expect(pad.defeated).to.be.true;
        expect(s.state.context.pc.hp).to.equal(6);
        expect(s.state.context.pc.components).to.deep.include({name: GameConstants.Silver, count: 1});

        // Regular encounter, finds nothing
        c = new Game("/9bzLrTKUf"); // 152332 -> 221 533, 366
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 1, location: "C"});
        s.send("ASSIGN", {value: 5, location: "X"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 3, location: "Y"});
        s.send("ASSIGN", {value: 3, location: "Z"});
        s.send("ASSIGN", {value: 2, location: "B"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-312);
        expect(pad.encounter.level).to.equal(4);
        s.send("RESOLVE", {resolutions: [{name: GameConstants.ParalysisWand, resolution: false}]});
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad.defeated).to.be.true;
        expect(s.state.context.pc.hp).to.equal(5);
        expect(s.state.context.pc.components).to.be.empty;

        // Epic encounter, finds legendary treasure
        c = new Game("Y/vQR5apDj"); // 622431 -> 134 622, 464
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 6, location: "X"});
        s.send("ASSIGN", {value: 2, location: "Y"});
        s.send("ASSIGN", {value: 2, location: "Z"});
        s.send("ASSIGN", {value: 4, location: "C"});
        s.send("ASSIGN", {value: 3, location: "B"});
        s.send("ASSIGN", {value: 1, location: "A"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(-488);
        expect(pad.encounter.level).to.equal(5);
        s.send("RESOLVE", {resolutions: [{name: GameConstants.ParalysisWand, resolution: false}]});
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad.defeated).to.be.true;
        expect(s.state.context.pc.hp).to.equal(5);
        expect(s.state.context.pc.components).to.be.empty;
        expect(s.state.context.pc.treasures).to.deep.include({name: GameConstants.IcePlate, active: true});

        // Regular encounter, multiple rounds
        c = new Game("2B6OWlv+te"); // 335314 -> 533 134, 1313
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "B"});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 5, location: "A"});
        s.send("ASSIGN", {value: 3, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(399);
        expect(pad.encounter.level).to.equal(3);
        s.send("RESOLVE", {resolutions: [{name: GameConstants.ParalysisWand, resolution: false}]});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad.defeated).to.be.false;
        expect(s.state.context.pc.hp).to.equal(5);
        s.send("RESOLVE", {resolutions: [{name: GameConstants.ParalysisWand, resolution: false}]});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad.defeated).to.be.false;
        expect(s.state.context.pc.hp).to.equal(4);
    });

    it ("Player death handled correctly", () => {
        // Unconsciousness
        let c = new Game("2B6OWlv+te"); // 335314 -> 533 134, 1313
        c.pc.hp = 1;
        let s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 3, location: "B"});
        s.send("ASSIGN", {value: 3, location: "C"});
        s.send("ASSIGN", {value: 5, location: "A"});
        s.send("ASSIGN", {value: 3, location: "Y"});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 4, location: "Z"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        let pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(399);
        expect(pad.encounter.level).to.equal(3);
        s.send("RESOLVE", {resolutions: [{name: GameConstants.ParalysisWand, resolution: false}]});
        expect(s.state.value).to.equal("idle");
        expect(s.state.context.scratch).to.be.undefined;
        expect(s.state.context.pc.hp).to.equal(6);
        expect(s.state.context.clock.current).to.equal(6);

        // Death
        c = new Game("PbwP5Kd1D3"); // 112411 -> 411 112, 11
        c.pc.hp = 1;
        s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 1, location: "X"});
        s.send("ASSIGN", {value: 1, location: "Y"});
        s.send("ASSIGN", {value: 2, location: "Z"});
        s.send("ASSIGN", {value: 4, location: "A"});
        s.send("ASSIGN", {value: 1, location: "B"});
        s.send("ASSIGN", {value: 1, location: "C"});
        expect(s.state.matches("searching.fighting.rolling.interruptingFight")).to.be.true;
        pad = s.state.context.scratch as FightState;
        expect(pad).to.not.be.undefined;
        expect(pad.results![0]).to.equal(299);
        expect(pad.encounter.level).to.equal(2);
        s.send("RESOLVE", {resolutions: [{name: GameConstants.ParalysisWand, resolution: false}]});
        expect(s.state.value).to.equal("gameover");
    });

    it ("Camping works correctly", () => {
        const c = new Game("/9bzLrTKUf"); // 152332 -> 221 533, 366
        c.pc.hp = 4;
        const s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 1, location: "C"});
        s.send("ASSIGN", {value: 5, location: "X"});
        s.send("ASSIGN", {value: 2, location: "A"});
        s.send("ASSIGN", {value: 3, location: "Y"});
        s.send("ASSIGN", {value: 3, location: "Z"});
        s.send("ASSIGN", {value: 2, location: "B"});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.ParalysisWand, resolution: false}]});
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        s.send("CAMP", {days: 2});
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        expect(s.state.context.pc.hp).to.equal(5);
        expect(s.state.context.clock.current).to.equal(3);
    });

    it ("Leaving the area works correctly", () => {
        const c = new Game("VkKCBpYL1c"); // 155453 = 545 531
        const s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 1, location: "z"});
        s.send("ASSIGN", {value: 5, location: "a"});
        s.send("ASSIGN", {value: 5, location: "x"});
        s.send("ASSIGN", {value: 4, location: "b"});
        s.send("ASSIGN", {value: 5, location: "c"});
        s.send("ASSIGN", {value: 3, location: "y"});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: false}]});
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        s.send("LEAVE");
        expect(s.state.value).to.equal("idle");
        expect(s.state.context.scratch).to.be.undefined;
        expect(s.state.context.location).to.be.null;
        expect(s.state.context.clock.current).to.equal(1);
    });

    it ("Starting another search works correctly", () => {
        const c = new Game("VkKCBpYL1c"); // 155453 = 545 531
        const s = interpret(ueMachine.withContext(c));
        s.start();
        s.send("SEARCH", {location: 1});
        s.send("ASSIGN", {value: 1, location: "z"});
        s.send("ASSIGN", {value: 5, location: "a"});
        s.send("ASSIGN", {value: 5, location: "x"});
        s.send("ASSIGN", {value: 4, location: "b"});
        s.send("ASSIGN", {value: 5, location: "c"});
        s.send("ASSIGN", {value: 3, location: "y"});
        s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: false}]});
        expect(s.state.matches("searching.idle.waiting")).to.be.true;
        let pad = s.state.context.scratch as SearchState;
        expect(pad).to.not.be.undefined;
        expect(pad.trackerpos).to.equal(1);
        expect(s.state.context.clock.current).to.equal(1);
        // Next values: 345366 -> 366 345
        s.send("AGAIN");
        expect(s.state.matches("searching.assigning.waiting")).to.be.true;
        console.log(s.state.context.location);
        console.log(s.state.context.scratch);
        // s.send("ASSIGN", {value: 3, location: "x"});
        // s.send("ASSIGN", {value: 4, location: "y"});
        // s.send("ASSIGN", {value: 5, location: "z"});
        // s.send("ASSIGN", {value: 3, location: "a"});
        // s.send("ASSIGN", {value: 6, location: "b"});
        // s.send("ASSIGN", {value: 6, location: "c"});
        // s.send("RESOLVE", {resolutions: [{name: GameConstants.DowsingRod, resolution: false}]});
        // expect(s.state.matches("searching.idle.waiting")).to.be.true;
        // pad = s.state.context.scratch as SearchState;
        // expect(pad).to.not.be.undefined;
        // expect(pad.trackerpos).to.equal(2);
        // expect(s.state.context.clock.current).to.equal(2);
    });
});
