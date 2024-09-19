import { Post } from '@prisma/client';
import {
  Context,
  PostUpdateInput,
  GraphQLContextNoUser,
} from '../../types/index';
import { GraphQLError } from 'graphql';

export const postResolvers = {
  Query: {
    // Fetch all posts
    posts: async (
      _: unknown,
      __: unknown,
      { prisma }: GraphQLContextNoUser,
    ): Promise<Post[]> => {
      try {
        const posts = await prisma.post.findMany({
          include: {
            author: true,
            comments: true,
          },
        });
        if (posts.length === 0) {
          throw new GraphQLError('No posts found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return posts;
      } catch (error) {
        // Check if error is a GraphQLError and should be thrown directly
        if (
          error instanceof GraphQLError &&
          (error.extensions.code === 'NOT_FOUND' ||
            error.extensions.code === 'BAD_USER_INPUT')
        ) {
          throw error; // Rethrow specific error
        }
        // Otherwise, throw a generic error
        throw new GraphQLError('Failed to fetch posts.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Fetch a single post by ID
    post: async (
      _: unknown,
      { id }: { id: string },
      { prisma }: GraphQLContextNoUser,
    ): Promise<Post> => {
      try {
        if (!id) {
          throw new GraphQLError('Please provide a post ID.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        const post = await prisma.post.findUnique({
          where: { id: parseInt(id) },
          include: {
            author: true,
            comments: true,
          },
        });
        if (!post) {
          throw new GraphQLError('Post not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return post;
      } catch (error) {
        // Check if error is a GraphQLError and should be thrown directly
        if (
          error instanceof GraphQLError &&
          (error.extensions.code === 'NOT_FOUND' ||
            error.extensions.code === 'BAD_USER_INPUT')
        ) {
          throw error; // Rethrow specific error
        }
        // Otherwise, throw a generic error
        throw new GraphQLError('Failed to fetch post.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  Mutation: {
    // Create a new post
    createPost: async (
      _: unknown,
      {
        title,
        perex,
        content,
      }: { title: string; perex: string; content: string },
      { user, prisma }: Context,
    ): Promise<Post> => {
      try {
        // Ensure the user is logged in
        if (!user) {
          throw new GraphQLError('You must be logged in to create a post.', {
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          });
        }

        if (!title || !perex || !content) {
          throw new GraphQLError(
            'Title, perex, and content are required fields.',
            {
              extensions: { code: 'BAD_USER_INPUT' },
            },
          );
        }
        return await prisma.post.create({
          data: {
            title,
            perex,
            content,
            author: {
              connect: { id: user.id },
            },
          },
        });
      } catch (error) {
        if (error instanceof GraphQLError && error.extensions.code) {
          throw error; // Rethrow specific error if it has a known code
        }
        throw new GraphQLError('Failed to create a new post.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    updatePost: async (
      _: unknown,
      { postId, data }: { postId: string; data: PostUpdateInput },
      { user, prisma }: Context,
    ): Promise<Post> => {
      try {
        // Ensure the user is logged in
        if (!user) {
          throw new GraphQLError('You must be logged in to update a post.', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        if (!postId) {
          throw new GraphQLError('Post ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Parse postId
        const parsedId = parseInt(postId);

        // Find the post by ID
        const post = await prisma.post.findUnique({
          where: { id: parsedId },
        });

        // If the post is not found, throw an error
        if (!post) {
          throw new GraphQLError('Post not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Ensure the logged-in user is the author of the post
        if (user.id !== post.authorId) {
          throw new GraphQLError('You are not authorized to edit this post.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Validation
        if (!data.title && !data.content && !data.perex) {
          throw new GraphQLError(
            'At least one field (title, content or perex) must be provided.',
            {
              extensions: { code: 'BAD_USER_INPUT' },
            },
          );
        }

        // Proceed with updating the post
        return await prisma.post.update({
          where: { id: parsedId },
          data: {
            title: data.title || post.title,
            perex: data.perex || post.perex,
            content: data.content || post.content,
          },
        });
      } catch (error) {
        if (error instanceof GraphQLError && error.extensions.code) {
          throw error; // Rethrow specific error if it has a known code
        }
        throw new GraphQLError('Failed to update post.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    deletePost: async (
      _: unknown,
      { postId }: { postId: string },
      { user, prisma }: Context,
    ): Promise<Post> => {
      try {
        // Ensure the user is logged in
        if (!user) {
          throw new GraphQLError('You must be logged in to delete a post.', {
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          });
        }

        if (!postId) {
          throw new GraphQLError('Post ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Parse postId
        const parsedId = parseInt(postId);

        // Find the post by ID
        const post = await prisma.post.findUnique({
          where: { id: parsedId },
        });

        // If the post is not found, throw an error
        if (!post) {
          throw new GraphQLError('Post not found.', {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        }

        // Ensure the logged-in user is the author of the post
        if (user.id !== post.authorId) {
          throw new GraphQLError('You are not authorized to edit this post.', {
            extensions: {
              code: 'FORBIDDEN',
            },
          });
        }

        // Find and delete comments of a given post
        await prisma.comment.deleteMany({
          where: { postId: parsedId },
        });

        return await prisma.post.delete({
          where: { id: parsedId },
        });
      } catch (error) {
        if (error instanceof GraphQLError && error.extensions.code) {
          throw error; // Rethrow specific error if it has a known code
        }
        throw new GraphQLError('Failed to delete post.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
};
