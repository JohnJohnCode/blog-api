import { prisma } from '../../src/utils/prismaClient';
import { User } from '@prisma/client';
import { getUserByName, createNewUser } from '../../src/services/userService';

describe('userService', () => {
  afterEach(() => {
    // Clear all mocks after each test to ensure a clean slate
    jest.clearAllMocks();
  });

  describe('getUserByName', () => {
    it('should return a user by username', async () => {
      // Arrange: Mock the prisma.user.findUnique method
      const mockUser: User = {
        id: 1,
        username: 'testUser',
        password: 'hashedPassword',
        createdAt: new Date(),
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Act
      const result = await getUserByName('testUser');

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testUser' },
      });
    });

    it('should return null if the user is not found', async () => {
      // Arrange: Mock the prisma.user.findUnique method to return null
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await getUserByName('nonExistentUser');

      // Assert
      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'nonExistentUser' },
      });
    });
  });

  describe('createNewUser', () => {
    it('should create a new user', async () => {
      // Arrange: Mock the prisma.user.create method
      const mockUser: User = {
        id: 1,
        username: 'newUser',
        password: 'hashedPassword',
        createdAt: new Date(),
      };
      const userData = { username: 'newUser', password: 'hashedPassword' };
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      // Act
      const result = await createNewUser(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });
  });
});
