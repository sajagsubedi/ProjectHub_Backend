import { verifyRefreshToken } from "../middlewares/verifyRefreshToken";
import UserModel from "../models/user.model";
import { SignupInputType, SigninInputType } from "../types/user.types";
import { ApiError } from "../utils/ApiError";
import { Response, Request } from "express";
import { GraphQLUpload } from "graphql-upload-minimal";
import cloudinary from "../utils/cloudinary";
import { CloudinaryUploadResult } from "../types/upload.types";

const userResolver = {
  Upload: GraphQLUpload,
  Query: {
    authUser: async (_: any, __: any, { req }: { req: Request }) => {
      try {
        //fetch the user
        const user = await verifyRefreshToken(req);

        if (!user) {
          throw new ApiError(401, "You are not logged in");
        }

        //fetch the user without password and refreshToken
        const existingUser = await UserModel.findById(user._id).select(
          "-password -refreshToken"
        );
        if (!existingUser) {
          throw new ApiError(404, "User not found");
        }

        return {
          success: true,
          message: "User fetched successfully",
          isAuthenticated: true,
          user: existingUser,
        };
      } catch (error) {
        //send error response
        if (error instanceof ApiError) {
          return {
            success: false,
            message: error.message,
            isAuthenticated: false,
            user: null,
          };
        }

        return {
          success: false,
          message: "Something went wrong",
          isAuthenticated: false,
          user: null,
        };
      }
    },
  },
  Mutation: {
    signup: async (_: any, args: SignupInputType) => {
      try {
        const { fullName, email, username, password, avatar } = args;

        // Input validation
        if (
          [username, email, fullName, password].some((field) => !field?.trim())
        ) {
          throw new ApiError(400, "All fields are required");
        }
        if (!avatar) throw new ApiError(400, "Avatar is required");

        // Check for existing user
        const existingUser = await UserModel.findOne({
          $or: [{ username }, { email }],
        });
        if (existingUser) {
          throw new ApiError(400, "Username or email already exists");
        }

        // Handle avatar upload to Cloudinary
        const { createReadStream } = await avatar;
        const result = await new Promise<CloudinaryUploadResult>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "projecthub", resource_type: "image" }, // Specify resource_type for safety
              (error, result) =>
                error
                  ? reject(error)
                  : resolve(result as CloudinaryUploadResult)
            );
            createReadStream().pipe(uploadStream).on("error", reject);
          }
        );

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
        if (!createdUser)
          throw new ApiError(500, "Failed to fetch created user");

        return {
          success: true,
          message: "User registered successfully. Proceed to sign in",
          user: createdUser,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          message:
            error instanceof ApiError ? error.message : "Something went wrong",
          user: null, // Ensure schema compliance
        };
      }
    },
    signin: async (
      _: any,
      args: SigninInputType,
      { res }: { res: Response }
    ) => {
      try {
        const { identifier, password } = args;

        //check if any of the fields are empty
        if (
          [identifier, password].some(
            (field) => field == null || field.trim() === ""
          )
        ) {
          throw new ApiError(400, "All fields are required");
        }

        //check if the user exists with the same username or email
        const existingUser = await UserModel.findOne({
          $or: [{ username: identifier }, { email: identifier }],
        });
        if (!existingUser) {
          throw new ApiError(
            400,
            "User does not exist with the given username or email"
          );
        }

        //check if the password is correct
        const isPasswordCorrect = await existingUser.isPasswordCorrect(
          password
        );
        if (!isPasswordCorrect) {
          throw new ApiError(400, "Incorrect password");
        }

        //generate access token and refresh token
        const accessToken = existingUser.generateAccessToken();
        const refreshToken = existingUser.generateRefreshToken();

        console.log("Refresh Token: ", refreshToken);
        console.log("Access Token: ", accessToken);

        //update the refresh token in the database
        existingUser.refreshToken = refreshToken;
        await existingUser.save();

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        };

        //set the refresh token in the cookie
        res.cookie("refreshToken", refreshToken, cookieOptions);

        //set the access token in the cookie
        res.cookie("accessToken", accessToken, cookieOptions);

        //send response
        return {
          success: true,
          message: "User signed in successfully",
          refreshToken,
          accessToken,
        };
      } catch (error) {
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
    signout: async (
      _: any,
      __: any,
      { req, res }: { req: Request; res: Response }
    ) => {
      try {
        //fetch the user
        const user = await verifyRefreshToken(req);

        if (!user) {
          throw new ApiError(401, "You are not logged in");
        }

        //update the refresh token in the database
        await UserModel.findByIdAndUpdate(
          user._id,
          {
            $unset: {
              refreshToken: 1,
            },
          },
          {
            new: true,
          }
        );

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        };

        //clear the refresh token cookie
        res.clearCookie("refreshToken", cookieOptions);

        //clear the access token cookie
        res.clearCookie("accessToken", cookieOptions);

        //send response
        return {
          success: true,
          message: "User signed out successfully",
        };
      } catch (error) {
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
    refetchAccessToken: async (
      _: any,
      __: any,
      { req, res }: { req: Request; res: Response }
    ) => {
      try {
        //fetch the user
        const existingUser = await verifyRefreshToken(req);

        if (!existingUser) {
          throw new ApiError(401, "You are not logged in");
        }

        //generate access token
        const accessToken = existingUser.generateAccessToken();

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        };

        //set the access token in the cookie
        res.cookie("accessToken", accessToken, cookieOptions);

        //send response
        return {
          success: true,
          message: "Access token refetched successfully",
          accessToken,
        };
      } catch (error) {
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
