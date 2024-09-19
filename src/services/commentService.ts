import { Comment, Prisma, Vote } from '@prisma/client';
import { prisma } from '../utils/prismaClient';

export const getAllComments = async (): Promise<Comment[]> => {
  return prisma.comment.findMany({});
};

export const getAllCommentsByPostId = async (
  id: number,
): Promise<Comment[]> => {
  return prisma.comment.findMany({
    where: { postId: id },
  });
};

export const getCommentById = async (id: number): Promise<Comment | null> => {
  return prisma.comment.findUnique({
    where: { id },
  });
};

export const createNewComment = async (data: {
  content: string;
  postId: number;
  authorId: number;
}): Promise<Comment> => {
  return prisma.comment.create({
    data: {
      content: data.content,
      post: { connect: { id: data.postId } },
      author: { connect: { id: data.authorId } },
    },
  });
};

export const updateCommentById = async (
  id: number,
  data: { content: string },
): Promise<Comment> => {
  return prisma.comment.update({
    where: { id },
    data,
  });
};

export const deleteCommentById = async (id: number): Promise<Comment> => {
  return prisma.comment.delete({
    where: { id },
  });
};

export const deleteAllCommentsByPostId = async (
  id: number,
): Promise<Prisma.BatchPayload> => {
  return prisma.comment.deleteMany({
    where: { postId: id },
  });
};

export const voteOnCommentService = async (
  commentId: number,
  type: 'upvote' | 'downvote',
  ip: string,
): Promise<Comment> => {
  // Check if the IP has already voted on this comment
  const existingVote: Vote | null = await prisma.vote.findUnique({
    where: {
      ip_commentId: {
        ip: ip,
        commentId: commentId,
      },
    },
  });

  // Determine the vote value (+1 for upvote, -1 for downvote)
  const voteValue = type === 'upvote' ? 1 : -1;

  if (existingVote) {
    // If the user is trying to vote the same way again, return without changes
    if (existingVote.value === voteValue) {
      throw new Error('You have already voted this way.');
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
    const updatedComment: Comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        score: {
          increment: voteValue - existingVote.value, // Adjust the score based on the change
        },
      },
    });

    return updatedComment;
  }

  // If no existing vote, create a new one
  await prisma.vote.create({
    data: {
      ip: ip,
      commentId: commentId,
      value: voteValue,
    },
  });

  // Update the comment's score for the new vote
  const updatedComment: Comment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      score: { increment: voteValue },
    },
  });

  return updatedComment;
};
