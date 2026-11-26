import swaggerUi from 'swagger-ui-express';
import openApiSpec from './openapi.json';

export const swaggerSetup = swaggerUi.serve;
export const swaggerDocs = swaggerUi.setup(openApiSpec);
