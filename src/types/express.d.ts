import 'multer';
import 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: string;
  googleId?: string;
}

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
      user?: AuthenticatedUser;
    }
  }
}

export {}; 