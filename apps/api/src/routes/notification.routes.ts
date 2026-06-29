import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { registerTokenSchema, notifyNearbySchema } from '../schemas/notification.schema';

const router = Router();
const controller = new NotificationController();

router.post('/register', authMiddleware, validate(registerTokenSchema), controller.register);
router.post('/nearby', authMiddleware, validate(notifyNearbySchema), controller.notifyNearby);
router.get('/', authMiddleware, controller.getMyNotifications);
router.patch('/:id/read', authMiddleware, controller.markAsRead);

export default router;
