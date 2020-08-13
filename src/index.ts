import { Machine } from "xstate";
import { assign } from '@xstate/immer';
import { uhe } from "replayable-random";

import { Game } from "./Game";
import { GameConstants } from "./Constants";
import { Errors, InvalidArgumentsError } from "./Error";
import { locationIDs, Locations } from "./Location";
import { HitRanges, result2level } from "./Encounter";
import { Resolution, SearchState, FightState, ActivateState, LinkState, BaseState } from './States';

interface StateSchema {
    states: {
        idle: {};
        searching: {
            states: {
                settingup: {};
                interruptingSetup: {};
                assigning: {
                    states: {
                        rolling: {};
                        waiting: {};
                        processing: {};
                    };
                };
                resolving: {
                    states: {
                        settingup: {};
                        interruptingSearch: {};
                        resolving: {};
                        gainingArtifact: {};
                        gainingComponent: {};
                    };
                };
                fighting: {
                    states: {
                        settingup: {};
                        interruptingSetup: {};
                        rolling: {
                            states: {
                                settingup: {};
                                interruptingFight: {};
                                resolving: {};
                                looting: {};
                            };
                        };
                    };
                };
                idle: {
                    states: {
                        waiting: {};
                        leaving: {};
                        camping: {};
                    };
                };
            };
        };
        activating: {};
        linking: {};
        final: {};
        unconscious: {};
        gameover: {};
    };
}

type SearchEvent = { type: "SEARCH", location: number };
type ResolveEvent = { type: "RESOLVE", resolutions: Resolution[] };
type AssignEvent = { type: "ASSIGN", value: number, location: string };
type AgainEvent = { type: "AGAIN" };
type LeaveEvent = { type: "LEAVE" };
type CampEvent = { type: "CAMP", days: number };

export type Events =
    | SearchEvent
    | ResolveEvent
    | AssignEvent
    | AgainEvent
    | LeaveEvent
    | CampEvent;

const setSearchStage = assign<Game, Events>((context, event) => {
    console.log("Setting the stage");
    console.log(event);
    event = event as SearchEvent;
    let tracker = 0;
    if (locationIDs.indexOf(event.location) >= 0) {
        if (context.location === event.location) {
            if (context.scratch === undefined) {
                throw new Error("Machine is in an invalid state. Can't find the previous search.");
            }
            tracker = (context.scratch as SearchState).trackerpos;
            context.log.push("You continue searching " + Locations[context.location].name);
        } else {
            context.location = event.location
            context.log.push("You begin searching " + Locations[context.location].name);
        }
    } else {
        throw new InvalidArgumentsError(Errors.LOCATION_INVALID);
    }
    const localstate = {
        interrupts: [],
        statuses: [],
        ignored: [],
        trackerpos: tracker,
        locations: [null,null,null,null,null,null,null,null]
    } as SearchState;
    const art = context.pc.fetchArtifact(GameConstants.SealOfBalance);
    if ( (art !== undefined) && (art.active) && (!art.used) ) {
        localstate.interrupts.push(GameConstants.SealOfBalance);
    }
    context.scratch = localstate;
    if (localstate.interrupts.length > 0) {
        context.log.push("Some interrupts need to be resolved:\n" + localstate.interrupts.join("\n"));
    }
});

const setFightStage = assign<Game, Events>((context, event) => {
    if (context.location === null) {
        throw new Error("Machine is in an invalid state. You can't fight outside of one of the six areas.");
    }
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as BaseState;
    if (pad.results === undefined) {
        throw new Error("Machine is in an invalid state. You can't fight until the search field is full.");
    }

    let lvl = result2level(pad.results[0]);
    // Check for level adjustments
    const game: Game = Object.assign(new Game(), context);
    if (game.hasEvent(GameConstants.ActiveMonsters)) {
        let alreadyfive = false;
        if (lvl === 5) {
            alreadyfive = true;
        }
        lvl += 2;
        if (lvl > 5) {
            lvl = 5;
        }
        if (!alreadyfive) {
            context.log.push(`The event Active Monsters increases your encounter level to ${lvl}!`);
        }
    }

    const localstate = {
        ...context.scratch as SearchState,
        level: lvl,
        encounter: Locations[context.location - 1].encounters[lvl-1],
        hitrange: HitRanges[lvl-1],
        defeated: false
    } as FightState;
    context.log.push(`You encounter ${localstate.encounter.article} ${localstate.encounter.name} (level ${localstate.encounter.level})!`);

    // Check for passive adjustments
    if ( (context.pc.artifactIsActive(GameConstants.GoldenChassis)) && (localstate.encounter.spirit) ) {
        localstate.statuses.push({name: GameConstants.GoldenChassis, resolution: true});
        context.log.push("Having activated the Golden Chassis means you add one to all your die rolls against this spirit creature.");
    }
    if (context.pc.hasTreasure(GameConstants.IcePlate)) {
        localstate.hitrange.hitMOBmax -= 1;
        if (localstate.hitrange.hitMOBmax < 1) {
            localstate.hitrange.hitMOBmax = 1;
        }
        context.log.push("Having the Ice Plate reduces your enemy's attack range by 1 (to a minimum of 1).");
    }
    if (context.pc.hasTreasure(GameConstants.TheMoltenShard)) {
        localstate.hitrange.hitPCmin -= 1;
        context.log.push("Having the Molten Shard increases your attack range by 1.");
    }

    // Check for interrupts
    if (context.pc.hasTreasure(GameConstants.ShimmeringMoonlace)) {
        localstate.interrupts.push(GameConstants.ShimmeringMoonlace);
    }
    // Don't bother checking for paralysis wand until after dice are cast
    // if (context.pc.toolIsActive(GameConstants.ParalysisWand)) {
    //     localstate.interrupts.push(GameConstants.ParalysisWand);
    // }

    context.scratch = localstate;
    context.log.push("FIGHT!");
});

const resolveInterrupt = assign<Game, Events>((context, event) => {
    event = event as ResolveEvent;
    if (event.resolutions === undefined) {
        throw new InvalidArgumentsError(Errors.RESOLUTION_INVALID);
    }
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as BaseState;
    for (const x of event.resolutions) {
        if (x.name === undefined) {
            throw new InvalidArgumentsError(Errors.RESOLUTION_INVALID);
        }

        const idx = pad.interrupts.indexOf(x.name);
        if (idx < 0) {
            throw new InvalidArgumentsError(Errors.RESOLUTION_INVALID);
        }

        if (x.resolution === undefined) {
            throw new InvalidArgumentsError(Errors.RESOLUTION_INVALID);
        }

        if (typeof x.resolution === "boolean") {
            if (x.resolution === true) {
                if (x.name === GameConstants.DowsingRod) {
                    if (pad.results === undefined) {
                        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                    }
                    if ( (pad.results[0] < 11) || (pad.results[0] > 99) ) {
                        throw new Error("Machine is in an invalid state. The Dowsing Rod should not be available outside of the search range.");
                    }
                    pad.results[0] = 1;
                }
                context.log.push("You choose to use " + x.name);
                pad.statuses.push(x);
                context.pc.useItem(x.name);
            } else {
                pad.ignored.push(x.name);
            }
        } else {
            if (pad.results === undefined) {
                throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
            }
            const delta = Math.abs(x.resolution);
            if (delta > 10) {
                throw new InvalidArgumentsError(Errors.RESOLUTION_INVALID);
            }
            pad.results[0] -= delta;
            context.log.push("You use " + x.name + " to subtract "+ delta +" from the result. The new result is " + pad.results[0] + ".");
            pad.statuses.push(x);
        }
        pad.interrupts.splice(idx, 1);
    }
});

const rollDice = assign<Game, Events>((context, event) => {
    // Hydrate randomizer
    const g = uhe.mutFromPlain(JSON.parse(context.seedCurrent))
    if (g === undefined) {
        throw new Error("Error rehydrating the randomizer.")
    }

    // Generate and save dice rolls
    if (context.scratch === undefined) {
        throw new Error("The dice field was not properly initialized.");
    }
    if ( (context.scratch.die1 !== undefined) || (context.scratch.die2 !== undefined) ) {
        throw new Error("Invalid state. There are still dice to assign.");
    }
    context.scratch.die1 = context.f(g);
    context.scratch.die2 = context.f(g);
    context.log.push(`You roll a ${context.scratch.die1} and a ${context.scratch.die2}`);

    // Serialize randomizer
    context.seedCurrent = JSON.stringify(g);
});

const assignDie = assign<Game, Events>((context, event) => {
    event = event as AssignEvent;
    if ( (event.value === undefined) || (event.location === undefined) ) {
        throw new InvalidArgumentsError(Errors.ASSIGNMENT_MALFORMED);
    }
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as SearchState | ActivateState | LinkState;
    // First look for die
    if (pad.die1 === event.value) {
        pad.die1 = undefined;
    } else if (pad.die2 === event.value) {
        pad.die2 = undefined;
    } else {
        throw new InvalidArgumentsError(Errors.ASSIGNMENT_DIE_INVALID);
    }
    // Then check location
    const labels = ['A', 'B', 'C', 'D', 'W', 'X', 'Y', 'Z'];
    const idx = labels.indexOf(event.location.toUpperCase());
    if (idx < 0) {
        throw new InvalidArgumentsError(Errors.ASSIGNMENT_LOCATION_INVALID);
    }
    // Assign
    pad.locations[idx] = event.value;
    context.log.push(`You assign a ${event.value} to location ${event.location}`);
});

const calcSearchResult = assign<Game, Events>((context, event) => {
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as SearchState;
    if (
        (pad.locations[0] === null) ||
        (pad.locations[1] === null) ||
        (pad.locations[2] === null) ||
        (pad.locations[5] === null) ||
        (pad.locations[6] === null) ||
        (pad.locations[7] === null)
    ) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const num1 = (pad.locations[0] * 100) + (pad.locations[1] * 10) + pad.locations[2];
    const num2 = (pad.locations[5] * 100) + (pad.locations[6] * 10) + pad.locations[7];
    pad.results = [num1 - num2];
    context.log.push("Raw search result: " + pad.results[0]);
});

const findSearchInterrupts = assign<Game, Events>((context, event) => {
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as SearchState;
    if (pad.results === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    pad.interrupts = [];
    const game: Game = Object.assign(new Game(), context);
    // Dowsing rod
    if ( (context.pc.toolIsActive(GameConstants.DowsingRod)) && (pad.results[0] > 10) && (pad.results[0] < 100) ) {
        if ( (pad.statuses.findIndex((x) => x.name === GameConstants.DowsingRod) < 0) && (pad.ignored.indexOf(GameConstants.DowsingRod) < 0) ) {
            pad.interrupts.push(GameConstants.DowsingRod);
        }
    }
    // Good fortune
    if ( (game.hasEvent(GameConstants.GoodFortune)) && (pad.statuses.findIndex((x) => x.name === GameConstants.SealOfBalance) < 0) ) {
        if ( (pad.statuses.findIndex((x) => x.name === GameConstants.GoodFortune) < 0)  && (pad.ignored.indexOf(GameConstants.GoodFortune) < 0) ) {
            pad.interrupts.push(GameConstants.GoodFortune);
        }
    }
    // Hermetic mirror
    if ( (context.pc.artifactIsActive(GameConstants.HermeticMirror)) && ( (context.location === 1) || (context.location === 6) ) ) {
        if ( (pad.statuses.findIndex((x) => x.name === GameConstants.HermeticMirror) < 0)  && (pad.ignored.indexOf(GameConstants.HermeticMirror) < 0) ) {
            pad.interrupts.push(GameConstants.HermeticMirror);
        }
    }
    // Scrying lens
    if ( (context.pc.artifactIsActive(GameConstants.ScryingLens)) && ( (context.location === 3) || (context.location === 4) ) ) {
        if ( (pad.statuses.findIndex((x) => x.name === GameConstants.ScryingLens) < 0)  && (pad.ignored.indexOf(GameConstants.ScryingLens) < 0) ) {
            pad.interrupts.push(GameConstants.ScryingLens);
        }
    }

    if (pad.interrupts.length > 0) {
        context.log.push("Some interrupts need to be resolved:\n" + pad.interrupts.join("\n"));
    }
});

const findFightInterrupts = assign<Game, Events>((context, event) => {
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as FightState;
    if (pad.results === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    pad.interrupts = [];
    // Dowsing rod
    if (context.pc.toolIsActive(GameConstants.ParalysisWand)){
        if ( (pad.statuses.findIndex((x) => x.name === GameConstants.ParalysisWand) < 0) && (pad.ignored.indexOf(GameConstants.ParalysisWand) < 0) ) {
            pad.interrupts.push(GameConstants.ParalysisWand);
        }
    }
});

const grantArtifact = assign<Game, Events>((context, event) => {
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as SearchState;
    if (pad.results === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    if (context.location === null) {
        throw new Error("Machine is in an invalid state. You can't receive an artifact outside of one of the six locations.");
    }
    const art = Locations[context.location - 1].artifact;
    if (context.pc.hasArtifact(art)) {
        if (pad.results[0] === 0) {
            context.pc.giveComponent(Locations[context.location - 1].component, 2);
            context.log.push("You earned the activated artifact " + art + "! But since you already have it, you received two components instead.");
        } else {
            context.pc.giveComponent(Locations[context.location - 1].component);
            context.log.push("You earned the artifact " + art + "! But since you already have it, you received one component instead.");
        }
    } else {
        if (pad.results[0] === 0) {
            context.pc.artifacts.push({name: art, active: true, used: false});
            context.log.push("You earned the activated artifact " + art + "!");
        } else {
            context.pc.artifacts.push({name: art, active: false, used: false});
            context.log.push("You earned the artifact " + art + "!");
        }
    }
});

const grantComponent = assign<Game, Events>((context, event) => {
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    if (context.location === null) {
        throw new Error("Machine is in an invalid state. You can't receive an artifact outside of one of the six locations.");
    }
    const comp = Locations[context.location - 1].component;
    context.pc.giveComponent(comp);
    context.log.push("You found some " + comp + ".");
});

const resolveFight = assign<Game, Events>((context, event) => {
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as FightState;
    if ( (pad.die1 === undefined) || (pad.die2 === undefined) ) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    let dmg = 0;
    let win = false;
    for (let die of [pad.die1, pad.die2]) {
        if (pad.statuses.findIndex((x) => x.name === GameConstants.ParalysisWand) >= 0) {
            context.log.push("Your " + GameConstants.ParalysisWand + ` turns the ${die} into a ${die+2}.`);
            die += 2;
        }
        if ( (die >= pad.hitrange.hitMOBmin) && (die <= pad.hitrange.hitMOBmax) ) {
            dmg += 1
        }
        if ( (die >= pad.hitrange.hitPCmin) && (die <= pad.hitrange.hitPCmax) ) {
            win = true;
        }
    }
    if (dmg > 0) {
        context.log.push(`You're hit! You take ${dmg} points of damage.`);
        context.pc.harm(dmg);
    }
    if (win) {
        context.log.push("You are victorious!");
        pad.defeated = true;
    }

    // Clear Paralysis Wand from `ignored`
    const idx = pad.ignored.indexOf(GameConstants.ParalysisWand);
    if (idx >= 0) {
        pad.ignored.splice(idx, 1);
    }
});

const lootCorpse = assign<Game, Events>((context, event) => {
    if (context.location === null) {
        throw new Error("Machine is in an invalid state. You can't fight creatures outside of the six areas.");
    }
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as FightState;
    if ( (pad.die1 === undefined) || (pad.die2 === undefined) ) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }

    // Hydrate randomizer
    const g = uhe.mutFromPlain(JSON.parse(context.seedCurrent))
    if (g === undefined) {
        throw new Error("Error rehydrating the randomizer.")
    }
    // Roll the die
    const die = context.f(g);
    // Serialize randomizer
    context.seedCurrent = JSON.stringify(g);

    context.log.push(`You roll a ${die}.`);
    if (die <= pad.encounter.level) {
        const treas = Locations[context.location - 1].treasure;
        if ( (pad.encounter.level < 5) || (context.pc.hasTreasure(treas)) ) {
            const comp = Locations[context.location - 1].component;
            context.pc.giveComponent(comp);
            context.log.push("You found some " + comp + ".");
        } else {
            context.log.push(`You found a legendary treasure: ${treas}!`);
            context.pc.treasures.push({name: treas, active: true});
        }
    } else {
        context.log.push("You found nothing.");
    }
});

const tickTracker = assign<Game, Events>((context, event) => {
    if (context.location === null) {
        throw new Error("Machine is in an invalid state. You can't search outside of the six areas.");
    }
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as SearchState;
    const track = Locations[context.location - 1].tracker;
    if (track[pad.trackerpos] === -1) {
        const game: Game = Object.assign(new Game(), context);
        game.tick();
    }
    pad.trackerpos++;
});

const convalesce = assign<Game, Events>((context, event) => {
    if (context.pc.hp === 0) {
        context.pc.hp = context.pc.maxhp;
        context.scratch = undefined;
        const game: Game = Object.assign(new Game(), context);
        game.tick(context.pc.maxhp);
    }
});

const leaveArea = assign<Game, Events>((context, event) => {
    context.scratch = undefined;
    context.location = null;
});

const camp = assign<Game, Events>((context, event) => {
    event = event as CampEvent
    context.pc.heal(event.days);
    const game: Game = Object.assign(new Game(), context);
    game.tick(event.days);
});

export const ueMachine = Machine<Game, StateSchema, Events>(
    {
        id: "root",
        initial: "idle",
        always: [
            {
                target: "gameover",
                cond: "checkEOG"
            }
        ],
        states: {
            idle: {
                on: {
                    SEARCH: "searching"
                }
            },
            searching: {
                id: "searching",
                initial: "settingup",
                entry: [setSearchStage],
                states: {
                    settingup: {
                        always: [
                            {
                                cond: "interruptsResolved",
                                target: "assigning"
                            },
                            {
                                target: "interruptingSetup"
                            }
                        ]
                    },
                    interruptingSetup: {
                        exit: [resolveInterrupt],
                        on: {
                            RESOLVE: "settingup"
                        }
                    },
                    assigning: {
                        initial: "rolling",
                        states: {
                            rolling: {
                                entry: [rollDice],
                                always: ["waiting"],
                            },
                            waiting: {
                                on: {
                                    ASSIGN: "processing"
                                }
                            },
                            processing: {
                                entry: [assignDie],
                                always: [
                                    {
                                        cond: "searchFull",
                                        target: "#resolvingSearch"
                                    },
                                    {
                                        cond: "stillDice",
                                        target: "waiting"
                                    },
                                    {
                                        target: "rolling"
                                    }
                                ]
                            }
                        }
                    },
                    resolving: {
                        id: "resolvingSearch",
                        entry: [calcSearchResult],
                        initial: "settingup",
                        states: {
                            settingup: {
                                entry: [findSearchInterrupts],
                                always: [
                                    {
                                        cond: "interruptsResolved",
                                        target: "resolving"
                                    },
                                    {
                                        target: "interruptingSearch"
                                    }
                                ]
                            },
                            interruptingSearch: {
                                exit: [resolveInterrupt],
                                on: {
                                    RESOLVE: "settingup"
                                }
                            },
                            resolving: {
                                always: [
                                    {
                                        cond: "earnedArtifact",
                                        target: "gainingArtifact"
                                    },
                                    {
                                        cond: "earnedComponent",
                                        target: "gainingComponent"
                                    },
                                    {
                                        target: "#fighting"
                                    }
                                ]
                            },
                            gainingArtifact: {
                                entry: [grantArtifact],
                                always: ["#searching.idle"]
                            },
                            gainingComponent: {
                                entry: [grantComponent],
                                always: ["#searching.idle"]
                            }
                        }
                    },
                    fighting: {
                        id: "fighting",
                        initial: "settingup",
                        entry: [setFightStage],
                        states: {
                            settingup: {
                                always: [
                                    {
                                        cond: "moonlaceActivated",
                                        target: "#searching.idle"
                                    },
                                    {
                                        cond: "interruptsResolved",
                                        target: "rolling"
                                    },
                                    {
                                        target: "interruptingSetup"
                                    }
                                ]
                            },
                            interruptingSetup: {
                                exit: [resolveInterrupt],
                                on: {
                                    RESOLVE: "settingup"
                                }
                            },
                            rolling: {
                                id: "fighting.rolling",
                                initial: "settingup",
                                entry: [rollDice],
                                states: {
                                    settingup: {
                                        entry: [findFightInterrupts],
                                        always: [
                                            {
                                                cond: "interruptsResolved",
                                                target: "resolving"
                                            },
                                            {
                                                target: "interruptingFight"
                                            }
                                        ]
                                    },
                                    interruptingFight: {
                                        exit: [resolveInterrupt],
                                        on: {
                                            RESOLVE: "settingup"
                                        }
                                    },
                                    resolving: {
                                        entry: [resolveFight],
                                        always: [
                                            {
                                                cond: "unconscious",
                                                target: "#unconscious"
                                            },
                                            {
                                                cond: "creatureLives",
                                                target: "#fighting.rolling"
                                            },
                                            {
                                                target: "looting"
                                            }
                                        ]
                                    },
                                    looting: {
                                        entry: [lootCorpse],
                                        always: ["#searching.idle"]
                                    }
                                }
                            }
                        }
                    },
                    idle: {
                        id: "searching.idle",
                        entry: [tickTracker],
                        initial: "waiting",
                        states: {
                            waiting: {
                                on: {
                                    AGAIN: {
                                        target: "#searching"
                                    },
                                    LEAVE: {
                                        target: "leaving"
                                    },
                                    CAMP: {
                                        target: "camping"
                                    }
                                }
                            },
                            leaving: {
                                entry: [leaveArea],
                                always: ["#root"]
                            },
                            camping: {
                                entry: [camp],
                                always: ["waiting"]
                            }
                        }
                    }
                }
            },
            activating: {

            },
            linking: {

            },
            final: {

            },
            unconscious: {
                id: "unconscious",
                entry: [convalesce],
                always: ["#root"]
            },
            gameover: {
                type: "final"
            }
        }
    },
    {
        guards: {
            checkEOG: (context, event) => {
                if ( (context.pc.hp < 0) || (context.ueActive) || (context.clock.triggered) ) {
                    return true;
                }
                return false;
            },
            interruptsResolved: (context, event) => {
                if (context.scratch === undefined) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                }
                return (context.scratch.interrupts.length === 0);
            },
            searchFull: (context, event) => {
                if (context.scratch === undefined) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                }
                return (
                    (context.scratch.locations[0] !== null) &&
                    (context.scratch.locations[1] !== null) &&
                    (context.scratch.locations[2] !== null) &&
                    (context.scratch.locations[5] !== null) &&
                    (context.scratch.locations[6] !== null) &&
                    (context.scratch.locations[7] !== null)
                );
            },
            stillDice: (context, event) =>  {
                if (context.scratch === undefined) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                }
                if ( (context.scratch.die1 !== undefined) || (context.scratch.die2 !== undefined) ) {
                    return true;
                }
                return false;
            },
            earnedArtifact: (context, event) => {
                if ( (context.scratch === undefined) || (context.scratch.results === undefined) ) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                }
                if ( (context.scratch.results[0] >= 0) && (context.scratch.results[0] <= 10) ) {
                    return true;
                }
                return false;
            },
            earnedComponent: (context, event) => {
                if ( (context.scratch === undefined) || (context.scratch.results === undefined) ) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                }
                if ( (context.scratch.results[0] >= 11) && (context.scratch.results[0] <= 99) ) {
                    return true;
                }
                return false;
            },
            moonlaceActivated: (context, event) => {
                if (context.scratch === undefined) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                }
                const pad = context.scratch as FightState;
                if (pad.statuses.findIndex((x) => x.name === GameConstants.ShimmeringMoonlace) >= 0) {
                    return true;
                }
                return false;
            },
            creatureLives: (context, event) => {
                if (context.scratch === undefined) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                }
                const pad = context.scratch as FightState;
                if (pad.defeated === undefined) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
                }
                return !pad.defeated;
            },
            unconscious: (context, event) => {
                return (context.pc.hp <= 0);
            }
        }
    }
);
