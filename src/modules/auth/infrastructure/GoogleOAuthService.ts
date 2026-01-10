import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import { googleClientId, googleClientSecret, googleCallbackUrl } from '../../../config/secrets';
import { userRepository } from '../../user';
import { UserResponse } from '../../../types';

export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{
    value: string;
    verified: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
}

export interface GoogleAuthResult {
  user: UserResponse;
  isNewUser: boolean;
}

class GoogleOAuthService {
  private static instance: GoogleOAuthService;
  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.configurePassport();
  }

  public static getInstance(prisma: PrismaClient): GoogleOAuthService {
    if (!GoogleOAuthService.instance) {
      GoogleOAuthService.instance = new GoogleOAuthService(prisma);
    } else {
      GoogleOAuthService.instance.prisma = prisma;
    }
    return GoogleOAuthService.instance;
  }

  private configurePassport(): void {
    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      console.warn('[OAuth] Google OAuth is not configured - Google authentication will be disabled');
      return;
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: googleCallbackUrl,
          scope: ['profile', 'email']
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: any) => {
          try {
            const result = await this.processGoogleProfile(profile);
            done(null, result);
          } catch (error) {
            console.error('[OAuth] Google strategy error:', error);
            done(error, null);
          }
        }
      )
    );

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    // Deserialize user from session
    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });
  }

  public async processGoogleProfile(profile: Profile): Promise<GoogleAuthResult> {
    try {
      const email = profile.emails?.[0]?.value;
      const googleId = profile.id;
      const displayName = profile.displayName;
      const avatar = profile.photos?.[0]?.value;

      if (!email) {
        throw new Error('No email found in Google profile');
      }

      console.log(`[OAuth] Processing Google profile for email: ${email}`);

      // Try to find existing user by Google ID first
      if (!this.prisma) {
        throw new Error('Prisma client not initialized in GoogleOAuthService');
      }
      let existingUser = await userRepository.findByGoogleId(googleId);

      if (existingUser) {
        console.log(`[OAuth] Found existing user by Google ID: ${email}`);
        return {
          user: this.transformToUserResponse(existingUser.toJSON()),
          isNewUser: false
        };
      }

      // Try to find existing user by email
      existingUser = await userRepository.findByEmail(email);

      if (existingUser) {
        // Link Google account to existing user
        console.log(`[OAuth] Linking Google account to existing user: ${email}`);

        if (existingUser.googleId && existingUser.googleId !== googleId) {
          throw new Error('This email is already linked to a different Google account');
        }

        // Update existing user with Google ID and avatar if not set
        const updatedUser = await userRepository.linkGoogleAccount(
          existingUser.id,
          googleId,
          !existingUser.avatar ? avatar : undefined
        );

        return {
          user: this.transformToUserResponse(updatedUser.toJSON()),
          isNewUser: false
        };
      }

      // Create new user
      console.log(`[OAuth] Creating new user from Google profile: ${email}`);

      // Generate username from display name or email
      let username = this.generateUsernameFromProfile(displayName, email);

      // Ensure username is unique
      username = await this.ensureUniqueUsername(username);

      const userData: any = {
        username,
        email: email.toLowerCase(),
        googleId
      };

      if (avatar) {
        userData.avatar = avatar;
      }

      const newUser = await userRepository.create(userData);

      console.log(`[OAuth] Created new user successfully: ${email}`);

      return {
        user: this.transformToUserResponse(newUser.toJSON()),
        isNewUser: true
      };

    } catch (error) {
      console.error('[OAuth] Error processing Google profile:', error);
      throw error;
    }
  }

  private generateUsernameFromProfile(displayName: string, email: string): string {
    // Try display name first
    if (displayName) {
      return displayName
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
    }

    // Fall back to email username
    const emailUsername = email.split('@')[0];
    if (!emailUsername) {
      return 'user';
    }
    return emailUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  private async ensureUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername;
    let counter = 1;

    while (true) {
      try {
        // Check if username exists
        const existingUser = await this.prisma.user.findUnique({
          where: { username },
          select: { id: true }
        });

        if (!existingUser) {
          return username;
        }

        // Try with counter
        username = `${baseUsername}${counter}`;
        counter++;

        // Prevent infinite loop
        if (counter > 999) {
          throw new Error('Unable to generate unique username');
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Unable to generate unique username') {
          throw error;
        }
        // If it's a database error, the username is probably available
        return username;
      }
    }
  }

  private transformToUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      currentCity: user.currentCity,
      currentCountry: user.currentCountry,
      targetCountry: user.targetCountry,
      techStack: Array.isArray(user.techStack) ? JSON.stringify(user.techStack) : null,
      bio: user.bio,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  public isConfigured(): boolean {
    return !!(googleClientId && googleClientSecret && googleCallbackUrl);
  }

  public getAuthUrl(): string {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth is not configured');
    }
    return '/api/auth/google';
  }

  public getCallbackUrl(): string {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth is not configured');
    }
    return '/api/auth/google/callback';
  }
}

export default GoogleOAuthService;