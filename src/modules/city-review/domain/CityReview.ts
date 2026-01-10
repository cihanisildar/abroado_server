export interface CityReviewProps {
    id: string;
    userId: string;
    cityId: string;
    title?: string | null;
    // Ratings
    jobOpportunities: number;
    costOfLiving: number;
    safety: number;
    transport: number;
    community: number;
    healthcare: number;
    education: number;
    nightlife: number;
    weather: number;
    internet: number;
    // Content
    pros: string[];
    cons: string[];
    note?: string | null;
    images: string[];
    language?: string | null;
    // Stats
    likes: number; // Legacy?
    upvotes: number;
    downvotes: number;
    commentsCount: number;
    createdAt: Date;
    updatedAt: Date;
    // Relations/Metadata
    user?: {
        id: string;
        username: string;
        avatar: string | null;
        role: any;
    };
    city?: {
        id: string;
        name: string;
        country: string;
        slug?: string;
    };
    userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
    isSaved?: boolean;
}

export class CityReview {
    private props: CityReviewProps;

    constructor(props: CityReviewProps) {
        this.props = props;
    }

    get id() { return this.props.id; }
    get userId() { return this.props.userId; }
    get cityId() { return this.props.cityId; }
    get title() { return this.props.title; }

    get jobOpportunities() { return this.props.jobOpportunities; }
    get costOfLiving() { return this.props.costOfLiving; }
    get safety() { return this.props.safety; }
    get transport() { return this.props.transport; }
    get community() { return this.props.community; }

    // Computed
    get averageRating() {
        return (
            this.props.jobOpportunities +
            this.props.costOfLiving +
            this.props.safety +
            this.props.transport +
            this.props.community
        ) / 5;
    }

    public toJSON() {
        return {
            ...this.props,
            averageRating: this.averageRating
        };
    }

    public canBeEditedBy(userId: string): boolean {
        return this.props.userId === userId;
    }
}
