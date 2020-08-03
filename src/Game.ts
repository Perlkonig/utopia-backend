import { uhe } from "replayable-random";
import { distrib } from "replayable-random";

import { findLocationByArtifact, Location } from "./Location";
// import { HitRanges } from "./Encounter";
import { Link, Links } from "./Link";
import { Character } from './Character';
import { Clock } from './Clock';
import { GameState, BaseState, ActivateState } from './States';

function genRandomSeed() {
    const set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split('');
    const rand = distrib.mutBase64Bytes(10)(Math);
    let txtseed = "";
    rand.forEach((x: number) => {txtseed += set[x]});
    return txtseed;
}

interface CmdResult {
    success: boolean,
    message?: string
    gameobj?: Game,
}

interface CmdArgs {
    object?: string,
    resolution?: boolean
}

export class Game {
    readonly seedStart: string;
    seedCurrent: string;
    state: GameState;
    scratch?: BaseState;
    location: number | null;
    pc: Character;
    godshand: number;
    clock: Clock;
    gameover: boolean;
    log: string[];
    links: Link[];
    wastebasket: number[];
    events: string[][];

    readonly f = distrib.mutI32Between(1)(7);

    constructor (seed?: string, expert: number = 0) {
        if (seed === undefined) {
            this.seedStart = genRandomSeed();
        } else {
            this.seedStart = seed;
        }
        const g = uhe.mutFrom(this.seedStart);
        this.seedCurrent = JSON.stringify(g);
        this.state = GameState.IDLE;
        this.location = null;
        this.pc = new Character();
        this.godshand = 0;
        this.clock = new Clock(expert);
        this.gameover = false;
        this.wastebasket = [];
        this.links = Links;
        this.events = [[], [], [], [], [], []];
        this.log = ["Game started with the following seed: " + this.seedStart];
    }

    dump(): string {
        return JSON.stringify(this);
    }

    numLinked(): number {
        let num = 0;
        this.links.forEach((x) => {
            if (x.value !== undefined) {
                num++;
            }
        });
        return num;
    }

    // Full command list: activate, assign, final, link, recharge, resolve, rest, search, shelter
    commands(): string[] {
        const cmds = [];
        if (! this.gameover) {
            if ( (this.pc.artifactIsActive("Crystal Battery")) && (this.pc.numInactiveTools() > 0) && (this.pc.components.length >= 3)) {
                cmds.push("recharge");
        }
        if (this.state === GameState.IDLE) {
                cmds.push("search");
                if (this.location !== null) {
                    cmds.push("shelter");
                }
                if (this.pc.hp < 6) {
                    cmds.push("rest");
                }
                if (this.pc.numInactiveArtifacts() > 0) {
                    cmds.push("activate");
                }
                if ( (this.numLinked() === 6) && (this.pc.numActiveArtifacts() === 6) ) {
                    cmds.push("final");
                } else if (this.pc.hasArtifact("Golden Chassis")) {
                    for (const link of this.links) {
                        if (link.value === undefined) {
                            if ( (link.prereq === undefined) || (this.pc.hasArtifact(link.prereq)) ) {
                                cmds.push("link");
                                break;
                            }
                        }
                    }
                }
            } else {
                if (this.scratch !== undefined) {
                    if (this.scratch.interrupts.length > 0) {
                        cmds.push("resolve");
                    }
                    if (this.state !== GameState.FIGHTING) {
                        if ( (this.scratch.die1 !== undefined) || (this.scratch.die2 !== undefined) ) {
                            cmds.push("assign");
                        }
                    }
                }

            }
        }
        return cmds;
    }

    execute(cmd: string, args: CmdArgs): CmdResult {
        switch (cmd) {
            case "activate":
                if (args.object === undefined) {
                    return {"success": false, "message": "You must provide the name of an artifact to activate."};
                }
                if (! this.pc.hasArtifact(args.object)) {
                    return {"success": false, "message": "You don't have that artifact."};
                }
                if (this.pc.artifactIsActive(args.object)) {
                    return {"success": false, "message": "That artifact is already active."};
                }
                const artloc: Location | null = findLocationByArtifact(args.object);
                if (artloc === null) {
                    return {"success": false, "message": "That artifact does not exist in the world."};
                }
                this.log.push("You are attempting to activate the artifact '" + args.object + "'");
                this.state = GameState.ACTIVATING;
                const g = uhe.mutFromPlain(JSON.parse(this.seedCurrent));
                if (g !== undefined) {
                    const pad: ActivateState = {day: 1, energy: 0, needed: 4, interrupts: [], statuses: [], die1: this.f(g), die2: this.f(g)};
                    if (this.pc.toolIsActive("Focus Charm")) {
                        pad.interrupts.push("Focus Charm");
                    }
                    if (this.events[artloc.id - 1].indexOf("Fleeting Visions") >= 0) {
                        pad.statuses.push("Fleeting Visions")
                        pad.needed = 3;
                        this.log.push("The Fleeting Visions event reduces the amount of energy needed by 1.");
                    }
                    if (this.pc.hasTreasure("Bracelet of Ios")) {
                        pad.energy = 1;
                        this.log.push("Your Bracelet of Ios starts your activation effort with 1 energy.");
                    }
                    this.scratch = pad;
                    this.seedCurrent = JSON.stringify(g);
                    this.log.push("You rolled the following numbers. What will you do? ("+ pad.die1 +", "+ pad.die2 +")");
                    return {"success": true, gameobj: this};
                } else {
                    return {"success": false, "message": "Something went wrong deserializing the random number generator. This should never happen."};
                }
                break;
        }
        return {
            "success": false,
            "message": "Unrecognized command"
        }
    }
}