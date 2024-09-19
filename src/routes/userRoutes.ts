import express from 'express';
import { registerUser, loginUser } from '../controllers/userController';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Register a new user
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 15 })
      .withMessage('Username must be between 3 and 15 characters'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validateRequest,
  registerUser,
);
// Log a user in
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Please enter a username'),
    body('password').trim().notEmpty().withMessage('Please enter a password'),
  ],
  validateRequest,
  loginUser,
);

export default router;
