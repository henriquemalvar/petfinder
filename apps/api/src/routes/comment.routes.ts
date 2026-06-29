import { Router } from 'express';
import { CommentController } from '../controllers/CommentController';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCommentSchema, postIdParamSchema } from '../schemas/comment.schema';

const router = Router({ mergeParams: true });
const controller = new CommentController();

router.get('/', controller.findByPostId);
router.post('/', authMiddleware, validate(createCommentSchema), controller.create);

export default router;
