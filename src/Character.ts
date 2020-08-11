import { GameConstants } from "./Constants";

export interface Tool {
    name: GameConstants;
    active: boolean;
}

export interface Artifact extends Tool {
    used: boolean;
}

export interface Component {
    name: GameConstants;
    count: number;
}

export class Character {
    hp: number;
    components: Component[];
    tools: Tool[];
    treasures: Tool[];
    artifacts: Artifact[];

    constructor() {
        this.hp = 6;
        this.components = [];
        this.tools = [
            {
                "name": GameConstants.ParalysisWand,
                "active": true
            },
            {
                "name": GameConstants.DowsingRod,
                "active": true
            },
            {
                "name": GameConstants.FocusCharm,
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

    toolIsActive(search: GameConstants): boolean {
        for (const tool of this.tools) {
            if (tool.name === search) {
                return tool.active;
            }
        }
        return false;
    }

    hasArtifact(search: GameConstants): boolean {
        for (const artifact of this.artifacts) {
            if (artifact.name === search) {
                return true;
            }
        }
        return false;
    }

    artifactIsActive(search: GameConstants): boolean {
        for (const artifact of this.artifacts) {
            if (artifact.name === search) {
                return artifact.active;
            }
        }
        return false;
    }

    fetchArtifact(search: GameConstants): Artifact | undefined {
        for (const artifact of this.artifacts) {
            if (artifact.name === search) {
                return artifact;
            }
        }
        return;
    }

    hasTreasure(search: GameConstants): boolean {
        for (const treasure of this.treasures) {
            if (treasure.name === search) {
                return true;
            }
        }
        return false;
    }

    hasComponent(search: GameConstants): boolean {
        for (const c of this.components) {
            if (c.name === search) {
                if (c.count > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    componentCount(search: GameConstants): number {
        for (const c of this.components) {
            if (c.name === search) {
                if (c.count > 0) {
                    return c.count;
                }
            }
        }
        return 0;
    }

    giveComponent(name: GameConstants, count: number = 1) {
        let exists = false;
        for (const c of this.components) {
            if (c.name === name) {
                exists = true;
                c.count += count;
                if (c.count > 4) {
                    c.count = 4;
                }
                break;
            }
        }
        if (! exists) {
            if (count > 4) {
                count = 4;
            }
            this.components.push({name, count});
        }
    }

    takeComponent(name: GameConstants, count: number = 1): boolean {
        for (const c of this.components) {
            if (c.name === name) {
                if (c.count >= count) {
                    c.count -= count;
                    return true;
                } else {
                    return false;
                }
            }
        }
        return false;
    }
}
