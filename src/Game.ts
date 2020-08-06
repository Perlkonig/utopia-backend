import { uhe } from "replayable-random";
import { distrib } from "replayable-random";

// import { findLocationByArtifact, Location } from "./Location";
// import { HitRanges } from "./Encounter";
import { Link, Links } from "./Link";
import { Character } from './Character';
import { Clock } from './Clock';
import { ActivateState, FightState, SearchState, LinkState } from './States';
import { Errors } from "./Error";

function genRandomSeed() {
    const set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split('');
    const rand = distrib.mutBase64Bytes(10)(Math);
    let txtseed = "";
    rand.forEach((x: number) => {txtseed += set[x]});
    return txtseed;
}

export class Game {
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
    events: string[][];
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
}
