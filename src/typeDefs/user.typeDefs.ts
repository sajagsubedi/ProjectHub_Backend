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

type AuthResponse {
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
  ): AuthResponse!
  signout: UserPublic!
  refetchAccessToken: AuthResponse!
}
`;

export default userTypeDef;
