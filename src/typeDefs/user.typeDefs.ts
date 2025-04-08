const userTypeDef = `
#graphql
  type User {
    _id: ID!
    username: String!
    email: String!
    fullName: String!
    password: String!
    refreshToken: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    user: User!
  }

  type SignupResponse {
    success: Boolean!
    message: String!
    user: UserPublic!
  }

  type UserPublic {
    _id: ID!
    username: String!
    email: String!
    fullName: String!
    createdAt: String
    updatedAt: String
  }

  type Mutation {
    signup(
      fullName: String!
      email: String!
      username: String!
      password: String!
      confpassword: String!
    ): SignupResponse!
    
  }
`;

export default userTypeDef;
