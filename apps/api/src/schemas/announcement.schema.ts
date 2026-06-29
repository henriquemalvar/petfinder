import { z } from 'zod';
import { PetGender, PetSize } from '@prisma/client';
import { postTypeEnum } from './post.schema';

export const createAnnouncementSchema = z.object({
  body: z.object({
    type: postTypeEnum,
    title: z.string().min(3).optional(),
    content: z.string().min(10).optional(),
    pet: z.object({
      name: z.string().min(2),
      type: z.string().min(2),
      breed: z.string().min(2),
      age: z.string().min(1),
      gender: z.nativeEnum(PetGender),
      size: z.nativeEnum(PetSize),
      image: z.string().url().optional(),
      description: z.string().min(10),
      castrated: z.boolean(),
      vaccinated: z.boolean(),
      location: z.string().min(2),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    }),
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
    contactPreference: z.string().optional(),
    sharePhonePublicly: z.boolean().optional(),
  }),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>['body'];
