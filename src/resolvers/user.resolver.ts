import { GraphQLError } from "graphql";
import { verifyRefreshToken } from "../middlewares/verifyRefreshToken";
import UserModel from "../models/user.model";
import { SignupInputType, SigninInputType } from "../types/user.types";
import { Response, Request } from "express";
import { GraphQLUpload } from "graphql-upload-minimal";
import cloudinary from "../utils/cloudinary";
import { CloudinaryUploadResult } from "../types/upload.types";

const userResolver = {
  Upload: GraphQLUpload,
  Query: {
    authUser: async (_: any, __: any, { req }: { req: Request }) => {
      // Fetch the user
      const user = await verifyRefreshToken(req);
      if (!user) {
        throw new GraphQLError("You are not logged in", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Fetch the user without password and refreshToken
      const existingUser = await UserModel.findById(user._id).select(
        "-password -refreshToken"
      );
      if (!existingUser) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      return existingUser; // Return UserPublic directly
    },
  },
  Mutation: {
    signup: async (_: any, args: SignupInputType) => {
      const { fullName, email, username, password, avatar } = args;

      // Input validation
      if ([username, email, fullName, password].some((field) => !field?.trim())) {
        throw new GraphQLError("All fields are required", {
          extensions: {
            code: "BAD_REQUEST",
            field: "input",
          },
        });
      }
      if (!avatar) {
        throw new GraphQLError("Avatar is required", {
          extensions: {
            code: "BAD_REQUEST",
            field: "avatar",
          },
        });
      }

      // Check for existing user
      const existingUser = await UserModel.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        throw new GraphQLError("Username or email already exists", {
          extensions: {
            code: existingUser.email === email ? "EMAIL_ALREADY_EXISTS" : "USERNAME_ALREADY_EXISTS",
            field: existingUser.email === email ? "email" : "username",
          },
        });
      }

      // Handle avatar upload to Cloudinary
      const { createReadStream } = await avatar;
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "projecthub", resource_type: "image" },
          (error, result) =>
            error ? reject(error) : resolve(result as CloudinaryUploadResult)
        );
        createReadStream().pipe(uploadStream).on("error", reject);
      });

      // Create user
      const user = await UserModel.create({
        fullName,
        username,
        email,
        password,
        avatar: { public_id: result.public_id, url: result.secure_url },
      });

      const createdUser = await UserModel.findById(user._id).select(
        "-password -refreshToken"
      );
      if (!createdUser) {
        throw new GraphQLError("Failed to fetch created user", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
      }

      return createdUser; // Return UserPublic directly
    },
    signin: async (_: any, args: SigninInputType, { res }: { res: Response }) => {
      const { identifier, password } = args;

      // Check if any fields are empty
      if ([identifier, password].some((field) => !field?.trim())) {
        throw new GraphQLError("All fields are required", {
          extensions: {
            code: "BAD_REQUEST",
            field: "input",
          },
        });
      }

      // Check if the user exists
      const existingUser = await UserModel.findOne({
        $or: [{ username: identifier }, { email: identifier }],
      });
      if (!existingUser) {
        throw new GraphQLError("User does not exist with the given username or email", {
          extensions: {
            code: "NOT_FOUND",
            field: "identifier",
          },
        });
      }

      // Check if the password is correct
      const isPasswordCorrect = await existingUser.isPasswordCorrect(password);
      if (!isPasswordCorrect) {
        throw new GraphQLError("Incorrect password", {
          extensions: {
            code: "INVALID_CREDENTIALS",
            field: "password",
          },
        });
      }

      // Generate access and refresh tokens
      const accessToken = existingUser.generateAccessToken();
      const refreshToken = existingUser.generateRefreshToken();

      // Update refresh token in the database
      existingUser.refreshToken = refreshToken;
      await existingUser.save();

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };

      // Set cookies
      res.cookie("refreshToken", refreshToken, cookieOptions);
      res.cookie("accessToken", accessToken, cookieOptions);

      return { refreshToken, accessToken }; // Return SigninResponse
    },
    signout: async (_: any, __: any, { req, res }: { req: Request; res: Response }) => {
      // Fetch the user
      const user = await verifyRefreshToken(req);
      if (!user) {
        throw new GraphQLError("You are not logged in", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Clear refresh token in the database
      const updatedUser = await UserModel.findByIdAndUpdate(
        user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
      ).select("-password -refreshToken");
      if (!updatedUser) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };

      // Clear cookies
      res.clearCookie("refreshToken", cookieOptions);
      res.clearCookie("accessToken", cookieOptions);

      return updatedUser; // Return UserPublic
    },
    refetchAccessToken: async (_: any, __: any, { req, res }: { req: Request; res: Response }) => {
      // Fetch the user
      const existingUser = await verifyRefreshToken(req);
      if (!existingUser) {
        throw new GraphQLError("You are not logged in", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Generate access token
      const accessToken = existingUser.generateAccessToken();

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };

      // Set access token in cookie
      res.cookie("accessToken", accessToken, cookieOptions);

      return { accessToken }; // Return RefetchAccessTokenResponse
    },
  },
};

export default userResolver;