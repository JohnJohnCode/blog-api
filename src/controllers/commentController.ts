import { Request, Response } from 'express';
import {
  getAllComments,
  getCommentById,
  createNewComment,
  updateCommentById,
  deleteCommentById,
  voteOnCommentService,
} from '../services/commentService';
import { getPostById } from '../services/postService';
import { AuthRequest } from '../middleware/auth';
import { Comment, Post } from '@prisma/client';

export const getComments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const comments: Comment[] = await getAllComments();
    res.json(comments);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const getComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Check if provided ID is valid
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      res.status(400).json({ error: 'Invalid comment ID' });
      return;
    }
    // Check if comment exists
    const comment: Comment | null = await getCommentById(commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    res.json(comment);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
};

export const createComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { content, postId } = req.body;

  // Check if provided ID is valid
  const parsedId = parseInt(postId);
  if (isNaN(parsedId)) {
    res.status(400).json({ error: 'Invalid post ID' });
    return;
  }

  // Check for content
  if (!content) {
    res.status(400).json({ error: 'Content and valid postId are required' });
    return;
  }

  try {
    // Check if the post exists
    const post: Post | null = await getPostById(parsedId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Use a type assertion to tell TypeScript that req is AuthRequest
    const user = (req as AuthRequest).user;

    const newComment: Comment = await createNewComment({
      content,
      postId: parsedId,
      authorId: parseInt(user.id),
    });

    res.status(201).json(newComment);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

export const updateComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { content } = req.body;

  // Check if provided ID is valid
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    res.status(400).json({ error: 'Invalid comment ID' });
    return;
  }
  try {
    // Fetch the comment to see if it exists and to verify authorization
    const comment = await getCommentById(parsedId);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Use a type assertion to tell TypeScript that req is AuthRequest
    const user = (req as AuthRequest).user;

    // Check if the authenticated user is the author of the comment
    if (comment.authorId !== parseInt(user.id)) {
      res
        .status(403)
        .json({ message: 'You are not authorized to edit this comment' });
      return;
    }
    const updatedComment = await updateCommentById(parsedId, { content });

    res.json(updatedComment);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  // Check if provided ID is valid
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    res.status(400).json({ error: 'Invalid comment ID' });
    return;
  }
  try {
    // Fetch the comment to see if it exists and to verify authorization
    const comment: Comment | null = await getCommentById(parsedId);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Use a type assertion to tell TypeScript that req is AuthRequest
    const user = (req as AuthRequest).user;

    // Check if the authenticated user is the author of the comment
    if (comment.authorId !== parseInt(user.id)) {
      res
        .status(403)
        .json({ message: 'You are not authorized to edit this comment' });
      return;
    }
    await deleteCommentById(parsedId);
    res.status(204).send();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

export const voteOnComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parsedId = parseInt(req.params.id); // Parse comment ID
  const { type } = req.body; // ("upvote" or "downvote")
  const ip = req.ip || '127.0.0.1'; // Get IP address

  // Check if provided ID is valid
  if (isNaN(parsedId)) {
    res.status(400).json({ error: 'Invalid comment ID' });
    return;
  }

  // Validate vote type
  if (type !== 'upvote' && type !== 'downvote') {
    res
      .status(400)
      .json({ error: 'Invalid vote type. Must be "upvote" or "downvote".' });
    return;
  }

  try {
    const updatedComment: Comment = await voteOnCommentService(
      parsedId,
      type,
      ip,
    );
    res.json(updatedComment);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to vote on comment' });
  }
};
