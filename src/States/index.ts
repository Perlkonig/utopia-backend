import { SearchState } from './Search';
import { FightState } from './Fight';
import { ActivateState } from './Activate';
import { LinkState } from './Link';

export interface BaseState {
    interrupts: string[];
    statuses: string[];
    ignored?: string[];
    die1?: number;
    die2?: number;
}

export enum GameState {
    IDLE = 0,
    SEARCHING,
    FIGHTING,
    ACTIVATING,
    LINKING
}

export { SearchState, FightState, ActivateState, LinkState };