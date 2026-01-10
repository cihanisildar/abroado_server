export interface MessageProps {
    id: string;
    userId: string;
    roomId: string;
    content: string;
    createdAt: Date;
    // Relations
    user?: {
        id: string;
        username: string;
        avatar?: string | null;
    };
}

export class Message {
    constructor(public readonly props: MessageProps) { }

    get id(): string { return this.props.id; }
    get userId(): string { return this.props.userId; }
    get roomId(): string { return this.props.roomId; }
    get content(): string { return this.props.content; }
    get createdAt(): Date { return this.props.createdAt; }
    get user(): any { return this.props.user; }

    toJSON() {
        return {
            ...this.props
        };
    }
}
