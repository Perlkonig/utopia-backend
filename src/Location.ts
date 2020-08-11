import { Encounter } from './Encounter';
import { GameConstants } from './Constants';

export interface Location {
    readonly name: string;
    readonly id: number;
    readonly tracker: number[];
    readonly encounters: Encounter[];
    readonly component: GameConstants;
    readonly artifact: GameConstants;
    readonly treasure: GameConstants;
}

export const Locations: Location[] = [
    {
        "name": "Halebeard Peak",
        "id": 1,
        "tracker": [-1,-1,0,-1,0,0],
        "component": GameConstants.Silver,
        "artifact": GameConstants.SealOfBalance,
        "treasure": GameConstants.IcePlate,
        "encounters": [
            {
                "name": "Ice Bear",
                "article": "an",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Roving Bandits",
                "article": "",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Blood Wolves",
                "article": "",
                "level": 3,
                "spirit": false
            },
            {
                "name": "Horse Eater Hawk",
                "article": "a",
                "level": 4,
                "spirit": false
            },
            {
                "name": "Hollow Giant",
                "article": "The",
                "level": 5,
                "spirit": true
            },
        ]
    },
    {
        "name": "The Great Wilds",
        "id": 2,
        "tracker": [-1,0,0,-1,0,0],
        "component": GameConstants.Quartz,
        "artifact": GameConstants.HermeticMirror,
        "treasure": GameConstants.BraceletOfIo,
        "encounters": [
            {
                "name": "Rogue Thief",
                "article": "a",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Blanket of Crows",
                "article": "a",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Hornback Bison",
                "article": "a",
                "level": 3,
                "spirit": false
            },
            {
                "name": "Grassyback Troll",
                "article": "a",
                "level": 4,
                "spirit": false
            },
            {
                "name": "Thunder King",
                "article": "The",
                "level": 5,
                "spirit": false
            },
        ]
    },
    {
        "name": "The Root-Strangled Marshes",
        "id": 3,
        "tracker": [-1,0,-1,0,-1,0],
        "component": GameConstants.Gum,
        "artifact": GameConstants.VoidGate,
        "treasure": GameConstants.ShimmeringMoonlace,
        "encounters": [
            {
                "name": "Gemscale Boa",
                "article": "a",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Ancient Alligator",
                "article": "an",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Land Shark",
                "article": "a",
                "level": 3,
                "spirit": false
            },
            {
                "name": "Abyssal Leech",
                "article": "an",
                "level": 4,
                "spirit": true
            },
            {
                "name": "Dweller in the Tides",
                "article": "The",
                "level": 5,
                "spirit": false
            },
        ]
    },
    {
        "name": "Glassrock Canyon",
        "id": 4,
        "tracker": [-1,-1,0,-1,0,0],
        "component": GameConstants.Silica,
        "artifact": GameConstants.GoldenChassis,
        "treasure": GameConstants.ScaleOfTheInfinityWurm,
        "encounters": [
            {
                "name": "Feisty Goblin",
                "article": "a",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Glasswing Drake",
                "article": "a",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Reaching Claws",
                "article": "",
                "level": 3,
                "spirit": true
            },
            {
                "name": "Terrible Wurm",
                "article": "a",
                "level": 4,
                "spirit": false
            },
            {
                "name": "Infinity Wurm",
                "article": "The",
                "level": 5,
                "spirit": true
            },
        ]
    },
    {
        "name": "The Ruined City of the Ancients",
        "id": 5,
        "tracker": [-1,0,-1,0,-1,0],
        "component": GameConstants.Wax,
        "artifact": GameConstants.ScryingLens,
        "treasure": GameConstants.TheAncientRecord,
        "encounters": [
            {
                "name": "Grave Robbers",
                "article": "",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Ghost Lights",
                "article": "",
                "level": 2,
                "spirit": true
            },
            {
                "name": "Vengeful Shade",
                "article": "a",
                "level": 3,
                "spirit": true
            },
            {
                "name": "Nightmare Crab",
                "article": "a",
                "level": 4,
                "spirit": false
            },
            {
                "name": "Unnamed",
                "article": "The",
                "level": 5,
                "spirit": false
            },
        ]
    },
    {
        "name": "The Fiery Maw",
        "id": 6,
        "tracker": [-1,-1,-1,0,-1,0],
        "component": GameConstants.Lead,
        "artifact": GameConstants.CrystalBattery,
        "treasure": GameConstants.TheMoltenShard,
        "encounters": [
            {
                "name": "Minor Imp",
                "article": "a",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Renegade Warlock",
                "article": "a",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Giant Flame Lizard",
                "article": "a",
                "level": 3,
                "spirit": false
            },
            {
                "name": "Spark Elemental",
                "article": "a",
                "level": 4,
                "spirit": true
            },
            {
                "name": "Volcano Spirit",
                "article": "The",
                "level": 5,
                "spirit": true
            },
        ]
    }
];

export function findLocationByArtifact(search: GameConstants): Location | null {
    for (const location of Locations) {
        if (location.artifact === search) {
            return location;
        }
    }
    return null;
}

export const locationIDs: number[] = Locations.map((x) => x.id);
