// src/authRouter.ts
import { Router } from 'express';
import { login, me, register, registerPortal, requireAuth } from './auth';

const router = Router();

router.post('/register', register);
router.post('/register-portal', registerPortal);
router.post('/login', login);
router.get('/me', requireAuth, me);

export default router;
