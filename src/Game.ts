import { uhe } from "replayable-random";
import { distrib } from "replayable-random";
import { immerable } from "immer";

// import { findLocationByArtifact, Location } from "./Location";
// import { HitRanges } from "./Encounter";
import { Link, Links } from "./Link";
import { Character } from './Character';
import { Clock, TickResult } from './Clock';
import { ActivateState, FightState, SearchState, LinkState } from './States';
import { GameConstants, setEvents } from "./Constants";
import { Locations } from "./Location";

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
    lastLocation: number | null;
    pc: Character;
    godshand: number;
    clock: Clock;
    log: string[];
    links: Link[];
    wastebasket: number[];
    events: GameConstants[][];
    ueActive: boolean;
    gameover: boolean;
    score?: number;

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
        this.lastLocation = null;
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

    tick(days: number = 1) {
        for (let i = 0; i < days; i++) {
            if (!this.gameover) {
                const result = this.clock.tick();
                if (result === TickResult.DOOM) {
                    this.gameover = true;
                } else if (result === TickResult.EVENT) {
                    // Hydrate randomizer
                    const g = uhe.mutFromPlain(JSON.parse(this.seedCurrent))
                    if (g === undefined) {
                        throw new Error("Error rehydrating the randomizer.")
                    }

                    // For each event, roll a die and assign
                    this.events = [[], [], [], [], [], []];
                    for (const evt of setEvents) {
                        const die = this.f(g);
                        this.events[die-1].push(evt);
                        this.log.push(`The event ${evt} is now active in ${Locations[die-1].name}.`);
                    }

                    // Serialize randomizer
                    this.seedCurrent = JSON.stringify(g);
                }
            }
        }
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
