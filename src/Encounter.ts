export interface Encounter {
    readonly name: string;
    readonly article: string;
    readonly level: number;
    readonly spirit: boolean;
}

export interface HitRange {
    readonly hitMOBmin: number;
    hitMOBmax: number;
    hitPCmin: number;
    readonly hitPCmax: number;
}

export function result2level(result: number): number {
    if ( (result > 555) || (result < -555) || ( (result >= 0) && (result <= 99) ) ) {
        throw new Error("Machine is in an invalid state. Final result out of range.");
    }
    if ( ( (result >= 100) && (result <= 199) ) || ( (result <= -1) && (result >= -100) ) ) {
        return 1;
    } else if ( ( (result >= 200) && (result <= 299) ) || ( (result <= -101) && (result >= -200) ) ) {
        return 2;
    } else if ( ( (result >= 300) && (result <= 399) ) || ( (result <= -201) && (result >= -300) ) ) {
        return 3;
    } else if ( ( (result >= 400) && (result <= 499) ) || ( (result <= -301) && (result >= -400) ) ) {
        return 4;
    } else {
        return 5;
    }
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
