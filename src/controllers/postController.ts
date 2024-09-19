import { Request, Response } from 'express';
import {
  getAllPosts,
  getPostById,
  createNewPost,
  updatePostById,
  deletePostById,
} from '../services/postService';
import { deleteAllCommentsByPostId } from '../services/commentService';
import { AuthRequest } from '../middleware/auth';
import { Post } from '@prisma/client';

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts: Post[] = await getAllPosts();
    res.json(posts);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if provided ID is valid
    const parsedId = parseInt(req.params.id);
    if (isNaN(parsedId)) {
      res.status(400).json({ error: 'Invalid post ID' });
      return;
    }
    // Check if post exists
    const post: Post | null = await getPostById(parsedId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const createPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { title, content, perex } = req.body;
  try {
    // Use a type assertion to tell TypeScript that req is AuthRequest
    const user = (req as AuthRequest).user;

    const newPost: Post = await createNewPost({
      title,
      content,
      authorId: parseInt(user.id),
      perex,
    });
    res.status(201).json(newPost);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { title, content, perex } = req.body;

  // Check if provided ID is valid
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    res.status(400).json({ error: 'Invalid post ID' });
    return;
  }

  try {
    // Check if post exists
    const post: Post | null = await getPostById(parsedId);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Use a type assertion to tell TypeScript that req is AuthRequest
    const user = (req as AuthRequest).user;

    // Check if the authenticated user is the author of the post
    if (post.authorId !== parseInt(user.id)) {
      res
        .status(403)
        .json({ message: 'You are not authorized to edit this post' });
      return;
    }

    const updatedPost: Post = await updatePostById(parsedId, {
      title,
      content,
      perex,
    });
    res.json(updatedPost);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Check if ID is valid
  const parsedId = parseInt(req.params.id);
  if (isNaN(parsedId)) {
    res.status(400).json({ error: 'Invalid post ID' });
    return;
  }
  try {
    // Check if post exists
    const post: Post | null = await getPostById(parsedId);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Use a type assertion to tell TypeScript that req is AuthRequest
    const user = (req as AuthRequest).user;

    // Check if the authenticated user is the author of the post
    if (post.authorId !== parseInt(user.id)) {
      res
        .status(403)
        .json({ message: 'You are not authorized to delete this post' });
      return;
    }

    await deleteAllCommentsByPostId(parsedId); // Delete comments of a deleted post
    await deletePostById(parsedId);
    res.status(204).send();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
};
