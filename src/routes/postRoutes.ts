import express from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController';
import { authenticateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Fetch all posts
router.get('/', getPosts);
// Fetch a post by ID
router.get('/:id', getPost);
// Create a new post
router.post(
  '/',
  authenticateJWT,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('perex')
      .trim()
      .isLength({ min: 10, max: 300 })
      .withMessage('Perex must be between 10 and 300 characters'),
    body('content')
      .trim()
      .isLength({ min: 20, max: 1000 })
      .withMessage('Content must be between 20 and 1000 characters long'),
  ],
  validateRequest,
  createPost,
);
// Update a post by ID
router.put(
  '/:id',
  authenticateJWT,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('perex')
      .trim()
      .isLength({ min: 10, max: 300 })
      .withMessage('Perex must be between 10 and 300 characters'),
    body('content')
      .trim()
      .isLength({ min: 20, max: 1000 })
      .withMessage('Content must be between 20 and 1000 characters long'),
  ],
  validateRequest,
  updatePost,
);
// Delete a post by ID
router.delete('/:id', authenticateJWT, deletePost);

export default router;
