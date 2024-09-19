import {
  createNewComment,
  getAllComments,
  getAllCommentsByPostId,
  getCommentById,
  updateCommentById,
  deleteCommentById,
  deleteAllCommentsByPostId,
  voteOnCommentService,
} from '../../src/services/commentService';
import { prisma } from '../../src/utils/prismaClient';

describe('createNewComment', () => {
  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new comment', async () => {
    // Arrange: Mock the prisma.comment.create method to return a mock result
    const mockComment = {
      id: 1,
      content: 'Test comment',
      postId: 1,
      authorId: 1,
      score: 0,
      createdAt: new Date(),
    };

    // Use jest.spyOn to mock the prisma.comment.create method
    jest.spyOn(prisma.comment, 'create').mockResolvedValue(mockComment);

    // Act: Call the service function
    const result = await createNewComment({
      content: 'Test comment',
      postId: 1,
      authorId: 1,
    });

    // Assert: Verify that the function returns the expected result
    expect(result).toEqual(mockComment);

    // Verify that the prisma.comment.create method was called with the correct arguments
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: {
        content: 'Test comment',
        author: {
          connect: {
            id: 1,
          },
        },
        post: {
          connect: {
            id: 1,
          },
        },
      },
    });
  });
});

describe('commentService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNewComment', () => {
    it('should create a new comment', async () => {
      // Arrange: Mock the prisma.comment.create method to return a mock result
      const mockComment = {
        id: 1,
        content: 'Test comment',
        postId: 1,
        authorId: 1,
        score: 0,
        createdAt: new Date(),
      };

      // Use jest.spyOn to mock the prisma.comment.create method
      jest.spyOn(prisma.comment, 'create').mockResolvedValue(mockComment);

      // Act: Call the service function
      const result = await createNewComment({
        content: 'Test comment',
        postId: 1,
        authorId: 1,
      });

      // Assert: Verify that the function returns the expected result
      expect(result).toEqual(mockComment);

      // Verify that the prisma.comment.create method was called with the correct arguments
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Test comment',
          author: {
            connect: {
              id: 1,
            },
          },
          post: {
            connect: {
              id: 1,
            },
          },
        },
      });
    });
  });

  describe('getAllComments', () => {
    it('should fetch all comments', async () => {
      const mockComments = [
        {
          id: 1,
          content: 'Comment 1',
          authorId: 1,
          postId: 1,
          score: 0,
          createdAt: new Date(),
        },
        {
          id: 2,
          content: 'Comment 2',
          authorId: 2,
          postId: 1,
          score: 0,
          createdAt: new Date(),
        },
      ];
      jest.spyOn(prisma.comment, 'findMany').mockResolvedValue(mockComments);

      const result = await getAllComments();
      expect(result).toEqual(mockComments);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({});
    });
  });

  describe('getAllCommentsByPostId', () => {
    it('should fetch all comments by post ID', async () => {
      const mockComments = [
        {
          id: 1,
          content: 'Comment 1',
          authorId: 1,
          postId: 1,
          score: 0,
          createdAt: new Date(),
        },
      ];
      jest.spyOn(prisma.comment, 'findMany').mockResolvedValue(mockComments);

      const result = await getAllCommentsByPostId(1);
      expect(result).toEqual(mockComments);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { postId: 1 },
      });
    });
  });

  describe('getCommentById', () => {
    it('should fetch a comment by ID', async () => {
      const mockComment = {
        id: 1,
        content: 'Comment 1',
        authorId: 1,
        postId: 1,
        score: 0,
        createdAt: new Date(),
      };
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment);

      const result = await getCommentById(1);
      expect(result).toEqual(mockComment);
      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('updateCommentById', () => {
    it('should update a comment by ID', async () => {
      const mockUpdatedComment = {
        id: 1,
        content: 'Updated Comment',
        authorId: 1,
        postId: 1,
        score: 0,
        createdAt: new Date(),
      };
      jest
        .spyOn(prisma.comment, 'update')
        .mockResolvedValue(mockUpdatedComment);

      const result = await updateCommentById(1, { content: 'Updated Comment' });
      expect(result).toEqual(mockUpdatedComment);
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { content: 'Updated Comment' },
      });
    });
  });

  describe('deleteCommentById', () => {
    it('should delete a comment by ID', async () => {
      const mockDeletedComment = {
        id: 1,
        content: 'Deleted Comment',
        authorId: 1,
        postId: 1,
        score: 0,
        createdAt: new Date(),
      };
      jest
        .spyOn(prisma.comment, 'delete')
        .mockResolvedValue(mockDeletedComment);

      const result = await deleteCommentById(1);
      expect(result).toEqual(mockDeletedComment);
      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('deleteAllCommentsByPostId', () => {
    it('should delete all comments by post ID', async () => {
      const mockBatchPayload = { count: 2 }; // Prisma.BatchPayload has a 'count' property
      jest
        .spyOn(prisma.comment, 'deleteMany')
        .mockResolvedValue(mockBatchPayload);

      const result = await deleteAllCommentsByPostId(1);
      expect(result).toEqual(mockBatchPayload);
      expect(prisma.comment.deleteMany).toHaveBeenCalledWith({
        where: { postId: 1 },
      });
    });
  });

  describe('voteOnCommentService', () => {
    it('should upvote a comment', async () => {
      // Mock the existing vote check and comment update
      const mockExistingVote = null;
      const mockUpdatedComment = {
        id: 1,
        content: 'Comment 1',
        authorId: 1,
        postId: 1,
        score: 1,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.vote, 'findUnique').mockResolvedValue(mockExistingVote);
      jest.spyOn(prisma.vote, 'create').mockResolvedValue({
        id: 1,
        value: 1,
        ip: '127.0.0.1',
        commentId: 1,
        createdAt: new Date(),
      });
      jest
        .spyOn(prisma.comment, 'update')
        .mockResolvedValue(mockUpdatedComment);

      const result = await voteOnCommentService(1, 'upvote', '127.0.0.1');
      expect(result).toEqual(mockUpdatedComment);
      expect(prisma.vote.findUnique).toHaveBeenCalledWith({
        where: {
          ip_commentId: { ip: '127.0.0.1', commentId: 1 },
        },
      });
      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: {
          ip: '127.0.0.1',
          commentId: 1,
          value: 1,
        },
      });
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          score: { increment: 1 },
        },
      });
    });

    it('should downvote a comment', async () => {
      // Mock the existing vote check and comment update
      const mockExistingVote = null;
      const mockUpdatedComment = {
        id: 1,
        content: 'Comment 1',
        authorId: 1,
        postId: 1,
        score: -1,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.vote, 'findUnique').mockResolvedValue(mockExistingVote);
      jest.spyOn(prisma.vote, 'create').mockResolvedValue({
        id: 1,
        value: -1,
        ip: '127.0.0.1',
        commentId: 1,
        createdAt: new Date(),
      });
      jest
        .spyOn(prisma.comment, 'update')
        .mockResolvedValue(mockUpdatedComment);

      const result = await voteOnCommentService(1, 'downvote', '127.0.0.1');
      expect(result).toEqual(mockUpdatedComment);
      expect(prisma.vote.findUnique).toHaveBeenCalledWith({
        where: {
          ip_commentId: { ip: '127.0.0.1', commentId: 1 },
        },
      });
      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: {
          ip: '127.0.0.1',
          commentId: 1,
          value: -1,
        },
      });
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          score: { increment: -1 },
        },
      });
    });

    it('should prevent double voting with the same IP', async () => {
      // Mock the scenario where the user has already voted with the same IP
      const mockExistingVote = {
        id: 1,
        value: 1,
        ip: '127.0.0.1',
        commentId: 1,
        createdAt: new Date(),
      };
      jest.spyOn(prisma.vote, 'findUnique').mockResolvedValue(mockExistingVote);

      // Expect the function to throw an error when trying to vote again in the same way
      await expect(
        voteOnCommentService(1, 'upvote', '127.0.0.1'),
      ).rejects.toThrow('You have already voted this way.');

      // Check that no other Prisma operations were called
      expect(prisma.vote.create).not.toHaveBeenCalled();
      expect(prisma.comment.update).not.toHaveBeenCalled();
    });
  });
});
