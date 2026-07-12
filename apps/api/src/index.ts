import { app } from './server';
import { validateEnv } from './config/env';

validateEnv();

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
