import { ApolloServer } from '@apollo/server';
import { schema } from '../../schema';
import request from 'supertest';
import express from 'express';
import { prisma } from '../../../utils/prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { expressMiddleware } from '@apollo/server/express4';

const app = express();
let server: ApolloServer;

beforeAll(async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  server = new ApolloServer({
    schema,
  });
  await server.start();

  // Provide context in the expressMiddleware function
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async () => ({
        prisma, // Provide the Prisma client in the context
      }),
    }),
  );
});

afterAll(async () => {
  (console.error as jest.Mock).mockRestore();
  await server.stop();
  jest.restoreAllMocks();
});

describe('User Mutations', () => {
  describe('loginUser mutation', () => {
    it('should login a user and return a token', async () => {
      const mockUser = {
        id: 1,
        username: 'user1',
        password: 'hashed',
        createdAt: new Date(), // Add createdAt
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);
      (jest.spyOn(jwt, 'sign') as jest.Mock).mockReturnValue('fake-jwt-token');

      const LOGIN_USER_MUTATION = `
        mutation {
          loginUser(username: "user1", password: "password") {
            token
            user {
              id
              username
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: LOGIN_USER_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.data.loginUser.token).toBe('fake-jwt-token');
      expect(response.body.data.loginUser.user).toEqual({
        id: '1',
        username: 'user1',
      });
    });

    it('should return error if username or password is invalid', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const LOGIN_USER_MUTATION = `
        mutation {
          loginUser(username: "user1", password: "password") {
            token
            user {
              id
              username
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: LOGIN_USER_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe(
        'Invalid username or password.',
      );
    });
  });

  describe('createUser mutation', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        password: 'hashedpassword',
        createdAt: new Date(), // Add createdAt
      };
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue(
        'hashedpassword',
      );
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      const REGISTER_USER_MUTATION = `
        mutation {
          createUser(username: "newuser", password: "password") {
            id
            username
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: REGISTER_USER_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.data.createUser).toEqual({
        id: '1',
        username: 'newuser',
      });
    });
  });
});
