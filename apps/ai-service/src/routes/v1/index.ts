import { Router } from 'express';
import QueryRouter from './query.routes';

const router = Router();

/**
 * Registering /query sub-routes
 */
router.use('/query', QueryRouter);

/**
 * Exporting registered routes
 */
export default router;
