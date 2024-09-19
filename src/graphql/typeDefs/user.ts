import { gql } from 'graphql-tag';

export const userTypeDefs = gql`
  type User {
    # Unique identifier for the user
    id: ID!

    # The username of the user
    username: String!

    # The timestamp when the user registered
    createdAt: DateTime!

    # A list of posts created by the user
    posts: [Post!]!

    # A list of comments made by the user
    comments: [Comment!]!
  }

  type AuthPayload {
    # The JWT token for authentication
    token: String!

    # The user object associated with the token
    user: User!
  }

  extend type Query {
    # Retrieve a list of all users without their passwords
    # Returns an array of User objects
    users: [User!]

    # Retrieve a single user by their unique identifier
    # @param id - The unique identifier of the user
    # Returns the User object if found, or null if not found
    user(id: ID!): User
  }

  extend type Mutation {
    # Authenticate a user and generate a JWT token
    # @param username - The username of the user
    # @param password - The password of the user
    # Returns an AuthPayload object containing the JWT token and the authenticated user
    loginUser(username: String!, password: String!): AuthPayload!

    # Register a new user
    # @param username - The desired username for the new user
    # @param password - The password for the new user
    # Returns the newly created User object
    createUser(username: String!, password: String!): User!
  }
`;
