import mongoose from "mongoose";

enum CategoryType {
  Web = "Web",
  Mobile = "Mobile",
  AI = "AI",
  DataScience = "Data Science",
  Other = "Other",
}
enum StatusType {
  Idea = "Idea",
  Designing = "Designing",
  Pending = "Pending",
  InProgress = "InProgress",
  Closed = "Closed",
  Open = "Open",
}

export interface Project extends mongoose.Document {
  projectName: string;
  description?: string;
  motive?: string;
  category?: CategoryType;
  status?: StatusType;
  startDate?: Date;
  deadline?: Date;
  techStack?: string[];
  features?: string[];
  draftUi?: {
    url: string;
    public_id: string;
  }[];
  links?: {
    source?: string;
    deployment?: string;
  };
  tutorials?: string[];
}

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    motive: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Web", "Mobile", "AI", "Data Science", "Other"],
      default: "Other",
    },
    status: {
      type: String,
      enum: ["Idea", "Designing", "Pending", "InProgress", "Closed", "Open"],
      default: "Pending",
    },
    startDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    draftUi: {
      type: [
        {
          url: {
            type: String,
            trim: true,
          },
          public_id: {
            type: String,
            trim: true,
          },
        },
      ],
    },
    links: {
      source: {
        type: String, // GitHub or GitLab repo link
        trim: true,
      },
      deployment: {
        type: String, // Live site URL
        trim: true,
      },
    },
    tutorials: [
      {
        type: String, // Links to tutorials or guides
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
