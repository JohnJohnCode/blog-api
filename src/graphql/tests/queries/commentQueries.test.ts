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

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async () => ({ prisma }), // Provide Prisma client in context
    }),
  );
});

afterAll(async () => {
  (console.error as jest.Mock).mockRestore();
  await server.stop();
  jest.restoreAllMocks();
});

describe('Comment Queries', () => {
  describe('comments query', () => {
    it('should fetch all comments', async () => {
      const mockComments = [
        {
          id: 1,
          content: 'First comment',
          postId: 1,
          authorId: 1,
          score: 10,
          createdAt: new Date(),
          author: {
            id: 1,
            username: 'user1',
          },
        },
        {
          id: 2,
          content: 'Second comment',
          postId: 1,
          authorId: 2,
          score: 5,
          createdAt: new Date(),
          author: {
            id: 2,
            username: 'user2',
          },
        },
      ];

      jest.spyOn(prisma.comment, 'findMany').mockResolvedValue(mockComments);

      const COMMENTS_QUERY = `
        query {
          comments {
            id
            content
            author {
              id
              username
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: COMMENTS_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data.comments).toEqual([
        {
          id: '1',
          content: 'First comment',
          author: {
            id: '1',
            username: 'user1',
          },
        },
        {
          id: '2',
          content: 'Second comment',
          author: {
            id: '2',
            username: 'user2',
          },
        },
      ]);
    });

    it('should return error if no comments found', async () => {
      jest.spyOn(prisma.comment, 'findMany').mockResolvedValue([]);

      const COMMENTS_QUERY = `
        query {
          comments {
            id
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: COMMENTS_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No comments found.');
    });
  });

  describe('comment query', () => {
    it('should fetch a comment by ID', async () => {
      const mockComment = {
        id: 1,
        content: 'First comment',
        postId: 1,
        authorId: 1,
        score: 10,
        createdAt: new Date(),
        author: {
          id: 1,
          username: 'user1',
        },
      };

      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment);

      const COMMENT_QUERY = `
        query {
          comment(id: "1") {
            id
            content
            author {
              id
              username
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: COMMENT_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data.comment).toEqual({
        id: '1',
        content: 'First comment',
        author: {
          id: '1',
          username: 'user1',
        },
      });
    });

    it('should return error if comment not found', async () => {
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(null);

      const COMMENT_QUERY = `
        query {
          comment(id: "1") {
            id
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: COMMENT_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Comment not found.');
    });

    it('should return error if comment ID is not provided', async () => {
      const COMMENT_QUERY = `
        query {
          comment(id: "") {
            id
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: COMMENT_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        'Please provide a comment ID.',
      );
    });
  });
});
