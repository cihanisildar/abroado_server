import { PostCategory } from '@prisma/client';

export interface PostProps {
    id: string;
    title: string;
    content: string;
    category: PostCategory;
    tags: string[];
    images: string[];
    userId: string;
    cityId?: string | null;
    upvotes: number;
    downvotes: number;
    commentsCount: number;
    viewsCount: number;
    createdAt: Date;
    updatedAt: Date;
    // Metadata for the current user
    isUpvoted?: boolean;
    isDownvoted?: boolean;
    isSaved?: boolean;
    // Relations (optional for the core entity, often handled by separate DTOs or loaded as needed)
    author?: {
        id: string;
        username: string;
        avatar: string | null;
    };
    city?: {
        id: string;
        name: string;
        country: string;
    } | null;
}

export class Post {
    private props: PostProps;

    constructor(props: PostProps) {
        this.props = props;
    }

    get id(): string { return this.props.id; }
    get title(): string { return this.props.title; }
    get content(): string { return this.props.content; }
    get category(): PostCategory { return this.props.category; }
    get tags(): string[] { return this.props.tags; }
    get images(): string[] { return this.props.images; }
    get userId(): string { return this.props.userId; }
    get cityId(): string | null | undefined { return this.props.cityId; }
    get upvotes(): number { return this.props.upvotes; }
    get downvotes(): number { return this.props.downvotes; }
    get commentsCount(): number { return this.props.commentsCount; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get isUpvoted(): boolean { return !!this.props.isUpvoted; }
    get isDownvoted(): boolean { return !!this.props.isDownvoted; }
    get isSaved(): boolean { return !!this.props.isSaved; }
    get author() { return this.props.author; }
    get city() { return this.props.city; }

    // Behavioral methods
    public canBeEditedBy(userId: string): boolean {
        return this.props.userId === userId;
    }

    public canBeDeletedBy(userId: string): boolean {
        return this.props.userId === userId;
    }

    public toJSON() {
        return {
            ...this.props
        };
    }

    // Static factor methods could be added here for creation
    public static create(props: PostProps): Post {
        return new Post(props);
    }
}
