import { SearchState } from './Search';
import { FightState } from './Fight';
import { ActivateState } from './Activate';
import { LinkState } from './Link';

export interface Resolution {
    name: string,
    resolution: boolean | number;
}

export interface BaseState {
    interrupts: string[];
    statuses: Resolution[];
    die1?: number;
    die2?: number;
}

export { SearchState, FightState, ActivateState, LinkState };
