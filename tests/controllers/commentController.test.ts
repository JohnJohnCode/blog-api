import { Request, Response } from 'express';
import {
  getComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  voteOnComment,
} from '../../src/controllers/commentController';
import {
  getAllComments,
  getCommentById,
  createNewComment,
  updateCommentById,
  deleteCommentById,
  voteOnCommentService,
} from '../../src/services/commentService';
import { getPostById } from '../../src/services/postService';
import { AuthRequest } from '../../src/middleware/auth';
import { Post, Comment } from '@prisma/client';

jest.mock('../../src/services/postService');
jest.mock('../../src/services/commentService');

describe('commentController', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    req = {
      params: { id: '1' },
      body: { type: 'upvote' },
      ip: '127.0.0.1',
    };
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    sendMock = jest.fn();
    res = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getComments', () => {
    it('should return all comments', async () => {
      const mockComments: Comment[] = [
        {
          id: 1,
          content: 'Test comment',
          postId: 1,
          authorId: 1,
          score: 0,
          createdAt: new Date(),
        },
      ];
      (getAllComments as jest.Mock).mockResolvedValue(mockComments);

      await getComments(req as Request, res as Response);

      expect(getAllComments).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockComments);
    });

    it('should return a 500 error if there is a problem fetching comments', async () => {
      (getAllComments as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await getComments(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch comments',
      });
    });
  });

  describe('getComment', () => {
    it('should return a specific comment', async () => {
      const mockComment: Comment = {
        id: 1,
        content: 'Test comment',
        postId: 1,
        authorId: 1,
        score: 0,
        createdAt: new Date(),
      };
      req.params = { id: '1' };
      (getCommentById as jest.Mock).mockResolvedValue(mockComment);

      await getComment(req as Request, res as Response);

      expect(getCommentById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockComment);
    });

    it('should return a 404 if the comment is not found', async () => {
      req.params = { id: '1' };
      (getCommentById as jest.Mock).mockResolvedValue(null);

      await getComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Comment not found' });
    });

    it('should return a 400 if the comment ID is invalid', async () => {
      req.params = { id: 'invalid' };

      await getComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid comment ID' });
    });
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        authorId: 1,
        perex: 'Test Perex',
        createdAt: new Date(),
      };
      const mockComment: Comment = {
        id: 1,
        content: 'Test comment',
        postId: 1,
        authorId: 1,
        score: 0,
        createdAt: new Date(),
      };

      // Mocking the services
      (getPostById as jest.Mock).mockResolvedValue(mockPost);
      (createNewComment as jest.Mock).mockResolvedValue(mockComment);

      req.body = { content: 'Test comment', postId: '1' };
      req.user = { id: '1', username: 'testuser' };

      await createComment(req as AuthRequest, res as Response);

      expect(createNewComment).toHaveBeenCalledWith({
        content: 'Test comment',
        postId: 1,
        authorId: 1,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockComment);
    });

    it('should return a 400 error if content is not provided', async () => {
      req.body = { content: '', postId: '1' };

      await createComment(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Content and valid postId are required',
      });
    });

    it('should return a 400 error if invalid ID is provided', async () => {
      req.body = { content: 'content', postId: 'invalid' };

      await createComment(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid post ID' });
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const mockComment: Comment = {
        id: 1,
        content: 'Test comment',
        postId: 1,
        authorId: 1,
        score: 0,
        createdAt: new Date(),
      };
      const updatedComment: Comment = {
        ...mockComment,
        content: 'Updated comment',
      };
      req.params = { id: '1' };
      req.body = { content: 'Updated comment' };
      req.user = { id: '1', username: 'testuser' };
      (getCommentById as jest.Mock).mockResolvedValue(mockComment);
      (updateCommentById as jest.Mock).mockResolvedValue(updatedComment);

      await updateComment(req as Request, res as Response);

      expect(updateCommentById).toHaveBeenCalledWith(1, {
        content: 'Updated comment',
      });
      expect(res.json).toHaveBeenCalledWith(updatedComment);
    });

    it('should return a 404 if the comment is not found', async () => {
      req.params = { id: '1' };
      req.body = { content: 'Updated comment' };
      req.user = { id: '1', username: 'testuser' };
      (getCommentById as jest.Mock).mockResolvedValue(null);

      await updateComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });
  });

  describe('voteOnComment', () => {
    it('should successfully upvote a comment', async () => {
      const mockUpdatedComment: Comment = {
        id: 1,
        content: 'Test comment',
        postId: 1,
        authorId: 1,
        score: 1,
        createdAt: new Date(),
      };

      (voteOnCommentService as jest.Mock).mockResolvedValue(mockUpdatedComment);

      req.params = { id: '1' };
      req.body = { type: 'upvote' };

      await voteOnComment(req as Request, res as Response);

      expect(voteOnCommentService).toHaveBeenCalledWith(
        1,
        'upvote',
        '127.0.0.1',
      );
      expect(res.json).toHaveBeenCalledWith(mockUpdatedComment);
    });

    it('should return 400 for invalid vote type', async () => {
      req.params = { id: '1' };
      req.body = { type: 'invalidVoteType' };

      await voteOnComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid vote type. Must be "upvote" or "downvote".',
      });
    });

    it('should handle errors and return 500', async () => {
      (voteOnCommentService as jest.Mock).mockRejectedValue(
        new Error('Some error'),
      );

      req.params = { id: '1' };
      req.body = { type: 'upvote' };

      await voteOnComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to vote on comment',
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment if the user is the author', async () => {
      const mockComment: Comment = {
        id: 1,
        content: 'Test comment',
        postId: 1,
        authorId: 1,
        score: 0,
        createdAt: new Date(),
      };

      (getCommentById as jest.Mock).mockResolvedValue(mockComment);
      (deleteCommentById as jest.Mock).mockResolvedValue(mockComment);

      req.params = { id: '1' };
      req.user = { id: '1', username: 'testuser' };

      await deleteComment(req as AuthRequest, res as Response);

      expect(deleteCommentById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 403 if the user is not the author', async () => {
      const mockComment: Comment = {
        id: 1,
        content: 'Test comment',
        postId: 1,
        authorId: 2,
        score: 0,
        createdAt: new Date(),
      };

      (getCommentById as jest.Mock).mockResolvedValue(mockComment);

      req.params = { id: '1' };
      req.user = { id: '1', username: 'testuser' };

      await deleteComment(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You are not authorized to edit this comment',
      });
    });

    it('should return 404 if the comment is not found', async () => {
      (getCommentById as jest.Mock).mockResolvedValue(null);

      req.params = { id: '1' };
      req.user = { id: '1', username: 'testuser' };

      await deleteComment(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle errors and return 500', async () => {
      (getCommentById as jest.Mock).mockRejectedValue(new Error('Some error'));

      req.params = { id: '1' };
      req.user = { id: '1', username: 'testuser' };

      await deleteComment(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to delete comment',
      });
    });
  });
});
