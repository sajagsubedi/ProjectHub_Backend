const userTypeDef = `
#graphql
type AvatarType {
  url: String!
  public_id: String!
}

type UserPublic {
  _id: ID!
  username: String!
  email: String!
  fullName: String!
  avatar: AvatarType!
  createdAt: String
  updatedAt: String
}

type SigninResponse {
  refreshToken: String
  accessToken: String
}

type RefetchAccessTokenResponse {
  accessToken: String
}

scalar Upload

type Query {
  authUser: UserPublic!
}

type Mutation {
  signup(
    fullName: String!
    email: String!
    username: String!
    password: String!
    avatar: Upload!
  ): UserPublic!
  signin(
    identifier: String!
    password: String!
  ): SigninResponse!
  signout: UserPublic!
  refetchAccessToken: RefetchAccessTokenResponse!
}
`;

export default userTypeDef;
