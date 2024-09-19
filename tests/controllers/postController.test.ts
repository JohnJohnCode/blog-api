import { Request, Response } from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from '../../src/controllers/postController';
import {
  getAllPosts,
  getPostById,
  createNewPost,
  updatePostById,
  deletePostById,
} from '../../src/services/postService';
import { deleteAllCommentsByPostId } from '../../src/services/commentService';
import { AuthRequest } from '../../src/middleware/auth';
import { Post } from '@prisma/client';

// Mock the service functions
jest.mock('../../src/services/postService');
jest.mock('../../src/services/commentService');

describe('postController', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();

    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
      send: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should return all posts', async () => {
      const mockPosts: Post[] = [
        {
          id: 1,
          title: 'Post 1',
          content: 'Content 1',
          authorId: 1,
          perex: 'Summary 1',
          createdAt: new Date(),
        },
      ];
      (getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

      await getPosts(req as Request, res as Response);

      expect(getAllPosts).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockPosts);
    });

    it('should handle errors', async () => {
      (getAllPosts as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch posts'),
      );

      await getPosts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch posts' });
    });
  });

  describe('getPost', () => {
    it('should return a post by ID', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
        perex: 'Summary 1',
        createdAt: new Date(),
      };
      (getPostById as jest.Mock).mockResolvedValue(mockPost);

      req.params = { id: '1' };

      await getPost(req as Request, res as Response);

      expect(getPostById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return a 400 error for invalid post ID', async () => {
      req.params = { id: 'invalid' };

      await getPost(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid post ID' });
    });

    it('should return a 404 error if post not found', async () => {
      (getPostById as jest.Mock).mockResolvedValue(null);

      req.params = { id: '1' };

      await getPost(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Post not found' });
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
        perex: 'Summary 1',
        createdAt: new Date(),
      };
      (createNewPost as jest.Mock).mockResolvedValue(mockPost);

      req.user = { id: '1', username: 'testuser' };
      req.body = { title: 'Post 1', content: 'Content 1', perex: 'Summary 1' };

      await createPost(req as AuthRequest, res as Response);

      expect(createNewPost).toHaveBeenCalledWith({
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
        perex: 'Summary 1',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should handle errors', async () => {
      (createNewPost as jest.Mock).mockRejectedValue(
        new Error('Failed to create post'),
      );

      req.user = { id: '1', username: 'testuser' };
      req.body = { title: 'Post 1', content: 'Content 1', perex: 'Summary 1' };

      await createPost(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create post' });
    });
  });

  describe('updatePost', () => {
    it('should update a post by ID', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Updated Post',
        content: 'Updated Content',
        authorId: 1,
        perex: 'Updated Summary',
        createdAt: new Date(),
      };
      (getPostById as jest.Mock).mockResolvedValue(mockPost);
      (updatePostById as jest.Mock).mockResolvedValue(mockPost);

      req.params = { id: '1' };
      req.user = { id: '1', username: 'testuser' };
      req.body = {
        title: 'Updated Post',
        content: 'Updated Content',
        perex: 'Updated Summary',
      };

      await updatePost(req as AuthRequest, res as Response);

      expect(updatePostById).toHaveBeenCalledWith(1, {
        title: 'Updated Post',
        content: 'Updated Content',
        perex: 'Updated Summary',
      });
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return a 403 error if the user is not the author', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 2,
        perex: 'Summary 1',
        createdAt: new Date(),
      };
      (getPostById as jest.Mock).mockResolvedValue(mockPost);

      req.params = { id: '1' };
      req.user = { id: '1', username: 'testuser' };
      req.body = {
        title: 'Updated Post',
        content: 'Updated Content',
        perex: 'Updated Summary',
      };

      await updatePost(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You are not authorized to edit this post',
      });
    });
  });

  describe('deletePost', () => {
    it('should delete a post by ID', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
        perex: 'Summary 1',
        createdAt: new Date(),
      };
      (getPostById as jest.Mock).mockResolvedValue(mockPost);
      (deleteAllCommentsByPostId as jest.Mock).mockResolvedValue({ count: 1 });
      (deletePostById as jest.Mock).mockResolvedValue(mockPost);

      req.params = { id: '1' };
      req.user = { id: '1', username: 'testuser' };

      await deletePost(req as AuthRequest, res as Response);

      expect(deleteAllCommentsByPostId).toHaveBeenCalledWith(1);
      expect(deletePostById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return a 403 error if the user is not the author', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 2,
        perex: 'Summary 1',
        createdAt: new Date(),
      };
      (getPostById as jest.Mock).mockResolvedValue(mockPost);

      req.params = { id: '1' };
      req.user = { id: '1', username: 'testuser' };

      await deletePost(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You are not authorized to delete this post',
      });
    });
  });
});
