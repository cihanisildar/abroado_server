import { Request } from 'express';
import { AuthenticatedUser } from '../types/express';

/**
 * Utility function to get the authenticated user from the request with proper typing
 */
export const getAuthenticatedUser = (req: Request): AuthenticatedUser => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user as AuthenticatedUser;
};

/**
 * Utility function to get the authenticated user ID from the request
 */
export const getAuthenticatedUserId = (req: Request): string => {
  return getAuthenticatedUser(req).id;
};

/**
 * Utility function to safely get the authenticated user from the request (returns undefined if not authenticated)
 */
export const getOptionalAuthenticatedUser = (req: Request): AuthenticatedUser | undefined => {
  return req.user ? (req.user as AuthenticatedUser) : undefined;
};

/**
 * Utility function to safely get the authenticated user ID from the request (returns undefined if not authenticated)
 */
export const getOptionalAuthenticatedUserId = (req: Request): string | undefined => {
  const user = getOptionalAuthenticatedUser(req);
  return user ? user.id : undefined;
};

/**
 * Utility function to get the authenticated user role from the request
 */
export const getAuthenticatedUserRole = (req: Request): string => {
  return getAuthenticatedUser(req).role;
};