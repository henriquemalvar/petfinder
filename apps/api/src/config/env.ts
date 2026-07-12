/**
 * Leitura de variáveis de ambiente obrigatórias com falha explícita.
 * Evita fallbacks inseguros (ex.: JWT_SECRET com valor padrão), que
 * permitiriam forjar tokens caso a env não fosse configurada em produção.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export function getJwtSecret(): string {
  return requireEnv('JWT_SECRET');
}

/**
 * Valida no boot todas as envs críticas, para o servidor falhar cedo
 * em vez de subir num estado inseguro.
 */
export function validateEnv(): void {
  requireEnv('JWT_SECRET');
  requireEnv('DATABASE_URL');
}
