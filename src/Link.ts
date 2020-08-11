import { GameConstants } from "./Constants";

export interface Link {
    readonly prereq?: GameConstants;
    readonly component: GameConstants;
    value?: number;
}

export const Links: Link[] = [
    {
        "component": GameConstants.Silver
    },
    {
        "prereq": GameConstants.SealOfBalance,
        "component": GameConstants.Quartz
    },
    {
        "prereq": GameConstants.VoidGate,
        "component": GameConstants.Silica
    },
    {
        "prereq": GameConstants.ScryingLens,
        "component": GameConstants.Lead
    },
    {
        "prereq": GameConstants.CrystalBattery,
        "component": GameConstants.Gum
    },
    {
        "prereq": GameConstants.HermeticMirror,
        "component": GameConstants.Wax
    },
];
