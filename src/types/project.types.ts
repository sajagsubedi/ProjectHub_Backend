export enum CategoryType {
  Web = "Web",
  Mobile = "Mobile",
  AI = "AI",
  DataScience = "Data Science",
  Other = "Other",
}
export enum StatusType {
  Idea = "Idea",
  Designing = "Designing",
  Pending = "Pending",
  InProgress = "InProgress",
  Closed = "Closed",
  Open = "Open",
}

export interface createProjectInputType {
  projectName: string;
  description: string;
  motive?: string;
  category?: CategoryType;
  status?: StatusType;
  startDate?: Date;
  deadline?: Date;
  techStack?: string[];
  features?: string[];
  links: {
    source?: string;
    deployment?: string;
  };
  tutorials?: string[];
}
