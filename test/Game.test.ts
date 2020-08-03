import { expect } from "chai";
import "mocha";

import { Game } from '../src/Game';

describe("Game Functions", () => {
    it ("Commands are properly generated", () => {
        let g = new Game();
        expect(g.commands()).to.have.members(["search"]);
        g.gameover = true;
        expect(g.commands()).to.have.members([]);
        g.gameover = false;
        g.pc.artifacts.push({"name": "Hermetic Mirror", "active": false});
        expect(g.commands()).to.have.members(["search", "activate"]);
        g.pc.artifacts[0].active = true;
        expect(g.commands()).to.have.members(["search"]);
        g.pc.artifacts.push({"name": "Golden Chassis", "active": false});
        expect(g.commands()).to.have.members(["search", "activate", "link"]);
        g.pc.hp = 5;
        expect(g.commands()).to.have.members(["search", "activate", "link", "rest"]);
        g.location = 1;
        expect(g.commands()).to.have.members(["search", "activate", "link", "rest", "shelter"]);
        g.pc.artifacts[1].active = true;
        g.pc.artifacts.push({"name": "Golden Chassis", "active": true});
        g.pc.artifacts.push({"name": "Golden Chassis", "active": true});
        g.pc.artifacts.push({"name": "Golden Chassis", "active": true});
        g.pc.artifacts.push({"name": "Golden Chassis", "active": true});
        g.links.forEach((x) => {x.value = 1});
        expect(g.commands()).to.have.members(["search", "rest", "shelter", "final"]);
        g = new Game();
        g.pc.components = ["Quartz", "Quartz"];
        g.pc.tools[0].active = false;
        g.pc.artifacts.push({"name": "Crystal Battery", "active": true});
        expect(g.commands()).to.have.members(["search"]);
        g.pc.components.push("Silica");
        expect(g.commands()).to.have.members(["search", "recharge"]);
        g.pc.artifacts[0].active = false;
        expect(g.commands()).to.have.members(["search", "activate"]);
        g.pc.artifacts[0].active = true;
        expect(g.commands()).to.have.members(["search", "recharge"]);
    });
});
