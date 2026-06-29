import { Router } from 'express';
import { AnnouncementController } from '../controllers/AnnouncementController';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createAnnouncementSchema } from '../schemas/announcement.schema';

const router = Router();
const controller = new AnnouncementController();

router.post('/', authMiddleware, validate(createAnnouncementSchema), controller.create);

export default router;
