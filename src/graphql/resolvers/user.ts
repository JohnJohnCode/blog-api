import { User } from '@prisma/client';
import { GraphQLContextNoUser } from '../../types/index';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const userResolvers = {
  Query: {
    // Fetch all users
    users: async (
      _: unknown,
      __: unknown,
      { prisma }: GraphQLContextNoUser,
    ): Promise<User[]> => {
      try {
        // Find all users and return them if at least one exists
        const users = await prisma.user.findMany();
        if (users.length === 0) {
          throw new GraphQLError('No users found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return users;
      } catch (error) {
        if (
          error instanceof GraphQLError &&
          error.extensions.code === 'NOT_FOUND'
        ) {
          throw error;
        }
        throw new GraphQLError('Failed to fetch users.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Fetch a single user by ID
    user: async (
      _: unknown,
      { id }: { id: string },
      { prisma }: GraphQLContextNoUser,
    ): Promise<User> => {
      try {
        // Check if ID was provided
        if (!id) {
          throw new GraphQLError('Please provide a user ID.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        // Find user and return if found
        const user = await prisma.user.findUnique({
          where: { id: parseInt(id) },
          include: {
            posts: true,
            comments: true,
          },
        });
        if (!user) {
          throw new GraphQLError('User not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return user;
      } catch (error) {
        if (
          error instanceof GraphQLError &&
          (error.extensions.code === 'NOT_FOUND' ||
            error.extensions.code === 'BAD_USER_INPUT')
        ) {
          throw error;
        }
        throw new GraphQLError('Failed to fetch users.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  Mutation: {
    // Login user
    loginUser: async (
      _: unknown,
      { username, password }: { username: string; password: string },
      { prisma }: GraphQLContextNoUser,
    ): Promise<{ token: string; user: User }> => {
      try {
        if (!username || !password) {
          throw new GraphQLError('Username and password are required fields.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        // Find the user by username
        const user = await prisma.user.findUnique({
          where: { username },
        });

        // If user does not exist, throw an error
        if (!user) {
          throw new GraphQLError('Invalid username or password.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Compare the password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new GraphQLError('Invalid username or password.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username },
          process.env.JWT_SECRET || 'fallback_secret',
          {
            expiresIn: '1h',
          },
        );

        // Return the token and the user data
        return {
          token,
          user,
        };
      } catch (error) {
        // Only throw the original error if it's a GraphQLError with the expected codes
        if (
          error instanceof GraphQLError &&
          (error.extensions.code === 'BAD_USER_INPUT' ||
            error.extensions.code === 'INTERNAL_SERVER_ERROR')
        ) {
          throw error;
        }

        // Otherwise, throw a generic error
        throw new GraphQLError('Failed to log in.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Create a new user (registration)
    createUser: async (
      _: unknown,
      { username, password }: { username: string; password: string },
      { prisma }: GraphQLContextNoUser,
    ): Promise<User> => {
      try {
        // Check if username and password were provided
        if (!username || !password) {
          throw new GraphQLError('Username and password are required fields.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        return await prisma.user.create({
          data: {
            username,
            password: hashedPassword,
          },
        });
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to register.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
};
