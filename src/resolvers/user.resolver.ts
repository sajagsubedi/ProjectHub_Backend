import { verifyRefreshToken } from "../middlewares/verifyRefreshToken";
import User from "../models/user.model";
import { SignupInputType, SigninInputType } from "../types/user.types";
import { ApiError } from "../utils/ApiError";
import { Response, Request } from "express";

const userResolver = {
  Query: {},
  Mutation: {
    signup: async (_: any, args: SignupInputType) => {
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
        const existingUser = await User.findOne({
          $or: [{ username: identifier }, { email: identifier }],
        });
        if (!existingUser) {
          throw new ApiError(
            400,
            "User does not exist with the same username or email"
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
    signout: async (
      _: any,
      __: any,
      { req, res }: { req: Request; res: Response }
    ) => {
      try {
        //fetch the user
        const user = await verifyRefreshToken(req);

        if (!user) {
          return {
            success: false,
            message: "You are not logged in",
          };
        }

        //update the refresh token in the database
        await User.findByIdAndUpdate(
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
        //log the error to the console for debugging
        console.log("Error signing out user:", error);

        //send error response
        return {
          success: false,
          message: "Something went wrong",
        };
      }
    },
  },
};

export default userResolver;
