import { RequestHandler, Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import announcementRoutes from './announcement.routes';
import authRoutes from './auth.routes';
import commentRoutes from './comment.routes';
import notificationRoutes from './notification.routes';
import petRoutes from './pet.routes';
import postRoutes from './post.routes';
import uploadRoutes from './upload.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/posts/:postId/comments', commentRoutes);
router.use('/announcements', announcementRoutes);
router.use('/users', authMiddleware as RequestHandler, userRoutes);
router.use('/pets', authMiddleware as RequestHandler, petRoutes);
router.use('/notifications', authMiddleware as RequestHandler, notificationRoutes);
router.use('/uploads', authMiddleware as RequestHandler, uploadRoutes);

export default router; 
