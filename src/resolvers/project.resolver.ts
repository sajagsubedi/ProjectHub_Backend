import ProjectModel from "../models/project.model";
import { User } from "../models/user.model";
import { createProjectInputType } from "../types/project.types";
import { ApiError } from "../utils/ApiError";

const projectResolver = {
  Query: {
    getAllProjects: async (_: any, __: any, { user }: { user: User }) => {
      try {
        if (!user || !user._id) {
          throw new ApiError(401, "Unauthorized access");
        }
        console.log(user);
        // Fetch all projects from the database
        const projects = await ProjectModel.find({
          userId: user._id,
        });
        return {
          success: true,
          message: "Projects fetched successfully!",
          projects,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof ApiError ? error.message : "Something went wrong!",
        };
      }
    },
  },
  Mutation: {
    createProject: async (
      _: any,
      args: createProjectInputType,
      { user }: { user: User }
    ) => {
      try {
        if (!user) {
          throw new ApiError(401, "Unauthorized access");
        }
        const { projectName, description } = args;
        if ([projectName, description].some((field) => field.trim() == "")) {
          throw new ApiError(400, "Project name and description is required!");
        }
        const createdProject = await ProjectModel.create({
          ...args,
          userId: user._id,
        });
        console.log("Created Project", createdProject);
        return {
          success: true,
          message: "Project created successfully!",
          Project: createdProject,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof ApiError ? error.message : "Something went wrong!",
        };
      }
    },
  },
};

export default projectResolver;
