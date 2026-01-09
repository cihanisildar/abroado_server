import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// This is crucial for hot-reloading scenarios (like ts-node-dev)
declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

// Create Prisma client with logging in development
const createPrismaClient = (): PrismaClient => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
    });
};

// Singleton pattern to prevent multiple connections
export const prisma = globalThis.__prisma ?? createPrismaClient();

// Store in global in development to survive hot reloads
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}

// Graceful shutdown helper
export const disconnectPrisma = async (): Promise<void> => {
    await prisma.$disconnect();
};

// Health check helper
export const checkDatabaseConnection = async (): Promise<boolean> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
};

export default prisma;
