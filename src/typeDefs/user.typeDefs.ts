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

  type authUserResponse {
    success: Boolean!
    message: String!
    isAuthenticated: Boolean!
    user: UserPublic
  }

  type Query {
    authUser: authUserResponse!
  }

  type SignupResponse {
    success: Boolean!
    message: String!
    user: UserPublic
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
    refreshToken: String
    accessToken: String
  }

  type SignoutResponse {
    success: Boolean!
    message: String!
  }

  type RefetchAccessTokenResponse {
    success: Boolean!
    message: String!
    accessToken: String
  }

  type Mutation {
    signup(
      fullName: String!
      email: String!
      username: String!
      password: String!
    ): SignupResponse!
    signin(
      identifier: String!
      password: String!
    ): SigninResponse!
    signout:SignoutResponse!
    refetchAccessToken: RefetchAccessTokenResponse!
  }
`;

export default userTypeDef;
