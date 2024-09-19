import { PrismaClient } from '@prisma/client';

export interface PostUpdateInput {
  title?: string;
  perex?: string;
  content?: string;
}

export interface GraphQLContextNoUser {
  prisma: PrismaClient;
}

export interface Context extends GraphQLContextNoUser {
  user?: {
    id: number;
    username: string;
    createdAt: Date;
  };
  req?: {
    ip: string;
  };
}
