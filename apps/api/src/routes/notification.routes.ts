import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new NotificationController();

router.get('/', authMiddleware, controller.getMyNotifications);
router.patch('/:id/read', authMiddleware, controller.markAsRead);

export default router;
