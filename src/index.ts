import { Machine } from "xstate";
import { assign } from '@xstate/immer';
import { uhe } from "replayable-random";

import { Game } from "./Game";
import { Errors, InvalidArgumentsError } from "./Error";
import { locationIDs } from "./Location";
import { Resolution, SearchState, ActivateState, LinkState } from './States';

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
                resolving: {};
                fighting: {};
                waiting: {};
            }
        };
        activating: {};
        linking: {};
        final: {};
        gameover: {};
    };
}

type SearchEvent = { type: "SEARCH", location: number };
type ResolveEvent = { type: "RESOLVE", resolutions: Resolution[] };
type AssignEvent = { type: "ASSIGN", value: number, location: string };

export type Events =
    | SearchEvent
    | ResolveEvent
    | AssignEvent
    | { type: "AGAIN" };

const setSearchStage = assign<Game, Events>((context, event) => {
    event = event as SearchEvent;
    if (locationIDs.indexOf(event.location) >= 0) {
        context.location = event.location
    } else {
        throw new InvalidArgumentsError(Errors.LOCATION_INVALID);
    }
    const localstate = {
        interrupts: [],
        statuses: [],
        trackerpos: 0,
        locations: [null,null,null,null,null,null,null,null]
    } as SearchState;
    const art = context.pc.fetchArtifact("Seal of Balance");
    if ( (art !== undefined) && (art.active) && (!art.used) ) {
        localstate.interrupts.push("Seal of Balance");
    }
    context.scratch = localstate;
});

const resolveInterrupt = assign<Game, Events>((context, event) => {
    event = event as ResolveEvent;
    if (event.resolutions === undefined) {
        throw new InvalidArgumentsError(Errors.RESOLUTION_INVALID);
    }
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized.");
    }
    const pad = context.scratch as SearchState;
    for (const x of event.resolutions) {
        if (x.name === undefined) {
            throw new InvalidArgumentsError(Errors.RESOLUTION_INVALID);
        }
        const idx = pad.interrupts.indexOf(x.name);
        if (idx >= 0) {
            if (x.resolution === undefined) {
                throw new InvalidArgumentsError(Errors.RESOLUTION_INVALID);
            }
            if ( (typeof x.resolution !== "boolean") || (x.resolution !== false) ) {
                pad.statuses.push(x);
            }
            pad.interrupts.splice(idx, 1);
        }
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
    const idx = labels.indexOf(event.location);
    if (idx < 0) {
        throw new InvalidArgumentsError(Errors.ASSIGNMENT_LOCATION_INVALID);
    }
    // Assign
    pad.locations[idx] = event.value;
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
                initial: "settingup",
                entry: [setSearchStage],
                exit: ["leaveArea"],
                states: {
                    settingup: {
                        always: [
                            {
                                target: "assigning",
                                cond: "interruptsResolved"
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
                                        target: "#resolvingSearch",
                                        cond: "searchFull",
                                        internal: true
                                    },
                                    {
                                        target: "waiting",
                                        cond: "stillDice",
                                    },
                                    {
                                        target: "rolling",
                                    }
                                ]
                            }
                        }
                    },
                    resolving: {
                        id: "resolvingSearch",
                    },
                    fighting: {

                    },
                    waiting: {
                        on: {
                            AGAIN: {
                                target: "..searching",
                                internal: true
                            }
                        },
                    }
                }
            },
            activating: {

            },
            linking: {

            },
            final: {

            },
            gameover: {
                type: "final"
            }
        }
    },
    {
        guards: {
            checkEOG: (context, event) => {
                if ( (context.pc.hp < 0) || (context.ueActive) ) {
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
            }
        }
    }
);

export type NestedState = { [key: string]: string | NestedState }

export function collapseState(state: NestedState): string {
    if (typeof state === "string") {
        return state;
    } else {
        if (Object.keys(state).length !== 1) {
            throw new Error("Invalid state passed");
        } else {
            const key = Object.keys(state)[0];
            const val = state[key] as NestedState;
            if (typeof val === "string") {
                return key + '.' + val;
            } else {
                return key + '.' + collapseState(val)
            }
        }
    }
}