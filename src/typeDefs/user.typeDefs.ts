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

  type SigninResponse {
    success: Boolean!
    message: String!
    refreshToken: String!
    accessToken: String!
  }

  type Mutation {
    signup(
      fullName: String!
      email: String!
      username: String!
      password: String!
      confpassword: String!
    ): SignupResponse!
    signin(
      identifier: String!
      password: String!
    ): SigninResponse!
  }
`;

export default userTypeDef;
