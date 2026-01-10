const swaggerAutogen = require('swagger-autogen')({ autoHeaders: false });
const fs = require('fs');

const doc = {
    info: {
        title: 'Gurbetci Server API',
        version: '2.0.0',
        description: 'A comprehensive API for the Gurbetci platform',
    },
    host: 'localhost',
    basePath: '/',
    schemes: ['http', 'https'],
    tags: [
        { name: 'Auth', description: 'Authentication and Profile Management' },
        { name: 'Reviews', description: 'City Reviews and Ratings' },
        { name: 'Users', description: 'User Directory and Activity' },
        { name: 'Posts', description: 'Community Discussions' },
        { name: 'Rooms', description: 'Real-time Chat Rooms' },
        { name: 'Cities', description: 'Global City Database' },
        { name: 'Comments', description: 'Generic Comments API' },
        { name: 'System', description: 'Internal Server Utilities' }
    ],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'JWT Authorization header using the Bearer scheme.'
        }
    },
    definitions: {
        User: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                username: { type: 'string' },
                role: { type: 'string', enum: ['EXPLORER', 'ABROADER'] },
                currentCity: { type: 'string' },
                avatar: { type: 'string' }
            }
        },
        Post: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                content: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                likesCount: { type: 'integer' },
                commentsCount: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' }
            }
        },
        Room: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['COUNTRY', 'STUDY', 'INTERVIEW', 'LANGUAGE', 'GENERAL'] },
                memberCount: { type: 'integer' }
            }
        },
        City: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                country: { type: 'string' },
                slug: { type: 'string' }
            }
        },
        CityReview: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                safety: { type: 'integer', minimum: 1, maximum: 5 },
                costOfLiving: { type: 'integer', minimum: 1, maximum: 5 },
                note: { type: 'string' }
            }
        },
        Comment: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                content: { type: 'string' },
                score: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' }
            }
        },
        AuthResponse: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                data: {
                    type: 'object',
                    properties: { user: { $ref: '#/definitions/User' } }
                }
            }
        },
        ApiResponse: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                data: { type: 'object' }
            }
        }
    }
};

const outputFile = './src/config/swagger-output.json';
const endpointsFiles = [
    './src/index.ts',
    './src/modules/auth/presentation/routes/index.ts',
    './src/modules/user/presentation/routes/index.ts',
    './src/modules/post/presentation/routes/index.ts',
    './src/modules/room/presentation/routes/index.ts',
    './src/modules/city/presentation/routes/index.ts',
    './src/modules/city-review/presentation/routes/index.ts',
    './src/modules/city-review/presentation/routes/commentRoutes.ts',
    './src/modules/comment/presentation/routes/index.ts',
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log('✅ Swagger spec generated with all definitions!');
});
