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
}

type GetAllProjectsResponse {
  success: Boolean
  message: String
  projects: [Project]
}

type Query {
  getAllProjects: GetAllProjectsResponse
  getProjectById(id: ID!): Project
}
`;

export default projectTypeDefs;
