export interface CommentProps {
    id: string;
    userId: string;
    postId: string;
    parentCommentId: string | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    // Relations/Metadata
    user?: {
        id: string;
        username: string;
        avatar: string | null;
    };
    upvotes: number;
    downvotes: number;
    userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
    replies?: Comment[];
}

export class Comment {
    private props: CommentProps;

    constructor(props: CommentProps) {
        this.props = props;
    }

    get id() { return this.props.id; }
    get userId() { return this.props.userId; }
    get postId() { return this.props.postId; }
    get content() { return this.props.content; }
    get replies() { return this.props.replies || []; }
    get parentCommentId() { return this.props.parentCommentId; }
    get createdAt() { return this.props.createdAt; }

    public toJSON(): any {
        return {
            ...this.props,
            replies: this.props.replies?.map(r => r.toJSON())
        };
    }

    public canBeEditedBy(userId: string): boolean {
        return this.props.userId === userId;
    }
}
