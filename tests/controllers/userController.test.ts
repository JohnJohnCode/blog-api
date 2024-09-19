import { Request, Response } from 'express';
import { registerUser, loginUser } from '../../src/controllers/userController';
import { getUserByName, createNewUser } from '../../src/services/userService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

// Mock the service functions and other dependencies
jest.mock('../../src/services/userService');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('userController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {}); // Suppress console.error

    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorMock.mockRestore(); // Restore console.error after each test
  });

  describe('registerUser', () => {
    it('should register a new user', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        createdAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (createNewUser as jest.Mock).mockResolvedValue(mockUser);

      req.body = { username: 'testuser', password: 'password' };

      await registerUser(req as Request, res as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(createNewUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'hashedpassword',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: { id: 1, username: 'testuser' },
      });
    });

    it('should handle errors during registration', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      req.body = { username: 'testuser', password: 'password' };

      await registerUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error registering user',
      });
    });
  });

  describe('loginUser', () => {
    it('should log in a user with valid credentials', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        createdAt: new Date(),
      };

      (getUserByName as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

      req.body = { username: 'testuser', password: 'password' };

      await loginUser(req as Request, res as Response);

      expect(getUserByName).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, username: 'testuser' },
        expect.any(String),
        { expiresIn: '1h' },
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'fake-jwt-token',
      });
    });

    it('should return 401 if username or password is incorrect', async () => {
      (getUserByName as jest.Mock).mockResolvedValue(null); // Simulate user not found

      req.body = { username: 'testuser', password: 'password' };

      await loginUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid username or password',
      });
    });

    it('should handle errors during login', async () => {
      (getUserByName as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      req.body = { username: 'testuser', password: 'password' };

      await loginUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error logging in' });
    });
  });
});
