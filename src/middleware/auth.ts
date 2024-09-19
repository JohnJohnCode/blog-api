import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_value';

interface DecodedToken {
  id: string;
  username: string;
}

export interface AuthRequest extends Request {
  user: DecodedToken;
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Check if decoded is an object and has the expected properties
    if (
      typeof decoded === 'object' &&
      'id' in decoded &&
      'username' in decoded
    ) {
      (req as AuthRequest).user = decoded as DecodedToken;
      next();
    } else {
      return res.status(403).json({ message: 'Invalid token structure' });
    }
    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
