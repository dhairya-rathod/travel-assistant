import { Router } from 'express';
import HealthRouter from './health.routes';
import QueryRouter from './query.routes';

const router = Router();

router.use('/health', HealthRouter);
/**
 * Registering /query sub-routes
 */
router.use('/query', QueryRouter);

/**
 * Exporting registered routes
 */
export default router;
