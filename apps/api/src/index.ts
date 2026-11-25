import { app } from './server';
import { validateEnv } from './config/env';

validateEnv();

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

export default app;
