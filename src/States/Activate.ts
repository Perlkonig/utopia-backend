import { BaseState } from './index';

export interface ActivateState extends BaseState {
    day: number;
    energy: number;
    needed: number;
    r1?: number;
    r2?: number;
    r3?: number;
    r4?: number;
}
