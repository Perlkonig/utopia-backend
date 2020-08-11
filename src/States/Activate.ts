import { BaseState } from './index';

export interface ActivateState extends BaseState {
    day: number;
    energy: number;
    needed: number;
}
