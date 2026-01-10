export interface CityProps {
    id: string;
    name: string;
    country: string;
    slug?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class City {
    private props: CityProps;

    constructor(props: CityProps) {
        this.props = props;
    }

    get id() { return this.props.id; }
    get name() { return this.props.name; }
    get country() { return this.props.country; }
    get slug() { return this.props.slug; }
    get createdAt() { return this.props.createdAt; }

    public toJSON() {
        return { ...this.props };
    }
}
