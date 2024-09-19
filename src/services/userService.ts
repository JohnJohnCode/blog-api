import { User } from '@prisma/client';
import { prisma } from '../utils/prismaClient';

export const getUserByName = async (username: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const createNewUser = async (data: {
  username: string;
  password: string;
}): Promise<User> => {
  return prisma.user.create({
    data,
  });
};
