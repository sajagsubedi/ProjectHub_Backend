const projectTypeDefs = `
#graphql

enum CategoryType {
  Web
  Mobile
  AI
  DataScience
  Other
}   

enum StatusType {
  Idea
  Designing
  Pending
  InProgress
  Closed
  Open
}

type DraftUi {
  url: String!
  public_id: String!
}

type Links {
  source: String
  deployment: String
}

type Project {
  _id: ID!
  userId: ID!
  projectName: String!
  description: String!
  motive: String
  category: CategoryType
  status: StatusType
  startDate: String
  deadline: String
  techStack: [String]
  features: [String]
  draftUi: [DraftUi]
  links: Links
  tutorials: [String]
  isPinned: Boolean
}

type Query {
  getAllProjects: [Project]
  getProjectById(id: ID!): Project
  getPinnedProjects: [Project]
}

input LinksInput {
  source: String
  deployment: String
}

type Mutation {
  createProject(
    projectName: String!
    description: String!
    motive: String
    techStack: [String]
    features: [String]
    startDate: String
    deadLine: String
    links: LinksInput
    tutorials: [String]
  ): Project
}`;

export default projectTypeDefs;
