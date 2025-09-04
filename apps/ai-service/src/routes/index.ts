import { Router } from 'express';
import QueryRouter from './Query';

const router = Router();

/**
 * Registering /query sub-routes
 */
router.use('/query', QueryRouter);

/**
 * Exporting registered routes
 */
export default router;
