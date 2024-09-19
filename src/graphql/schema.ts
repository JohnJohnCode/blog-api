import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { postTypeDefs } from './typeDefs/post';
import { commentTypeDefs } from './typeDefs/comment';
import { userTypeDefs } from './typeDefs/user';
import { postResolvers } from './resolvers/post';
import { commentResolvers } from './resolvers/comment';
import { userResolvers } from './resolvers/user';
import { DateTime, dateTimeTypeDefs } from './scalars/dateTime';
import { baseTypeDefs } from './typeDefs/baseTypeDefs';

// Combine all typeDefs and resolvers
const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  dateTimeTypeDefs,
  postTypeDefs,
  commentTypeDefs,
  userTypeDefs,
]);

const resolvers = mergeResolvers([
  { DateTime },
  postResolvers,
  commentResolvers,
  userResolvers,
]);

// Create executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
