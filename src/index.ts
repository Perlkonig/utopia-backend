import { Machine, interpret } from "xstate";
import { assign } from '@xstate/immer';

import { Game } from "./Game";
import { Errors, InvalidArgumentsError } from "./Error";
import { locationIDs } from "./Location";
import { Resolution, SearchState } from './States';

interface StateSchema {
    states: {
        idle: {};
        searching: {
            states: {
                settingup: {};
                interruptingSetup: {};
                assigning: {
                    states: {
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

type SearchEvent = { type: "SEARCH"; location: number };
type ResolveEvent = { type: "RESOLVE"; resolutions: Resolution[] };

export type Events =
    | SearchEvent
    | ResolveEvent
    | { type: "ASSIGN"; dice: string[] }
    | { type: "AGAIN" };

const setSearchStage = assign<Game, Events>((context, event) => {
    event = event as SearchEvent;
    if (locationIDs.indexOf(event.location) >= -1) {
        context.location = event.location
    } else {
        throw new InvalidArgumentsError(Errors.INVALID_LOCATION);
    }
    const localstate = {
        interrupts: [],
        statuses: [],
        trackerpos: 0,
    } as SearchState;
    const art = context.pc.fetchArtifact("Seal of Balance");
    if ( (art !== undefined) && (art.active) && (!art.used) ) {
        localstate.interrupts.push("Seal of Balance");
    }
    context.scratch = localstate;
});

const resolveInterrupt = assign<Game, Events>((context, event) => {
    event = event as ResolveEvent;
    if (context.scratch === undefined) {
        throw new Error("Machine is in an invalid state. Dice field is not properly initialized. This should never happen.");
    }
    const pad = context.scratch as SearchState;
    for (const x of event.resolutions) {
        const idx = pad.interrupts.indexOf(x.name);
        if (idx >= 0) {
            if ( (typeof x.resolution === "boolean") && (x.resolution === false) ) {
                pad.interrupts.splice(idx, 1);
            } else {
                pad.statuses.push(x);
            }
        }
    }
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
                    // {
                    //     target: "searching",
                    //     actions: ["setSearchStage"]
                    // }
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
                        initial: "waiting",
                        entry: ["rollDice"],
                        states: {
                            waiting: {
                                on: {
                                    ASSIGN: "processing"
                                }
                            },
                            processing: {
                                entry: ["assignDice"],
                                always: [
                                    {
                                        target: "..resolving",
                                        cond: "searchFull"
                                    },
                                    {
                                        target: "..assigning",
                                        cond: "stillDice",
                                        internal: true
                                    },
                                    {
                                        target: "..assigning",
                                        cond: "needDice",
                                        internal: false
                                    }
                                ]
                            }
                        }
                    },
                    resolving: {

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
        actions: {
            leaveArea: (context, event) => {
                return;
            },
            rollDice: (context, event) => {
                return;
            },
            assignDice: (context, event) => {
                return;
            }
        },
        guards: {
            checkEOG: (context, event) => {
                if ( (context.pc.hp < 0) || (context.ueActive) ) {
                    return true;
                }
                return false;
            },
            interruptsResolved: (context, event) => {
                if (context.scratch === undefined) {
                    throw new Error("Machine is in an invalid state. Dice field is not properly initialized. This should never happen.");
                }
                return (context.scratch.interrupts.length === 0);
            },
            searchFull: (context, event) => {
                return false;
            },
            stillDice: (context, event) =>  {
                return false;
            },
            needDice: (context, event) => {
                return false;
            }
        }
    }
);

const c = new Game();
c.pc.artifacts.push({name: "Seal of Balance", active: true, used: false});
// tslint:disable-next-line: no-console
const ueService = interpret(ueMachine.withContext(c)).onTransition(state => console.log(state.value));
ueService.start();
ueService.send("SEARCH");
ueService.send("RESOLVE", {resolutions: [{name: "Seal of Balance", resolution: false}]})
