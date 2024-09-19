import { gql } from 'graphql-tag';

export const baseTypeDefs = gql`
  # Create base typeDefs for the purpose of extending them in other typeDefs files
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;
