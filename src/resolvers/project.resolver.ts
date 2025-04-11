import ProjectModel from "../models/project.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
const projectResolver = {
  Query: {
    getAllProjects: async (_: any, __: any, { user }: { user: User }) => {
      try {
        if (!user) {
          throw new ApiError(401, "Unauthorized access");
        }
        // Fetch all projects from the database
        const projects = await ProjectModel.find({
          userID: user._id,
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
  Mutation: {},
};

export default projectResolver;
