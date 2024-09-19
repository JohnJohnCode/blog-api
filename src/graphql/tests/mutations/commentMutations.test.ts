import { ApolloServer } from '@apollo/server';
import { schema } from '../../schema';
import request from 'supertest';
import express from 'express';
import { prisma } from '../../../utils/prismaClient';
import { expressMiddleware } from '@apollo/server/express4';
import { Context } from '../../../types';

const app = express();
let server: ApolloServer;

// Helper function to simulate context with an authenticated user
const createTestContext = (
  user: { id: number; username: string; createdAt: Date } | null,
): Context => ({
  user: user
    ? { id: user.id, username: user.username, createdAt: new Date() }
    : undefined,
  prisma,
  req: { ip: '127.0.0.1' }, // Add req to context
});

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
      context: async () =>
        createTestContext({
          id: 1,
          username: 'testuser',
          createdAt: new Date(),
        }),
    }),
  );
});

afterAll(async () => {
  (console.error as jest.Mock).mockRestore();
  await server.stop();
  jest.restoreAllMocks();
});

describe('Comment Mutations', () => {
  describe('createComment mutation', () => {
    it('should return error if user is not authenticated', async () => {
      // Create a new instance of the server without including a user in the context
      const unauthenticatedServer = new ApolloServer({
        schema,
      });

      await unauthenticatedServer.start();

      const unauthenticatedApp = express();
      unauthenticatedApp.use(
        '/graphql',
        express.json(),
        expressMiddleware(unauthenticatedServer, {
          context: async () => ({
            prisma,
            req: { ip: '127.0.0.1' }, // Include `req` without `user`
            user: null, // Explicitly set user to `null`
          }),
        }),
      );

      const CREATE_COMMENT_MUTATION = `
          mutation {
            createComment(postId: "1", content: "This is a comment") {
              id
              content
            }
          }
        `;

      const response = await request(unauthenticatedApp)
        .post('/graphql')
        .send({ query: CREATE_COMMENT_MUTATION });

      expect(response.status).toBe(200); // GraphQL returns 200 even on errors
      expect(response.body.errors).toBeDefined(); // Ensure errors field is defined
      expect(response.body.errors[0].message).toBe(
        'You must be logged in to post a comment.',
      ); // Correct message here

      await unauthenticatedServer.stop();
    });
  });

  describe('updateComment mutation', () => {
    it('should update an existing comment', async () => {
      const mockComment = {
        id: 1,
        content: 'Updated comment',
        postId: 1,
        authorId: 1,
        createdAt: new Date(),
        score: 0,
      };

      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment);
      jest.spyOn(prisma.comment, 'update').mockResolvedValue(mockComment);

      const UPDATE_COMMENT_MUTATION = `
        mutation {
          updateComment(commentId: "1", content: "Updated comment") {
            id
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: UPDATE_COMMENT_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.data.updateComment).toEqual({
        id: '1',
        content: 'Updated comment',
      });
    });

    it('should return error if user is not authorized to update the comment', async () => {
      const mockComment = {
        id: 1,
        content: 'Comment',
        postId: 1,
        authorId: 2, // Different author
        createdAt: new Date(),
        score: 0,
      };

      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment);

      const UPDATE_COMMENT_MUTATION = `
        mutation {
          updateComment(commentId: "1", content: "Updated comment") {
            id
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: UPDATE_COMMENT_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe(
        'You are not authorized to edit this comment.',
      );
    });
  });

  describe('voteComment mutation', () => {
    it('should upvote a comment', async () => {
      const mockComment = {
        id: 1,
        content: 'This is a comment',
        postId: 1,
        authorId: 1,
        createdAt: new Date(),
        score: 1,
      };

      // Mock the Prisma operations
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment); // Mock comment retrieval
      jest.spyOn(prisma.vote, 'findUnique').mockResolvedValue(null); // No existing vote
      jest.spyOn(prisma.vote, 'create').mockResolvedValue({
        id: 1,
        ip: '127.0.0.1',
        value: 1,
        commentId: 1,
        createdAt: new Date(),
      }); // Mock vote creation
      jest.spyOn(prisma.comment, 'update').mockResolvedValue(mockComment); // Mock the updated comment

      const VOTE_COMMENT_MUTATION = `
        mutation {
          voteComment(commentId: "1", type: "upvote") {
            id
            score
          }
        }
      `;

      // Perform the GraphQL request
      const response = await request(app)
        .post('/graphql')
        .set('Content-Type', 'application/json')
        .send({ query: VOTE_COMMENT_MUTATION });

      // Ensure response has a data field and that it's not null
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined(); // Check if data is defined
      expect(response.body.data).not.toBeNull(); // Ensure it's not null

      // Check if voteComment is present in the response
      expect(response.body.data.voteComment).toBeDefined();
      expect(response.body.data.voteComment).toEqual({
        id: '1',
        score: 1,
      });
    });
  });

  describe('deleteComment mutation', () => {
    it('should delete a comment', async () => {
      const mockComment = {
        id: 1,
        content: 'This is a comment',
        postId: 1,
        authorId: 1,
        createdAt: new Date(),
        score: 0,
      };

      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment);
      jest.spyOn(prisma.comment, 'delete').mockResolvedValue(mockComment);

      const DELETE_COMMENT_MUTATION = `
        mutation {
          deleteComment(commentId: "1") {
            id
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: DELETE_COMMENT_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.data.deleteComment).toEqual({
        id: '1',
        content: 'This is a comment',
      });
    });

    it('should return error if user is not authorized to delete the comment', async () => {
      const mockComment = {
        id: 1,
        content: 'This is a comment',
        postId: 1,
        authorId: 2, // Different author
        createdAt: new Date(),
        score: 0,
      };

      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment);

      const DELETE_COMMENT_MUTATION = `
        mutation {
          deleteComment(commentId: "1") {
            id
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: DELETE_COMMENT_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe(
        'You are not authorized to delete this comment.',
      );
    });
  });
});
