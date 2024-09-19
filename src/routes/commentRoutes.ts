import express from 'express';
import {
  getComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  voteOnComment,
} from '../controllers/commentController';
import { authenticateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Fetch all comments
router.get('/', getComments);
// Fetch a comment by ID
router.get('/:id', getComment);
// Create a new comment
router.post(
  '/',
  authenticateJWT,
  [
    body('content')
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Content must be between 3 and 500 characters'),
  ],
  validateRequest,
  createComment,
);
// Update a comment by ID
router.put(
  '/:id',
  authenticateJWT,
  [
    body('content')
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Content must be between 3 and 500 characters'),
  ],
  validateRequest,
  updateComment,
);
// Delete a comment by ID
router.delete('/:id', authenticateJWT, deleteComment);
// Vote on a comment by ID
router.post('/:id/vote', authenticateJWT, voteOnComment);

export default router;
