import express from 'express';
import helmet from 'helmet';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { apiDocsRouter } from '../swagger';

function buildApp(): express.Express {
  const app = express();
  app.use(helmet());
  app.use('/api-docs', apiDocsRouter);
  return app;
}

describe('/api-docs', () => {
  it('serve a página com a interface do cdnjs e integridade conferida', async () => {
    const res = await request(buildApp()).get('/api-docs');

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toMatch(/swagger-ui-bundle\.min\.js" integrity="sha384-/);
    expect(res.text).toMatch(/swagger-ui\.min\.css" integrity="sha384-/);
  });

  it('libera só o cdnjs como origem externa de scripts na página', async () => {
    const res = await request(buildApp()).get('/api-docs');

    expect(res.headers['content-security-policy']).toContain(
      "script-src 'self' https://cdnjs.cloudflare.com",
    );
  });

  it('serve o script de inicialização sem depender de script inline', async () => {
    const res = await request(buildApp()).get('/api-docs/init.js');

    expect(res.status).toBe(200);
    expect(res.type).toBe('application/javascript');
    expect(res.text).toContain("url: '/api-docs/openapi.json'");
  });

  it('serve a especificação com as rotas documentadas', async () => {
    const res = await request(buildApp()).get('/api-docs/openapi.json');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
  });
});
