const userTypeDef =`
#graphql
type User {
  _id: ID!
  username: String!
  email: String!
  fullName: String!
  avatar: Avatar!
  password: String!
  refreshToken: String
  createdAt: String
  updatedAt: String
}

type Avatar {
  url: String!
  public_id: String!
}
type Query{
  user:User!
}

`;
export default userTypeDef;
