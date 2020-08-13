// tslint:disable: no-unused-expression
import { expect } from "chai";
import "mocha";

import { Character } from '../src/Character';
import { GameConstants } from "../src/Constants";

describe("Character class", () => {
    it ("Constructor works", () => {
        const c = new Character();
        expect(c.hp).to.equal(6);
        expect(c.tools).to.deep.equal([
            {
                "name": GameConstants.ParalysisWand,
                "active": true
            },
            {
                "name": GameConstants.DowsingRod,
                "active": true
            },
            {
                "name": GameConstants.FocusCharm,
                "active": true
            },
        ]);
        expect(c.treasures).to.be.empty;
        expect(c.artifacts).to.be.empty;
        expect(c.components).to.be.empty;
    });

    it ("'Number of' tests work", () => {
        const c = new Character();
        expect(c.numInactiveArtifacts()).to.equal(0);
        expect(c.numActiveArtifacts()).to.equal(0);
        expect(c.numInactiveTools()).to.equal(0);
        c.tools[0].active = false;
        expect(c.numInactiveTools()).to.equal(1);
        c.artifacts.push({name: GameConstants.HermeticMirror, active: false, used: false});
        expect(c.numActiveArtifacts()).to.equal(0);
        expect(c.numInactiveArtifacts()).to.equal(1);
        c.artifacts[0].active = true;
        expect(c.numActiveArtifacts()).to.equal(1);
        expect(c.numInactiveArtifacts()).to.equal(0);
    });

    it ("'Have' tests work", () => {
        const c = new Character();
        expect(c.hasArtifact(GameConstants.SealOfBalance)).to.be.false;
        expect(c.hasTreasure(GameConstants.ShimmeringMoonlace)).to.be.false;
        c.artifacts.push({name: GameConstants.HermeticMirror, active: false, used: false});
        c.treasures.push({name: GameConstants.ShimmeringMoonlace, active: true});
        expect(c.hasArtifact(GameConstants.HermeticMirror)).to.be.true;
        expect(c.hasTreasure(GameConstants.ShimmeringMoonlace)).to.be.true;
    });

    it ("'Active' tests work", () => {
        const c = new Character();
        expect(c.toolIsActive(GameConstants.DowsingRod)).to.be.true;
        c.tools[1].active = false;
        expect(c.toolIsActive(GameConstants.DowsingRod)).to.be.false;
        expect(c.artifactIsActive(GameConstants.SealOfBalance)).to.be.false;
        c.artifacts.push({name: GameConstants.SealOfBalance, active: false, used: false});
        expect(c.artifactIsActive(GameConstants.SealOfBalance)).to.be.false;
        c.artifacts[0].active = true;
        expect(c.artifactIsActive(GameConstants.SealOfBalance)).to.be.true;
    });

    it ("Component functions work", () => {
        const c = new Character();
        expect(c.hasComponent(GameConstants.Quartz)).to.be.false;
        c.giveComponent(GameConstants.Quartz);
        expect(c.hasComponent(GameConstants.Quartz)).to.be.true;
        expect(c.takeComponent(GameConstants.Quartz, 2)).to.be.false;
        expect(c.takeComponent(GameConstants.Quartz)).to.be.true;
        expect(c.componentCount(GameConstants.Quartz)).to.equal(0);
        c.components = [];
        c.giveComponent(GameConstants.Quartz, 5);
        expect(c.componentCount(GameConstants.Quartz)).to.equal(4);
        expect(c.takeComponent(GameConstants.Quartz, 5)).to.be.false;
        expect(c.takeComponent(GameConstants.Quartz, 4)).to.be.true;
        expect(c.takeComponent(GameConstants.Quartz)).to.be.false;
    });

    it ("HP functions work", () => {
        const c = new Character();
        expect(c.hp).to.equal(c.maxhp);
        c.heal(5);
        expect(c.hp).to.equal(c.maxhp);
        c.harm(1);
        expect(c.hp).to.equal(c.maxhp - 1);
        c.heal(5);
        expect(c.hp).to.equal(c.maxhp);
    });
});
