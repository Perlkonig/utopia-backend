export interface Encounter {
    readonly name: string;
    readonly level: number;
    readonly spirit: boolean;
}

export interface HitRange {
    readonly hitMOBmin: number;
    readonly hitMOBmax: number;
    readonly hitPCmin: number;
    readonly hitPCmax: number;
}

export const HitRanges: HitRange[] = [
    {
        "hitMOBmin": 1,
        "hitMOBmax": 1,
        "hitPCmin": 5,
        "hitPCmax": 6
    },
    {
        "hitMOBmin": 1,
        "hitMOBmax": 1,
        "hitPCmin": 6,
        "hitPCmax": 6
    },
    {
        "hitMOBmin": 1,
        "hitMOBmax": 2,
        "hitPCmin": 6,
        "hitPCmax": 6
    },
    {
        "hitMOBmin": 1,
        "hitMOBmax": 3,
        "hitPCmin": 6,
        "hitPCmax": 6
    },
    {
        "hitMOBmin": 1,
        "hitMOBmax": 4,
        "hitPCmin": 6,
        "hitPCmax": 6
    }
];
