import { gql } from 'graphql-tag';

export const commentTypeDefs = gql`
  type Comment {
    # Unique identifier for the comment
    id: ID!

    # The content or body of the comment
    content: String!

    # The timestamp when the comment was created
    createdAt: DateTime!

    # Unique identifier of the post to which the comment belongs
    postId: ID!

    # The post that this comment is associated with
    post: Post!

    # Unique identifier of the user who authored the comment
    authorId: ID!

    # The user who created the comment
    author: User!

    # The net score of the comment, reflecting the sum of upvotes and downvotes
    score: Int!
  }

  extend type Query {
    # Retrieve a list of all comments
    # Returns an array of Comment objects or an empty array if no comments exist
    comments: [Comment!]

    # Retrieve a single comment by its unique identifier
    # @param id - The unique identifier of the comment
    # Returns the Comment object if found, or null if not found
    comment(id: ID!): Comment
  }

  extend type Mutation {
    # Create a new comment on a specific post
    # @param postId - The unique identifier of the post to comment on
    # @param content - The content of the comment
    # Returns the newly created Comment object
    createComment(postId: ID!, content: String!): Comment!

    # Update the content of an existing comment
    # @param commentId - The unique identifier of the comment to update
    # @param content - The new content for the comment
    # Returns the updated Comment object
    updateComment(commentId: ID!, content: String!): Comment!

    # Delete an existing comment by its unique identifier
    # @param commentId - The unique identifier of the comment to delete
    # Returns the deleted Comment object
    deleteComment(commentId: ID!): Comment!

    # Vote on a comment (upvote or downvote)
    # @param commentId - The unique identifier of the comment to vote on
    # @param type - The type of vote, either 'upvote' or 'downvote'
    # Returns the Comment object with the updated vote score
    voteComment(commentId: ID!, type: String!): Comment!
  }

  extend type Subscription {
    # Subscription for real-time updates when a comment is added to a post
    # @param postId - The unique identifier of the post for which to receive comment additions
    # Returns the Comment object that was added
    commentAdded(postId: ID!): Comment

    # Subscription for real-time updates when a comment is updated
    # @param commentId - The unique identifier of the comment being updated
    # Returns the Comment object that was updated
    updateComment(commentId: ID!): Comment

    # Subscription for real-time updates when a comment is deleted
    # @param commentId - The unique identifier of the comment being deleted
    # Returns the Comment object that was deleted
    deleteComment(commentId: ID!): Comment

    # Subscription for real-time updates when a comment's vote count changes
    # @param commentId - The unique identifier of the comment being voted on
    # Returns the Comment object with the updated vote count
    voteUpdated(commentId: ID!): Comment
  }
`;
