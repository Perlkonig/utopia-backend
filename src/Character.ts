export interface Tool {
    name: string;
    active: boolean;
}

export class Character {
    hp: number;
    components: string[];
    tools: Tool[];
    treasures: Tool[];
    artifacts: Tool[];

    constructor() {
        this.hp = 6;
        this.components = [];
        this.tools = [
            {
                "name": "Paralysis Wand",
                "active": true
            },
            {
                "name": "Dowsing Rod",
                "active": true
            },
            {
                "name": "Focus Charm",
                "active": true
            },
        ],
        this.treasures = [];
        this.artifacts =  [];
    }

    numInactiveArtifacts(): number {
        let num = 0;
        this.artifacts.forEach((x) => {
            if (! x.active) {
                num++;
            }
        });
        return num;
    }

    numActiveArtifacts(): number {
        let num = 0;
        this.artifacts.forEach((x) => {
            if (x.active) {
                num++;
            }
        });
        return num;
    }

    numInactiveTools(): number {
        let num = 0;
        this.tools.forEach((x) => {
            if (! x.active) {
                num++;
            }
        });
        return num;
    }

    toolIsActive(search: string): boolean {
        for (const tool of this.tools) {
            if (tool.name === search) {
                return tool.active;
            }
        }
        return false;
    }

    hasArtifact(search: string): boolean {
        for (const artifact of this.artifacts) {
            if (artifact.name === search) {
                return true;
            }
        }
        return false;
    }

    artifactIsActive(search: string): boolean {
        for (const artifact of this.artifacts) {
            if (artifact.name === search) {
                return artifact.active;
            }
        }
        return false;
    }

    hasTreasure(search: string): boolean {
        for (const treasure of this.treasures) {
            if (treasure.name === search) {
                return true;
            }
        }
        return false;
    }
}
