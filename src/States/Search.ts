import { BaseState } from './index';

export interface SearchState extends BaseState{
    trackerpos: number;
    A?: number;
    B?: number;
    C?: number;
    X?: number;
    Y?: number;
    Z?: number;
}
