import { verifyRefreshToken } from "../middlewares/verifyRefreshToken";
import UserModel from "../models/user.model";
import { SignupInputType, SigninInputType } from "../types/user.types";
import { ApiError } from "../utils/ApiError";
import { Response, Request } from "express";

const userResolver = {
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
        const { fullName, email, username, password } = args;

        //check if any of the fields are empty
        if (
          [username, email, fullName, password].some(
            (field) => field == null || field.trim() === ""
          )
        ) {
          throw new ApiError(400, "All fields are required");
        }

        //check if the user already exists with the same username or email
        const existingUser = await UserModel.findOne({
          $or: [{ username }, { email }],
        });
        if (existingUser) {
          throw new ApiError(
            400,
            "User already exists with the given username or email"
          );
        }

        //create the user
        const user = await UserModel.create({
          fullName,
          username,
          email,
          password,
        });

        //fetch the created user without password and refreshToken
        const createdUser = await UserModel.findById(user._id).select(
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
          message: "User registered successfully. Proceed to sign in",
          user: createdUser,
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
