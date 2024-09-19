import { prisma } from '../../src/utils/prismaClient';
import {
  getAllPosts,
  getPostById,
  createNewPost,
  updatePostById,
  deletePostById,
} from '../../src/services/postService';

describe('postService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPosts', () => {
    it('should return all posts with comments', async () => {
      // Arrange: Mock the prisma.post.findMany method
      const mockPosts = [
        {
          id: 1,
          title: 'Post 1',
          content: 'Content 1',
          authorId: 1,
          perex: 'Summary 1',
          createdAt: new Date(),
          comments: [],
        },
        {
          id: 2,
          title: 'Post 2',
          content: 'Content 2',
          authorId: 2,
          perex: 'Summary 2',
          createdAt: new Date(),
          comments: [],
        },
      ];
      jest.spyOn(prisma.post, 'findMany').mockResolvedValue(mockPosts);

      // Act
      const result = await getAllPosts();

      // Assert
      expect(result).toEqual(mockPosts);
      expect(prisma.post.findMany).toHaveBeenCalledWith({
        include: { comments: true },
      });
    });
  });

  describe('getPostById', () => {
    it('should return a post by ID with comments', async () => {
      // Arrange: Mock the prisma.post.findUnique method
      const mockPost = {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
        perex: 'Summary 1',
        createdAt: new Date(),
        comments: [],
      };
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(mockPost);

      // Act
      const result = await getPostById(1);

      // Assert
      expect(result).toEqual(mockPost);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { comments: true },
      });
    });

    it('should return null if the post is not found', async () => {
      // Arrange: Mock the prisma.post.findUnique method to return null
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await getPostById(999);

      // Assert
      expect(result).toBeNull();
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: { comments: true },
      });
    });
  });

  describe('createNewPost', () => {
    it('should create a new post', async () => {
      // Arrange: Mock the prisma.post.create method
      const mockPost = {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
        perex: 'Summary 1',
        createdAt: new Date(),
      };
      const postData = {
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
        perex: 'Summary 1',
      };
      jest.spyOn(prisma.post, 'create').mockResolvedValue(mockPost);

      // Act
      const result = await createNewPost(postData);

      // Assert
      expect(result).toEqual(mockPost);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: postData,
      });
    });
  });

  describe('updatePostById', () => {
    it('should update a post by ID', async () => {
      // Arrange: Mock the prisma.post.update method
      const mockPost = {
        id: 1,
        title: 'Updated Post',
        content: 'Updated Content',
        authorId: 1,
        perex: 'Updated Summary',
        createdAt: new Date(),
      };
      const updateData = {
        title: 'Updated Post',
        content: 'Updated Content',
        perex: 'Updated Summary',
      };
      jest.spyOn(prisma.post, 'update').mockResolvedValue(mockPost);

      // Act
      const result = await updatePostById(1, updateData);

      // Assert
      expect(result).toEqual(mockPost);
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });
  });

  describe('deletePostById', () => {
    it('should delete a post by ID', async () => {
      // Arrange: Mock the prisma.post.delete method
      const mockPost = {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
        perex: 'Summary 1',
        createdAt: new Date(),
      };
      jest.spyOn(prisma.post, 'delete').mockResolvedValue(mockPost);

      // Act
      const result = await deletePostById(1);

      // Assert
      expect(result).toEqual(mockPost);
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
