import { Encounter } from './Encounter';

export interface Location {
    readonly name: string;
    readonly id: number;
    readonly tracker: number[];
    readonly encounters: Encounter[];
    readonly component: string;
    readonly artifact: string;
    readonly treasure: string;
}

export const Locations: Location[] = [
    {
        "name": "Halebeard Peak",
        "id": 1,
        "tracker": [-1,-1,0,-1,0,0],
        "component": "Silver",
        "artifact": "Seal of Balance",
        "treasure": "Ice Plate",
        "encounters": [
            {
                "name": "Ice Bear",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Roving Bandits",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Blood Wolves",
                "level": 3,
                "spirit": false
            },
            {
                "name": "Horse Eater Hawk",
                "level": 4,
                "spirit": false
            },
            {
                "name": "The Hollow Giant",
                "level": 5,
                "spirit": true
            },
        ]
    },
    {
        "name": "The Great Wilds",
        "id": 2,
        "tracker": [-1,0,0,-1,0,0],
        "component": "Quartz",
        "artifact": "Hermetic Mirror",
        "treasure": "Bracelet of Ios",
        "encounters": [
            {
                "name": "Rogue Thief",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Blanket of Crows",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Hornback Bison",
                "level": 3,
                "spirit": false
            },
            {
                "name": "Grassyback Troll",
                "level": 4,
                "spirit": false
            },
            {
                "name": "Thuder King",
                "level": 5,
                "spirit": false
            },
        ]
    },
    {
        "name": "Root-Strangled Marshes",
        "id": 3,
        "tracker": [-1,0,-1,0,-1,0],
        "component": "Gum",
        "artifact": "Void Gate",
        "treasure": "Shimmering Moonlace",
        "encounters": [
            {
                "name": "Gemscale Boa",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Ancient Alligator",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Land Shark",
                "level": 3,
                "spirit": false
            },
            {
                "name": "Abyssal Leech",
                "level": 4,
                "spirit": true
            },
            {
                "name": "Dweller in the Tides",
                "level": 5,
                "spirit": false
            },
        ]
    },
    {
        "name": "Glassrock Canyon",
        "id": 4,
        "tracker": [-1,-1,0,-1,0,0],
        "component": "Silica",
        "artifact": "Golden Chassis",
        "treasure": "Scale of the Infinity Wurm",
        "encounters": [
            {
                "name": "Feisty Goblin",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Glasswing Drake",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Reaching Claws",
                "level": 3,
                "spirit": true
            },
            {
                "name": "Terrible Wurm",
                "level": 4,
                "spirit": false
            },
            {
                "name": "Infinity Wurm",
                "level": 5,
                "spirit": true
            },
        ]
    },
    {
        "name": "Ruined City of the Ancients",
        "id": 5,
        "tracker": [-1,0,-1,0,-1,0],
        "component": "Wax",
        "artifact": "Scrying Lens",
        "treasure": "The Ancient Record",
        "encounters": [
            {
                "name": "Grave Robbers",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Ghost Lights",
                "level": 2,
                "spirit": true
            },
            {
                "name": "Vengeful Shade",
                "level": 3,
                "spirit": true
            },
            {
                "name": "Nightmare Crab",
                "level": 4,
                "spirit": false
            },
            {
                "name": "The Unnamed",
                "level": 5,
                "spirit": false
            },
        ]
    },
    {
        "name": "The Fiery Maw",
        "id": 6,
        "tracker": [-1,-1,-1,0,-1,0],
        "component": "Lead",
        "artifact": "Crystal Battery",
        "treasure": "The Molten Shard",
        "encounters": [
            {
                "name": "Minor Imp",
                "level": 1,
                "spirit": false
            },
            {
                "name": "Renegade Warlock",
                "level": 2,
                "spirit": false
            },
            {
                "name": "Giant Flame Lizard",
                "level": 3,
                "spirit": false
            },
            {
                "name": "Spark Elemental",
                "level": 4,
                "spirit": true
            },
            {
                "name": "Volcano Spirit",
                "level": 5,
                "spirit": true
            },
        ]
    }
];

export function findLocationByArtifact(search: string): Location | null {
    for (const location of Locations) {
        if (location.artifact === search) {
            return location;
        }
    }
    return null;
}

