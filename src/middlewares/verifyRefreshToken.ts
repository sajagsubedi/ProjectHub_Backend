import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import UserModel from "../models/user.model";

interface CustomJwtPayload extends JwtPayload {
  _id: string;
}

export const verifyRefreshToken = async (req: Request) => {
  const token = req.headers?.refreshToken || req.cookies?.refreshToken;
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET || "projecthub123"
    ) as CustomJwtPayload;

    const existingUser = await UserModel.findById(decoded?._id).select(
      "-password"
    );

    if (!existingUser) {
      return null;
    }

    if (existingUser.refreshToken != token) {
      return null;
    }
    return existingUser;
  } catch (error) {
    return null;
  }
};
