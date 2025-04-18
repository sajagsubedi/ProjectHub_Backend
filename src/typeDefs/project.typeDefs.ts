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

type Tutorials{
  url:String!
  label:String!
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
  category: CategoryType!
  status: StatusType!
  startDate: String
  deadline: String
  techStack: [String]
  features: [String]
  draftUi: [DraftUi]
  links: Links
  tutorials: [Tutorials]
  isPinned: Boolean!
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
input TutorialsInput{
  label:String!
  url:String!
}

type Mutation {
  createProject(
    projectName: String!
    description: String!
    motive: String
    category:CategoryType
    status:StatusType
    techStack: [String]
    features: [String]
    startDate: String
    deadline: String
    links: LinksInput
    tutorials: [TutorialsInput]
  ): Project

  editProject(
    id: ID!
    projectName: String
    description: String
    motive: String
    category: CategoryType
    status: StatusType
    techStack: [String]
    features: [String]
    startDate: String
    deadline: String
    links: LinksInput
    tutorials: [TutorialsInput]
    isPinned: Boolean
  ): Project

  pinProject(id: ID!): Project

  deleteProject(id: ID!): Project
}
`;

export default projectTypeDefs;
