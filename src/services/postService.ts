import { Post } from '@prisma/client';
import { prisma } from '../utils/prismaClient';

export const getAllPosts = async (): Promise<Post[]> => {
  return await prisma.post.findMany({
    include: { comments: true },
  });
};

export const getPostById = async (id: number): Promise<Post | null> => {
  return await prisma.post.findUnique({
    where: { id },
    include: { comments: true },
  });
};

export const createNewPost = async (data: {
  title: string;
  content: string;
  authorId: number;
  perex: string;
}): Promise<Post> => {
  return await prisma.post.create({
    data,
  });
};

export const updatePostById = async (
  id: number,
  data: { title?: string; content?: string; perex?: string },
): Promise<Post> => {
  return await prisma.post.update({
    where: { id },
    data,
  });
};

export const deletePostById = async (id: number): Promise<Post> => {
  return await prisma.post.delete({
    where: { id },
  });
};
