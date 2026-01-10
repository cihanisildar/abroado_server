// Export user types
export * from './user.types';

// Re-export validation schemas and utilities
export * from './validations';

// Re-export response types and utilities
export * from './responses';

// Core DTO interfaces
export interface CityDto {
  name: string;
  country: string;
}

export interface MessageDto {
  content: string;
}

// Query interfaces
export interface CityQuery {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  countryCode?: string;
}

export interface PostQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  cityId?: string;
  userId?: string;
}

export interface CityReviewQuery {
  page?: number;
  limit?: number;
  cityId?: string;
  userId?: string;
}

// Use inferred type from schema instead of manual interface
export type { UserQuery } from './validations/query';

export interface RoomQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  country?: string;
  isPublic?: boolean;
}

// Additional DTO interfaces
export interface RoomDto {
  name: string;
  description?: string;
  type: 'COUNTRY' | 'STUDY' | 'INTERVIEW' | 'LANGUAGE' | 'GENERAL';
  country?: string;
  isPublic?: boolean;
  maxMembers?: number;
}

export interface CityReviewDto {
  cityName: string;
  country: string;
  title?: string;
  jobOpportunities: number;
  costOfLiving: number;
  safety: number;
  transport: number;
  community: number;
  healthcare?: number;
  education?: number;
  nightlife?: number;
  weather?: number;
  internet?: number;
  pros?: string[];
  cons?: string[];
  note?: string;
  images?: string[];
  likes?: number; // legacy
  language?: string;
}

export type UpdateCityReviewDto = Partial<CityReviewDto>;

export interface CommentDto {
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentDto {
  content?: string;
}

export interface UpdateUserDto {
  username?: string;
  currentCity?: string;
  currentCountry?: string;
  targetCountry?: string;
  techStack?: string[];
  bio?: string;
  avatar?: string;
}