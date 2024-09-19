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

describe('Post Mutations', () => {
  describe('createPost mutation', () => {
    it('should create a new post', async () => {
      const mockPost = {
        id: 1,
        title: 'New Post',
        perex: 'A brief summary',
        content: 'Content of the post',
        authorId: 1,
        createdAt: new Date(),
        author: { id: 1 },
      };

      jest.spyOn(prisma.post, 'create').mockResolvedValue(mockPost);

      const CREATE_POST_MUTATION = `
        mutation {
          createPost(title: "New Post", perex: "A brief summary", content: "Content of the post") {
            id
            title
            perex
            content
            author {
              id
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: CREATE_POST_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.data.createPost).toEqual({
        id: '1',
        title: 'New Post',
        perex: 'A brief summary',
        content: 'Content of the post',
        author: { id: '1' },
      });
    });

    it('should return error if user is not authenticated', async () => {
      // Use a separate express app for the unauthenticated server
      const appUnauth = express();
      const unauthenticatedServer = new ApolloServer({
        schema,
      });

      await unauthenticatedServer.start();

      appUnauth.use(
        '/graphql',
        express.json(),
        expressMiddleware(unauthenticatedServer, {
          context: async () => createTestContext(null), // Provide context here
        }),
      );

      const CREATE_POST_MUTATION = `
          mutation {
            createPost(title: "New Post", perex: "A brief summary", content: "Content of the post") {
              id
              title
            }
          }
        `;

      const response = await request(appUnauth)
        .post('/graphql')
        .send({ query: CREATE_POST_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        'You must be logged in to create a post.',
      );

      await unauthenticatedServer.stop(); // Stop the temporary server
    });
  });

  describe('updatePost mutation', () => {
    it('should update an existing post', async () => {
      const mockPost = {
        id: 1,
        title: 'Updated Post',
        perex: 'Updated summary',
        content: 'Updated content',
        authorId: 1,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(mockPost);
      jest.spyOn(prisma.post, 'update').mockResolvedValue(mockPost);

      const UPDATE_POST_MUTATION = `
        mutation {
          updatePost(postId: "1", data: { title: "Updated Post", content: "Updated content", perex: "Updated summary" }) {
            id
            title
            perex
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: UPDATE_POST_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.data.updatePost).toEqual({
        id: '1',
        title: 'Updated Post',
        perex: 'Updated summary',
        content: 'Updated content',
      });
    });

    it('should return error if user is not authorized to update the post', async () => {
      const mockPost = {
        id: 1,
        title: 'Post',
        perex: 'Summary',
        content: 'Content',
        authorId: 2, // Different author
        createdAt: new Date(),
      };

      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(mockPost);

      const UPDATE_POST_MUTATION = `
        mutation {
          updatePost(postId: "1", data: { title: "Updated Post" }) {
            id
            title
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: UPDATE_POST_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe(
        'You are not authorized to edit this post.',
      );
    });
  });

  describe('deletePost mutation', () => {
    it('should delete a post', async () => {
      const mockPost = {
        id: 1,
        title: 'Post to delete',
        perex: 'Summary',
        content: 'Content',
        authorId: 1,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(mockPost);
      jest.spyOn(prisma.comment, 'deleteMany').mockResolvedValue({ count: 1 }); // Mock comment deletion
      jest.spyOn(prisma.post, 'delete').mockResolvedValue(mockPost);

      const DELETE_POST_MUTATION = `
        mutation {
          deletePost(postId: "1") {
            id
            title
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: DELETE_POST_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.data.deletePost).toEqual({
        id: '1',
        title: 'Post to delete',
      });
    });

    it('should return error if user is not authorized to delete the post', async () => {
      const mockPost = {
        id: 1,
        title: 'Post',
        perex: 'Summary',
        content: 'Content',
        authorId: 2, // Different author
        createdAt: new Date(),
      };

      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(mockPost);

      const DELETE_POST_MUTATION = `
        mutation {
          deletePost(postId: "1") {
            id
            title
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: DELETE_POST_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe(
        'You are not authorized to edit this post.',
      );
    });
  });
});
