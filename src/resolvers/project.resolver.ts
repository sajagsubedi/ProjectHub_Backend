import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import { User } from "../models/user.model";
import { createProjectInputType } from "../types/project.types";
import cloudinary from "../utils/cloudinary";
import { CloudinaryUploadResult, FileUpload } from "../types/upload.types";

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

      //delete draft ui images from cloudinary
      deletedProject?.draftUi?.map(async (image) => {
        await cloudinary.uploader.destroy(image.public_id);
      });

      return deletedProject;
    },
    editDraftUi: async (
      _: any,
      args: {
        id: string;
        files: Promise<FileUpload>[];
        order: { url?: string; public_id?: string; index_id?: number }[];
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

      const { id, files, order } = args;

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

      // Handle file uploads
      const uploadPromises = files.map(async (file) => {
        const { createReadStream } = await file;
        const result = await new Promise<CloudinaryUploadResult>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "projecthub", resource_type: "image" },
              (error, result) =>
                error
                  ? reject(error)
                  : resolve(result as CloudinaryUploadResult)
            );
            createReadStream().pipe(uploadStream).on("error", reject);
          }
        );

        return {
          url: result.secure_url,
          public_id: result.public_id,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Combine existing draft UI with new uploads
      const updatedDraftUi = order.map((item) => {
        if (item.url && item.public_id) {
          return {
            url: item.url,
            public_id: item.public_id,
          };
        }
        if (item.index_id || item.index_id == 0) {
          return uploadedFiles[item.index_id];
        }
      });

      //filter out the images stored in db
      const dbImages = order.filter((img) => img.public_id !== undefined);
      const deletedImages = existingProject.draftUi?.filter(
        (existing) =>
          !dbImages.some((dbimg) => dbimg.public_id === existing.public_id)
      ); //filter out the images to be deleted from cloudinary

      //delete image from cloudinary
      deletedImages?.map(async (image) => {
        await cloudinary.uploader.destroy(image.public_id);
      });

      // Update the project with new draft UI
      const updatedProject = await ProjectModel.findByIdAndUpdate(
        id,
        { $set: { draftUi: updatedDraftUi } },
        { new: true }
      );

      return updatedProject;
    },
  },
};

export default projectResolver;
