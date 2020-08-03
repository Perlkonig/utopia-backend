import { BaseState } from './index';

export interface ActivateState extends BaseState {
    day: number;
    energy: number;
    needed: number;
    A?: number;
    B?: number;
    C?: number;
    D?: number;
    W?: number;
    X?: number;
    Y?: number;
    Z?: number;
}
