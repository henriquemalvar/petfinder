import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';

export function buildOpenApiSpec(): object {
  return swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'PetFinder API',
        version: '1.0.0',
        description: 'API para o sistema PetFinder',
      },
      servers: [{ url: '/', description: 'Esta API' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: [path.join(__dirname, '../routes/*.ts')],
  });
}
