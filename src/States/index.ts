import { SearchState } from './Search';
import { FightState } from './Fight';
import { ActivateState } from './Activate';
import { LinkState } from './Link';
import { GameConstants } from '../../src/Constants';

export interface Resolution {
    name: GameConstants,
    resolution: boolean | number;
}

export interface BaseState {
    interrupts: GameConstants[];
    statuses: Resolution[];
    ignored: GameConstants[];
    locations: (number | null)[];
    results?: number[];
    die1?: number;
    die2?: number;
}

export { SearchState, FightState, ActivateState, LinkState };
