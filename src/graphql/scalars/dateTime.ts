import { GraphQLScalarType, Kind } from 'graphql';
import { gql } from 'graphql-tag';

export const dateTimeTypeDefs = gql`
  scalar DateTime
`;

// Create scalar datetime to convert timestamps to a readable format when querying
export const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'A custom scalar to handle DateTime values',

  // For input values (variables or arguments from client)
  parseValue(value: unknown) {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value); // Convert input to Date
    }
    throw new Error('DateTime scalar can only parse string or number values.');
  },

  // For returning values from resolvers (sending back to client)
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString(); // Return ISO 8601 string for the client
    } else if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value).toISOString(); // If string or number, convert to Date first
    }
    throw new Error(
      'DateTime scalar can only serialize string, number, or Date values.',
    );
  },

  // For parsing literal values (directly in the query)
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert AST literal to Date
    } else if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // Convert string literal to Date
    }
    throw new Error(
      'DateTime scalar only supports string or integer literals.',
    );
  },
});
