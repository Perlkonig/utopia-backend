import { uhe } from "replayable-random";
import { distrib } from "replayable-random";
import { immerable } from "immer";

// import { findLocationByArtifact, Location } from "./Location";
// import { HitRanges } from "./Encounter";
import { Link, Links } from "./Link";
import { Character } from './Character';
import { Clock } from './Clock';
import { ActivateState, FightState, SearchState, LinkState } from './States';
import { Errors } from "./Error";
import { GameConstants } from "./Constants";

function genRandomSeed(): string {
    const set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split('');
    const rand = distrib.mutBase64Bytes(10)(Math);
    let txtseed = "";
    rand.forEach((x: number) => {txtseed += set[x]});
    return txtseed;
}

export class Game {
    [immerable] = true;
    readonly seedStart: string;
    seedCurrent: string;
    scratch?: ActivateState | FightState | SearchState | LinkState;
    location: number | null;
    pc: Character;
    godshand: number;
    clock: Clock;
    gameover: boolean;
    log: string[];
    links: Link[];
    wastebasket: number[];
    events: GameConstants[][];
    ueActive: boolean;
    error?: Errors;

    readonly f = distrib.mutI32Between(1)(7);

    constructor (seed?: string, expert: number = 0) {
        if (seed === undefined) {
            this.seedStart = genRandomSeed();
        } else {
            this.seedStart = seed;
        }
        const g = uhe.mutFrom(this.seedStart);
        this.seedCurrent = JSON.stringify(g);
        this.ueActive = false;
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

    hasEvent(event: GameConstants, location?: number | null): boolean {
        if (location === undefined) {
            location = this.location;
        }
        if (location === null) {
            return false;
        }
        return (this.events[location-1].indexOf(event) >= 0);
    }
}
