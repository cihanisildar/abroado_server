export interface RoomProps {
    id: string;
    name: string;
    description?: string | null;
    type: 'GENERAL' | 'COUNTRY' | 'CITY' | 'TOPIC'; // Assuming types based on common usage, strictly generic in schema
    country?: string | null;
    isPublic: boolean;
    maxMembers: number;
    memberCount: number;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    // Optional aggregation
    members?: any[];
}

export class Room {
    constructor(public readonly props: RoomProps) { }

    get id(): string { return this.props.id; }
    get name(): string { return this.props.name; }
    get description(): string | undefined | null { return this.props.description; }
    get type(): string { return this.props.type; }
    get country(): string | undefined | null { return this.props.country; }
    get isPublic(): boolean { return this.props.isPublic; }
    get maxMembers(): number { return this.props.maxMembers; }
    get memberCount(): number { return this.props.memberCount; }
    get createdById(): string { return this.props.createdById; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    toJSON() {
        return {
            ...this.props
        };
    }
}
