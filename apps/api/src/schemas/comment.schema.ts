import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Comentário não pode ser vazio').max(1000),
  }),
});

export const postIdParamSchema = z.object({
  params: z.object({
    postId: z.string().uuid('ID de post inválido'),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
