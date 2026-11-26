import { PostType } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { coordsFor, NEIGHBORHOOD_COORDS, postCopy, postTypeFor, SEED_PETS } from '../seedData';

describe('SEED_PETS', () => {
  it('usa só bairros com coordenada conhecida', () => {
    for (const pet of SEED_PETS) {
      expect(NEIGHBORHOOD_COORDS).toHaveProperty(pet.neighborhood);
    }
  });

  it('dá uma foto diferente para cada pet', () => {
    const images = SEED_PETS.map((pet) => pet.image);
    expect(new Set(images).size).toBe(images.length);
  });

  it('mantém cada pet perto do próprio bairro', () => {
    SEED_PETS.forEach((pet, index) => {
      const [lat, lng] = NEIGHBORHOOD_COORDS[pet.neighborhood];
      const { latitude, longitude } = coordsFor(pet.neighborhood, index);
      expect(Math.abs(latitude - lat)).toBeLessThan(0.01);
      expect(Math.abs(longitude - lng)).toBeLessThan(0.01);
    });
  });
});

describe('postCopy', () => {
  const gato = {
    name: 'Luna',
    type: 'CAT',
    breed: 'SRD frajola',
    description: 'Gata muito carinhosa',
    location: 'Sion, Belo Horizonte',
  };

  it('escreve o achado em português, com a espécie e o bairro', () => {
    const { title, content } = postCopy(gato, PostType.FOUND);
    expect(title).toBe('Encontrei um gato');
    expect(content).toContain('Encontrei um gato SRD frajola na região de Sion, Belo Horizonte');
  });

  it('alterna adoção, perdido e encontrado', () => {
    expect([0, 1, 2, 3].map(postTypeFor)).toEqual([
      PostType.ADOPTION,
      PostType.LOST,
      PostType.FOUND,
      PostType.ADOPTION,
    ]);
  });
});
