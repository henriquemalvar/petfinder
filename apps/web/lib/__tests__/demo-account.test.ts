import { describe, expect, it } from 'vitest';
import { demoCredentials } from '../demo-account';

describe('demoCredentials', () => {
  it('devolve as credenciais quando e-mail e senha estão definidos', () => {
    expect(demoCredentials(' demo@petfinder.example ', 'senha-demo')).toEqual({
      email: 'demo@petfinder.example',
      password: 'senha-demo',
    });
  });

  it('esconde a demo quando falta e-mail ou senha', () => {
    expect(demoCredentials(undefined, 'senha-demo')).toBeNull();
    expect(demoCredentials('demo@petfinder.example', undefined)).toBeNull();
    expect(demoCredentials('  ', 'senha-demo')).toBeNull();
  });
});
