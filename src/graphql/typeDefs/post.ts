import { gql } from 'graphql-tag';

export const postTypeDefs = gql`
  type Post {
    # Unique identifier for the post
    id: ID!

    # The title of the post
    title: String!

    # A brief summary or excerpt of the post
    perex: String!

    # The full content of the post
    content: String!

    # The user who authored the post
    author: User!

    # A list of comments associated with the post
    comments: [Comment!]!

    # The timestamp when the post was created
    createdAt: DateTime!
  }

  extend type Query {
    # Retrieve a list of all posts
    # Returns an array of Post objects
    posts: [Post!]!

    # Retrieve a single post by its unique identifier
    # @param id - The unique identifier of the post
    # Returns the Post object if found, or null if not found
    post(id: ID!): Post
  }

  extend type Mutation {
    # Create a new post with the specified title, summary, and content
    # @param title - The title of the post
    # @param perex - A brief summary or excerpt of the post
    # @param content - The full content of the post
    # Returns the newly created Post object
    createPost(title: String!, perex: String!, content: String!): Post!

    # Update an existing post's details
    # @param postId - The unique identifier of the post to update
    # @param data - The new data for the post, including optional fields for title, summary, and content
    # Returns the updated Post object
    updatePost(postId: ID!, data: PostUpdateInput!): Post!

    # Delete a post by its unique identifier
    # @param postId - The unique identifier of the post to delete
    # Returns the deleted Post object
    deletePost(postId: ID!): Post!
  }

  # Input type for updating a post
  # All fields are optional, allowing partial updates
  input PostUpdateInput {
    # The new title for the post
    title: String

    # The new summary or excerpt for the post
    perex: String

    # The new full content for the post
    content: String
  }
`;
