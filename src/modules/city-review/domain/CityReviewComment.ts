export interface CityReviewCommentProps {
    id: string;
    userId: string;
    cityReviewId: string;
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
    replies?: CityReviewComment[];
}

export class CityReviewComment {
    private props: CityReviewCommentProps;

    constructor(props: CityReviewCommentProps) {
        this.props = props;
    }

    get id() { return this.props.id; }
    get userId() { return this.props.userId; }
    get cityReviewId() { return this.props.cityReviewId; }
    get content() { return this.props.content; }
    get replies() { return this.props.replies || []; }
    get parentCommentId() { return this.props.parentCommentId; }
    get createdAt() { return this.props.createdAt; }

    public toJSON(): object {
        return {
            ...this.props,
            replies: this.props.replies?.map(r => r.toJSON())
        };
    }

    public canBeEditedBy(userId: string): boolean {
        return this.props.userId === userId;
    }
}
