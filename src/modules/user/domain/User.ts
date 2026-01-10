export interface UserProps {
    id: string;
    email: string;
    username: string;
    avatar?: string | null;
    role: 'EXPLORER' | 'ABROADER';

    currentCity?: string | null;
    currentCountry?: string | null;
    targetCountry?: string | null;

    bio?: string | null;
    techStack: string[];

    isOnline: boolean;
    lastSeen?: Date | null;

    createdAt: Date;
    updatedAt: Date;

    // Auth related
    googleId?: string | null;
}

export class User {
    private props: UserProps;

    constructor(props: UserProps) {
        this.props = props;
    }

    get id() { return this.props.id; }
    get email() { return this.props.email; }
    get username() { return this.props.username; }
    get role() { return this.props.role; }
    get avatar() { return this.props.avatar; }
    get currentCity() { return this.props.currentCity; }
    get currentCountry() { return this.props.currentCountry; }
    get targetCountry() { return this.props.targetCountry; }
    get bio() { return this.props.bio; }
    get techStack() { return this.props.techStack; }
    get isOnline() { return this.props.isOnline; }
    get lastSeen() { return this.props.lastSeen; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
    get googleId() { return this.props.googleId; }
    get password() { return (this.props as any).password; } // For auth checks

    public getFullName(): string {
        return this.props.username;
    }

    public canBeEditedBy(userId: string): boolean {
        return this.props.id === userId;
    }

    public toJSON() {
        return {
            ...this.props
        };
    }
}
