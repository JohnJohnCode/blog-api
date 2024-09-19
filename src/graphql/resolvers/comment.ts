import { Comment, PrismaClient } from '@prisma/client';
import { Context, GraphQLContextNoUser } from '../../types/index';
import { GraphQLError } from 'graphql';
import { pubsub } from '../../utils/pubsub';

export const commentResolvers = {
  Query: {
    // Fetch all comments
    comments: async (
      _: unknown,
      __: unknown,
      { prisma }: GraphQLContextNoUser,
    ): Promise<Comment[]> => {
      try {
        const comments = await prisma.comment.findMany({
          include: {
            author: true,
          },
        });

        if (comments.length === 0) {
          throw new GraphQLError('No comments found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        return comments;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error; // Rethrow specific GraphQLErrors
        }
        throw new GraphQLError('Failed to fetch comments.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Fetch a single comment by ID
    comment: async (
      _: unknown,
      { id }: { id: string },
      { prisma }: GraphQLContextNoUser,
    ): Promise<Comment> => {
      try {
        if (!id) {
          throw new GraphQLError('Please provide a comment ID.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        const comment = await prisma.comment.findUnique({
          where: { id: parseInt(id) },
          include: {
            author: true,
          },
        });
        if (!comment) {
          throw new GraphQLError('Comment not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return comment;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error; // Rethrow specific GraphQLErrors
        }
        throw new GraphQLError('Failed to fetch comment.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  Mutation: {
    // Create a new comment
    createComment: async (
      _: unknown,
      { postId, content }: { postId: string; content: string },
      { user, prisma }: Context,
    ): Promise<Comment> => {
      try {
        // Ensure the user is logged in
        if (!user) {
          throw new GraphQLError('You must be logged in to post a comment.', {
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          });
        }

        if (!postId || !content) {
          throw new GraphQLError('Post ID and content are required fields.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const parsedId = parseInt(postId);

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

        const comment = await prisma.comment.create({
          data: {
            content,
            post: {
              connect: { id: parsedId }, // Link the comment to the post
            },
            author: {
              connect: { id: user.id }, // Link the comment to the author (user)
            },
          },
        });

        // Publish the event to all subscribers
        pubsub.publish('COMMENT_ADDED', { commentAdded: comment });

        return comment;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error; // Rethrow specific GraphQLErrors
        }
        throw new GraphQLError('Failed to create comment.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    updateComment: async (
      _: unknown,
      { commentId, content }: { commentId: string; content: string },
      { user, prisma }: Context,
    ): Promise<Comment> => {
      try {
        // Ensure the user is logged in
        if (!user) {
          throw new GraphQLError('You must be logged in to update a comment.', {
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          });
        }

        if (!commentId) {
          throw new GraphQLError('Comment ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Parse ID
        const parsedId = parseInt(commentId);

        // Find the comment by ID
        const comment = await prisma.comment.findUnique({
          where: { id: parsedId },
        });

        // If the comment is not found, throw an error
        if (!comment) {
          throw new GraphQLError(`Comment not found.`, {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        }

        // Ensure the logged-in user is the author of the comment
        if (user.id !== comment.authorId) {
          throw new GraphQLError(
            'You are not authorized to edit this comment.',
            {
              extensions: {
                code: 'FORBIDDEN',
              },
            },
          );
        }

        // Validate
        if (!content) {
          throw new GraphQLError(
            'Content is required when updating a comment.',
            {
              extensions: {
                code: 'BAD_USER_INPUT',
              },
            },
          );
        }

        // Proceed with updating the comment
        const updatedComment = await prisma.comment.update({
          where: { id: parsedId },
          data: { content: content },
        });

        // Publish the update to the subscription listeners
        pubsub.publish('COMMENT_UPDATED', { updateComment: updatedComment });

        return updatedComment;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error; // Rethrow specific GraphQLErrors
        }
        throw new GraphQLError('Failed to update comment.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    voteComment: async (
      _: unknown,
      { commentId, type }: { commentId: string; type: 'upvote' | 'downvote' },
      { req, prisma }: { req: { ip?: string }; prisma: PrismaClient },
    ): Promise<Comment> => {
      try {
        if (!commentId || !type) {
          throw new GraphQLError('Comment ID and type are required.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const parsedId = parseInt(commentId);
        const ip = req.ip || '127.0.0.1'; // Fallback IP

        if (type !== 'upvote' && type !== 'downvote') {
          throw new GraphQLError(
            'Invalid vote type. Must be "upvote" or "downvote".',
          );
        }

        // Determine the vote value (+1 for upvote, -1 for downvote)
        const voteValue = type === 'upvote' ? 1 : -1;

        // Check if the IP has already voted on this comment
        const existingVote = await prisma.vote.findUnique({
          where: {
            ip_commentId: {
              ip: ip,
              commentId: parsedId,
            },
          },
        });

        if (existingVote) {
          // If the user is trying to vote the same way again, return an error
          if (existingVote.value === voteValue) {
            throw new GraphQLError('You have already voted this way.');
          }

          // If the vote is different, update the existing vote
          await prisma.vote.update({
            where: {
              id: existingVote.id,
            },
            data: {
              value: voteValue, // Update the vote value (+1 or -1)
            },
          });

          // Update the comment's score accordingly
          const updatedComment = await prisma.comment.update({
            where: { id: parsedId },
            data: {
              score: {
                increment: voteValue - existingVote.value, // Adjust the score based on the change
              },
            },
          });

          // Publish the update to the subscription listeners
          pubsub.publish('VOTE_UPDATED', { voteUpdated: updatedComment });

          return updatedComment;
        }

        // If no existing vote, create a new one
        await prisma.vote.create({
          data: {
            ip: ip,
            commentId: parsedId,
            value: voteValue,
          },
        });

        // Update the comment's score for the new vote
        const updatedComment = await prisma.comment.update({
          where: { id: parsedId },
          data: {
            score: { increment: voteValue },
          },
        });

        return updatedComment;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error; // Rethrow specific GraphQLErrors
        }
        throw new GraphQLError('Failed to vote on a comment.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    deleteComment: async (
      _: unknown,
      { commentId }: { commentId: string },
      { user, prisma }: Context,
    ): Promise<Comment> => {
      try {
        // Ensure the user is logged in
        if (!user) {
          throw new GraphQLError('You must be logged in to delete a comment.', {
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          });
        }

        if (!commentId) {
          throw new GraphQLError('Comment ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Parse ID
        const parsedId = parseInt(commentId);

        // Find the comment by ID
        const comment = await prisma.comment.findUnique({
          where: { id: parsedId },
        });

        // If the comment is not found, throw an error
        if (!comment) {
          throw new GraphQLError('Comment not found.', {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        }

        // Ensure the logged-in user is the author of the comment
        if (user.id !== comment.authorId) {
          throw new GraphQLError(
            'You are not authorized to delete this comment.',
            {
              extensions: {
                code: 'FORBIDDEN',
              },
            },
          );
        }

        const deletedComment = await prisma.comment.delete({
          where: { id: parsedId },
        });

        // Publish the update to the subscription listeners
        pubsub.publish('COMMENT_DELETED', { updateComment: deletedComment });

        return deletedComment;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error; // Rethrow specific GraphQLErrors
        }
        throw new GraphQLError('Failed to delete comment.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  Subscription: {
    commentAdded: {
      subscribe: () => {
        return pubsub.asyncIterator(['COMMENT_ADDED']);
      },
    },
    voteUpdated: {
      subscribe: () => {
        return pubsub.asyncIterator(['VOTE_UPDATED']);
      },
    },
    updateComment: {
      subscribe: () => {
        return pubsub.asyncIterator(['COMMENT_UPDATED']);
      },
    },
    deleteComment: {
      subscribe: () => {
        return pubsub.asyncIterator(['COMMENT_DELETED']);
      },
    },
  },
};
