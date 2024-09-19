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

describe('Post Queries', () => {
  describe('posts query', () => {
    it('should fetch all posts', async () => {
      // Mock data
      const mockPosts = [
        {
          id: 1,
          title: 'Post 1',
          perex: 'Summary of post 1', // Include the perex field
          content: 'Content of post 1',
          authorId: 1,
          createdAt: new Date(),
          author: { id: 1, username: 'user1' },
          comments: [
            {
              id: 1,
              content: 'Comment 1',
              postId: 1,
              authorId: 1,
              score: 0,
              createdAt: new Date(),
            },
          ],
        },
        {
          id: 2,
          title: 'Post 2',
          perex: 'Summary of post 2', // Include the perex field
          content: 'Content of post 2',
          authorId: 2,
          createdAt: new Date(),
          author: { id: 2, username: 'user2' },
          comments: [],
        },
      ];

      // Mock the Prisma `findMany` function
      jest.spyOn(prisma.post, 'findMany').mockResolvedValue(mockPosts);

      const POSTS_QUERY = `
        query {
          posts {
            id
            title
            perex
            content
            author {
              id
              username
            }
            comments {
              id
              content
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: POSTS_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.posts[0].title).toBe('Post 1');
      expect(response.body.data.posts[0].author.username).toBe('user1');
    });

    it('should return error if no posts found', async () => {
      // Mock the Prisma `findMany` function to return an empty array
      jest.spyOn(prisma.post, 'findMany').mockResolvedValue([]);

      const POSTS_QUERY = `
        query {
          posts {
            id
            title
            perex
            content
            author {
              id
              username
            }
            comments {
              id
              content
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: POSTS_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe('No posts found.');
    });
  });

  describe('post query', () => {
    it('should fetch a single post by ID', async () => {
      // Mock data
      const mockPost = {
        id: 1,
        title: 'Post 1',
        perex: 'Summary of post 1', // Include the perex field
        content: 'Content of post 1',
        authorId: 1,
        createdAt: new Date(),
        author: { id: 1, username: 'user1' },
        comments: [
          {
            id: 1,
            content: 'Comment 1',
            postId: 1,
            authorId: 1,
            score: 0,
            createdAt: new Date(),
          },
        ],
      };

      // Mock the Prisma `findUnique` function
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(mockPost);

      const POST_QUERY = `
        query {
          post(id: "1") {
            id
            title
            perex
            content
            author {
              id
              username
            }
            comments {
              id
              content
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: POST_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data.post.title).toBe('Post 1');
      expect(response.body.data.post.author.username).toBe('user1');
    });

    it('should return error if post not found', async () => {
      // Mock the Prisma `findUnique` function to return null
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(null);

      const POST_QUERY = `
        query {
          post(id: "999") {
            id
            title
            perex
            content
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: POST_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe('Post not found.');
    });
  });
});
