import { Request, Response } from 'express';
import { getUserByName, createNewUser } from '../services/userService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const SALT_ROUNDS = 10; // salt rounds for bcrypt
const JWT_SECRET = process.env.JWT_SECRET || 'fallback';

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { username, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the new user
    const newUser: User = await createNewUser({
      username,
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser.id, username: newUser.username },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
};

// Login User
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user: User | null = await getUserByName(username);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Compare the passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
    res.json({ message: 'Login successful', token });
    return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
};
