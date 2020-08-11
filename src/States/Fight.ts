import { SearchState } from './Search';
import { Encounter, HitRange } from "../Encounter";

// tslint:disable-next-line: no-empty-interface
export interface FightState extends SearchState {
    readonly encounter: Encounter;
    hitrange: HitRange;
}
