import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiDocsRouter } from './config/swagger';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { validateEnv } from './config/env';

// Configuração das variáveis de ambiente
dotenv.config();
validateEnv();

const app = express();

if (process.env.VERCEL) {
  app.set('trust proxy', 1);
}

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Documentação Swagger
app.use('/api-docs', apiDocsRouter);

// Rota de health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Rotas da API
app.use('/api', routes);

// Tratamento de erros
app.use(errorHandler);

export { app };
export default app;
