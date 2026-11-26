import { Request, Response, Router } from 'express';
import openApiSpec from './openapi.json';

const SWAGGER_UI_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.32.6';
const SWAGGER_UI_CSS_INTEGRITY = 'sha384-t+xR1+l3C4rTHMactcWnWen/jchBVOMzn09MICqTKVD6YGLnmwujA/PPRJrjFyK3';
const SWAGGER_UI_JS_INTEGRITY = 'sha384-KnJzEg5SbnfkhaOriZGtudz3KPz1CjJI5N41ia+ucVD7ZVkhdBQav3oPEoFhEEEH';

export const DOCS_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' https://cdnjs.cloudflare.com`,
  `style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com`,
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

const docsPage = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PetFinder API</title>
    <link rel="stylesheet" href="${SWAGGER_UI_CDN}/swagger-ui.min.css" integrity="${SWAGGER_UI_CSS_INTEGRITY}" crossorigin="anonymous" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI_CDN}/swagger-ui-bundle.min.js" integrity="${SWAGGER_UI_JS_INTEGRITY}" crossorigin="anonymous"></script>
    <script src="/api-docs/init.js"></script>
  </body>
</html>
`;

const initScript = "window.ui = SwaggerUIBundle({ url: '/api-docs/openapi.json', dom_id: '#swagger-ui' });\n";

export const apiDocsRouter = Router();

apiDocsRouter.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Security-Policy', DOCS_CONTENT_SECURITY_POLICY);
  res.type('html').send(docsPage);
});

apiDocsRouter.get('/init.js', (_req: Request, res: Response) => {
  res.type('application/javascript').send(initScript);
});

apiDocsRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});
