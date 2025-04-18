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
      // Fetch all projects from the database
      const projects = await ProjectModel.find({
        userId: user._id,
      }).sort({ isPinned: -1, updatedAt: -1 });
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
      const createdProject = await ProjectModel.create({
        ...args,
        userId: user._id,
      });
      return createdProject; // Return Project
    },
    editProject: async (
      _: any,
      args: { id: string } & Partial<createProjectInputType> & {
          isPinned?: boolean;
        },
      { user }: { user: User }
    ) => {
      if (!user) {
        throw new GraphQLError("Unauthorized access", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      const { id, ...updateData } = args;

      if (!mongoose.isValidObjectId(id)) {
        throw new GraphQLError("Invalid Project id", {
          extensions: {
            code: "BAD_REQUEST",
            field: "id",
          },
        });
      }

      // Check if project exists and belongs to the user
      const existingProject = await ProjectModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: user._id,
      });

      if (!existingProject) {
        throw new GraphQLError("Project not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      // Update the project
      const updatedProject = await ProjectModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      return updatedProject;
    },
    pinProject: async (
      _: any,
      args: { id: string },
      { user }: { user: User }
    ) => {
      if (!user) {
        throw new GraphQLError("Unauthorized access", {
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

      // Check if project exists and belongs to the user
      const existingProject = await ProjectModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: user._id,
      });

      if (!existingProject) {
        throw new GraphQLError("Project not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      // Check if user already has 3 pinned projects
      const pinnedProjects = await ProjectModel.find({
        isPinned: true,
        userId: user._id,
      });

      // If trying to pin a new project and already have 3 pinned
      if (!existingProject.isPinned && pinnedProjects.length >= 3) {
        throw new GraphQLError("Maximum limit of 3 pinned projects reached", {
          extensions: {
            code: "BAD_REQUEST",
            field: "isPinned",
          },
        });
      }

      // Toggle the isPinned status
      existingProject.isPinned = !existingProject.isPinned;
      await existingProject.save();

      return existingProject;
    },
    deleteProject: async (
      _: any,
      args: { id: string },
      { user }: { user: User }
    ) => {
      if (!user) {
        throw new GraphQLError("Unauthorized access", {
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

      // Check if project exists and belongs to the user
      const existingProject = await ProjectModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: user._id,
      });

      if (!existingProject) {
        throw new GraphQLError("Project not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      // Delete the project
      const deletedProject = await ProjectModel.findByIdAndDelete(id);

      return deletedProject;
    },
  },
};

export default projectResolver;
