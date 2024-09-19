import express from 'express';
import postRoutes from './postRoutes';
import userRoutes from './userRoutes';
import commentRoutes from './commentRoutes';

const router = express.Router();

// Combine all the route modules under specific paths
router.use('/posts', postRoutes);
router.use('/users', userRoutes);
router.use('/comments', commentRoutes);

export default router;
