export const typeDefs = `#graphql
  type Category {
    id: Int!
    name: String!
    slug: String!
    description: String
    createdAt: String!
    updatedAt: String!
  }

  input CategoryInput {
    name: String!
    slug: String!
    description: String
  }

  input CategoryUpdateInput {
    name: String
    slug: String
    description: String
  }

  type Query {
    categories: [Category!]!
    category(id: Int!): Category
  }

  type Mutation {
    createCategory(input: CategoryInput!): Category!
    updateCategory(id: Int!, input: CategoryUpdateInput!): Category!
    deleteCategory(id: Int!): Category!
  }
`;
