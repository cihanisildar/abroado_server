import swaggerOutput from './swagger-output.json';

// Bu dosya artık sadece build vaktinde üretilen JSON spec'ini servis eder.
// SSOT: src/ içindeki route dosyalarıdır (generate-swagger.js onları okur).
export const swaggerSpec = swaggerOutput;
