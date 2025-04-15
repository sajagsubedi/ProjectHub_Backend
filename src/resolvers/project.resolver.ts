import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import { User } from "../models/user.model";
import { createProjectInputType } from "../types/project.types";

const projectResolver = {
  Query: {
    getAllProjects: async (_: any, __: any, { user }: { user: User }) => {
      if (!user || !user._id) {
        throw new GraphQLError("Unauthorized access", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
      console.log(user);
      // Fetch all projects from the database
      const projects = await ProjectModel.find({
        userId: user._id,
      });
      return projects; // Return [Project]
    },
    getProjectById: async (
      _: any,
      args: { id: string },
      { user }: { user: User }
    ) => {
      if (!user) {
        throw new GraphQLError("Unauthorized access!", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
      const { id } = args;
      if (!mongoose.isValidObjectId(id)) {
        throw new GraphQLError("Invalid Project id", {
          extensions: {
            code: "BAD_REQUEST",
            field: "id",
          },
        });
      }
      const existingProject = await ProjectModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: user._id,
      });
      console.log(existingProject);
      return existingProject; // Return Project (nullable)
    },
    getPinnedProjects: async (_: any, __: any, { user }: { user: User }) => {
      if (!user) {
        throw new GraphQLError("Unauthorized access!", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
      const pinnedProjects = await ProjectModel.find({
        userId: user._id,
        isPinned: true,
      });
      return pinnedProjects; // Return [Project]
    },
  },
  Mutation: {
    createProject: async (
      _: any,
      args: createProjectInputType,
      { user }: { user: User }
    ) => {
      if (!user) {
        throw new GraphQLError("Unauthorized access", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
      const { projectName, description } = args;
      if ([projectName, description].some((field) => field.trim() == "")) {
        throw new GraphQLError("Project name and description is required!", {
          extensions: {
            code: "BAD_REQUEST",
            field: !projectName?.trim() ? "projectName" : "description",
          },
        });
      }
      console.log(args)
      const createdProject = await ProjectModel.create({
        ...args,
        userId: user._id,
      });
      console.log("Created Project", createdProject);
      return createdProject; // Return Project
    },
  },
};

export default projectResolver;
