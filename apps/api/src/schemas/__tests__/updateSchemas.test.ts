import { describe, it, expect } from 'vitest';
import { updatePostSchema } from '../post.schema';
import { updatePetSchema } from '../pet.schema';
import { updateUserSchema } from '../user.schema';

/**
 * Regressão do bug do partial(): fazer createSchema.partial() no objeto de
 * cima só torna a chave `body` opcional, deixando os campos internos
 * obrigatórios, o que quebrava qualquer PATCH/PUT parcial com 400. A forma
 * correta é partial() no shape.body. Estes testes exercitam o zod direto (sem
 * mock de repositório), que é justamente onde os testes de service não pegavam.
 */
describe('update schemas aceitam body parcial', () => {
  it('updatePostSchema aceita só status', () => {
    const parsed = updatePostSchema.parse({ body: { status: 'RESOLVED' } });
    expect(parsed.body.status).toBe('RESOLVED');
  });

  it('updatePetSchema aceita só name', () => {
    const parsed = updatePetSchema.parse({ body: { name: 'Rex' } });
    expect(parsed.body.name).toBe('Rex');
  });

  it('updateUserSchema aceita só contactPreference', () => {
    const parsed = updateUserSchema.parse({ body: { contactPreference: 'INSTAGRAM' } });
    expect(parsed.body.contactPreference).toBe('INSTAGRAM');
  });

  it('updateUserSchema aceita body vazio', () => {
    expect(() => updateUserSchema.parse({ body: {} })).not.toThrow();
  });

  it('updateUserSchema ainda valida os campos presentes', () => {
    expect(() => updateUserSchema.parse({ body: { avatar: 'nao-e-url' } })).toThrow();
    expect(() =>
      updateUserSchema.parse({ body: { contactPreference: 'TELEGRAM' } }),
    ).toThrow();
  });
});
