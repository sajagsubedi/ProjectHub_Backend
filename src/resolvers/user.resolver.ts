import User from "../models/user.model";
import { SignupDataType } from "../types/user.types";
import { ApiError } from "../utils/ApiError";

const userResolver = {
  Query: {},
  Mutation: {
    signup: async (_: any, args: SignupDataType) => {
      try {
        const { fullName, email, username, password, confpassword } = args;

        //check if any of the fields are empty
        if (
          [username, email, fullName, password].some(
            (field) => field == null || field.trim() === ""
          )
        ) {
          throw new ApiError(400, "All fields are required");
        }

        //check if password and confpassword are the same
        if (password !== confpassword) {
          throw new ApiError(400, "Passwords do not match");
        }

        //check if the user already exists with the same username or email
        const existingUser = await User.findOne({
          $or: [{ username }, { email }],
        });
        if (existingUser) {
          throw new ApiError(
            400,
            "User already exists with the same username or email"
          );
        }

        //create the user
        const user = await User.create({ fullName, username, email, password });

        //fetch the created user without password and refreshToken
        const createdUser = await User.findById(user._id).select(
          "-password -refreshToken"
        );
        if (!createdUser) {
          throw new ApiError(
            500,
            "Something went wrong while creating the user"
          );
        }

        //send response
        return {
          success: true,
          message: "User created successfully",
          user: createdUser,
        };
      } catch (error) {
        //log the error to the console for debugging
        console.log("Error creating user:", error);

        //send error response
        if (error instanceof ApiError) {
          return {
            success: false,
            message: error.message,
          };
        }

        return {
          success: false,
          message: "Something went wrong",
        };
      }
    },
  },
};

export default userResolver;
