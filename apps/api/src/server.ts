import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { swaggerDocs, swaggerSetup } from './config/swagger';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

// Configuração das variáveis de ambiente
dotenv.config();

const app = express();

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
app.use('/api-docs', swaggerSetup, swaggerDocs);

// Rota de health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Rotas da API
app.use('/api', routes);

// Tratamento de erros
app.use(errorHandler);

export { app };
