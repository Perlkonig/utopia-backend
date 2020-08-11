import { BaseState } from './index';
import { Encounter, HitRange } from "../Encounter";

// tslint:disable-next-line: no-empty-interface
export interface FightState extends BaseState {
    readonly encounter: Encounter;
    hitrange: HitRange;
}
