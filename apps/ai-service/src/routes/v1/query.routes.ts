import { Router } from 'express';
import { QueryController } from '../../controller';

const router = Router();

router.post('/', QueryController.handleQuery);

export default router;
