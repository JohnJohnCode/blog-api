import { ApolloServer } from '@apollo/server';
import { schema } from '../../schema';
import request from 'supertest';
import express from 'express';
import { prisma } from '../../../utils/prismaClient';
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

describe('User Queries', () => {
  describe('users query', () => {
    it('should fetch all users', async () => {
      // Mock prisma to return a list of users
      const mockUsers = [
        { id: 1, username: 'user1', password: 'hashed', createdAt: new Date() },
      ];
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers);

      const GET_USERS_QUERY = `
                query {
                    users {
                        id
                        username
                    }
                }
            `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: GET_USERS_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data.users).toEqual([
        { id: '1', username: 'user1' },
      ]);
    });

    it('should return error if no users found', async () => {
      // Mock prisma to return an empty array
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);

      const GET_USERS_QUERY = `
                query {
                    users {
                        id
                        username
                    }
                }
            `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: GET_USERS_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe('No users found.');
    });
  });

  describe('user query', () => {
    it('should fetch a user by ID', async () => {
      const mockUser = {
        id: 1,
        username: 'user1',
        password: 'hashed',
        createdAt: new Date(),
        posts: [],
        comments: [],
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const GET_USER_QUERY = `
                query {
                    user(id: "1") {
                        id
                        username
                    }
                }
            `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: GET_USER_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data.user).toEqual({ id: '1', username: 'user1' });
    });

    it('should return error if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const GET_USER_QUERY = `
                query {
                    user(id: "1") {
                        id
                        username
                    }
                }
            `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: GET_USER_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe('User not found.');
    });
  });
});
