export interface Link {
    readonly prereq?: string;
    readonly component: string;
    value?: number;
}

export const Links: Link[] = [
    {
        "component": "Silver"
    },
    {
        "prereq": "Seal of Balance",
        "component": "Quartz"
    },
    {
        "prereq": "Void Gate",
        "component": "Silica"
    },
    {
        "prereq": "Scrying Lens",
        "component": "Lead"
    },
    {
        "prereq": "Crystal Battery",
        "component": "Gum"
    },
    {
        "prereq": "Hermetic Mirror",
        "component": "Wax"
    },
];
